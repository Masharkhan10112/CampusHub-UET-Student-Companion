/**
 * CampusHub AI Edge Function.
 *
 * Every AI feature in the app goes through here so the provider API key stays
 * server-side. The caller must present a valid Supabase access token; the
 * function never trusts a user id sent by the browser and never forwards
 * profile data to the provider beyond what the student typed into the form.
 *
 * Actions: chat | study_plan | quiz | summarize
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

import { AiConfigurationError, AiProviderError, type ChatMessage, getProvider } from './provider.ts'

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const requestLog = new Map<string, number[]>()

function rateLimited(userId: string) {
  const now = Date.now()
  const recent = (requestLog.get(userId) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  requestLog.set(userId, recent)
  return recent.length > RATE_LIMIT_MAX_REQUESTS
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  })
}

/** Models sometimes wrap JSON in prose or a ```json fence; recover the object. */
function parseJsonResponse<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = (fenced ? fenced[1] : raw).trim()
  try {
    return JSON.parse(candidate) as T
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as T
    }
    throw new AiProviderError('The AI response could not be understood. Please try again.')
  }
}

const TUTOR_SYSTEM_PROMPT = [
  'You are CampusHub Tutor, a patient university-level study assistant.',
  'Explain concepts at a student-friendly level, use short paragraphs and bullet lists,',
  'give concrete examples, and end long answers with a one-line recap.',
  'Use plain markdown. Never claim certainty about facts you are unsure of.',
].join(' ')

type ChatPayload = { messages: ChatMessage[] }
type StudyPlanPayload = {
  subject: string
  examDate: string
  hoursPerDay: number
  topics: string
  level: string
  preferredTime: string
}
type QuizPayload = {
  subject: string
  topic: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
}
type SummarizePayload = { notes: string }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header.' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'You must be signed in to use the AI assistant.' }, 401)
  }

  if (rateLimited(userData.user.id)) {
    return json({ error: 'Too many AI requests. Please wait a minute and try again.' }, 429)
  }

  let body: { action?: string; payload?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  try {
    const provider = getProvider()

    switch (body.action) {
      case 'chat': {
        const payload = body.payload as ChatPayload
        if (!Array.isArray(payload?.messages) || payload.messages.length === 0) {
          return json({ error: 'No message provided.' }, 400)
        }
        const history = payload.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 6000) }))

        const content = await provider.complete([
          { role: 'system', content: TUTOR_SYSTEM_PROMPT },
          ...history,
        ])
        return json({ content })
      }

      case 'study_plan': {
        const payload = body.payload as StudyPlanPayload
        if (!payload?.subject || !payload?.examDate) {
          return json({ error: 'Subject and exam date are required.' }, 400)
        }
        const content = await provider.complete(
          [
            {
              role: 'system',
              content:
                'You build realistic university revision schedules. Respond with JSON only, matching: ' +
                '{"title": string, "summary": string, "days": [{"day": string, "date": string, ' +
                '"blocks": [{"subject": string, "topic": string, "durationMinutes": number, ' +
                '"type": "study"|"revision"|"practice"|"break"}]}]}. ' +
                'Respect the available hours per day, include short breaks, and add revision and ' +
                'practice sessions before the exam date.',
            },
            {
              role: 'user',
              content: [
                `Exam or course: ${payload.subject}`,
                `Exam date: ${payload.examDate}`,
                `Available hours per day: ${payload.hoursPerDay}`,
                `Topics: ${payload.topics}`,
                `Current understanding level: ${payload.level}`,
                `Preferred study time: ${payload.preferredTime}`,
              ].join('\n'),
            },
          ],
          { json: true, temperature: 0.5, maxTokens: 2500 },
        )
        return json({ plan: parseJsonResponse(content) })
      }

      case 'quiz': {
        const payload = body.payload as QuizPayload
        if (!payload?.subject || !payload?.topic) {
          return json({ error: 'Subject and topic are required.' }, 400)
        }
        const count = Math.min(Math.max(Number(payload.questionCount) || 5, 1), 20)
        const content = await provider.complete(
          [
            {
              role: 'system',
              content:
                'You write university multiple-choice quizzes. Respond with JSON only, matching: ' +
                '{"questions": [{"question": string, "options": [string, string, string, string], ' +
                '"correctIndex": number, "explanation": string}]}. ' +
                'Exactly four options per question and exactly one correct answer.',
            },
            {
              role: 'user',
              content: `Subject: ${payload.subject}\nTopic: ${payload.topic}\nQuestions: ${count}\nDifficulty: ${payload.difficulty}`,
            },
          ],
          { json: true, temperature: 0.6, maxTokens: 2500 },
        )
        return json(parseJsonResponse(content))
      }

      case 'summarize': {
        const payload = body.payload as SummarizePayload
        if (!payload?.notes || payload.notes.trim().length < 40) {
          return json({ error: 'Please paste at least a short paragraph of notes.' }, 400)
        }
        const content = await provider.complete(
          [
            {
              role: 'system',
              content:
                'You summarise student notes. Respond with JSON only, matching: ' +
                '{"summary": string, "keyPoints": string[], ' +
                '"definitions": [{"term": string, "meaning": string}], "formulas": string[], ' +
                '"examQuestions": string[]}. Leave arrays empty when not applicable.',
            },
            { role: 'user', content: payload.notes.slice(0, 20000) },
          ],
          { json: true, temperature: 0.3, maxTokens: 2000 },
        )
        return json({ result: parseJsonResponse(content) })
      }

      default:
        return json({ error: `Unknown action "${body.action}".` }, 400)
    }
  } catch (error) {
    if (error instanceof AiConfigurationError) {
      return json({ error: error.message }, 503)
    }
    if (error instanceof AiProviderError) {
      return json({ error: error.message }, 502)
    }
    console.error('Unexpected AI function error', error)
    return json({ error: 'The AI request failed. Please try again.' }, 500)
  }
})
