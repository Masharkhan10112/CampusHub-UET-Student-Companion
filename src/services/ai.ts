import { supabase } from '@/lib/supabase'
import type { NotesSummary, QuizDifficulty, QuizQuestion, StudyPlan } from '@/types/ai'
import type { AiConversation, AiMessage, QuizAttempt, StudyPlanRecord } from '@/types/models'

type AiAction = 'chat' | 'study_plan' | 'quiz' | 'summarize'

/**
 * All AI traffic goes through the `ai` Edge Function; the provider key never
 * reaches the browser. Errors returned by the function already carry a
 * student-friendly message.
 */
async function invokeAi<T>(action: AiAction, payload: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>('ai', {
    body: { action, payload },
  })

  if (error) {
    // supabase-js hides the JSON body of non-2xx responses inside the context.
    const response = (error as { context?: Response }).context
    if (response && typeof response.json === 'function') {
      try {
        const body = await response.clone().json()
        if (body?.error) throw new Error(body.error)
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message &&
          !/JSON/i.test(parseError.message)
        ) {
          throw parseError
        }
      }
    }
    throw new Error(error.message || 'The AI request failed. Please try again.')
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }

  return data as T
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export async function askTutor(messages: ChatTurn[]) {
  const { content } = await invokeAi<{ content: string }>('chat', { messages })
  return content
}

export async function generateStudyPlan(input: {
  subject: string
  examDate: string
  hoursPerDay: number
  topics: string
  level: string
  preferredTime: string
}) {
  const { plan } = await invokeAi<{ plan: StudyPlan }>('study_plan', input)
  return plan
}

export async function generateQuiz(input: {
  subject: string
  topic: string
  questionCount: number
  difficulty: QuizDifficulty
}) {
  const { questions } = await invokeAi<{ questions: QuizQuestion[] }>('quiz', input)
  return questions
}

export async function summarizeNotes(notes: string) {
  const { result } = await invokeAi<{ result: NotesSummary }>('summarize', { notes })
  return result
}

// --- conversation persistence ----------------------------------------------

export async function listConversations(): Promise<AiConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createConversation(title: string, userId: string): Promise<AiConversation> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, title: title.slice(0, 80) })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function renameConversation(id: string, title: string) {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ title: title.slice(0, 80) })
    .eq('id', id)
  if (error) throw error
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from('ai_conversations').delete().eq('id', id)
  if (error) throw error
}

export async function listMessages(conversationId: string): Promise<AiMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function saveMessage(params: {
  conversationId: string
  userId: string
  role: 'user' | 'assistant'
  content: string
}): Promise<AiMessage> {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
    })
    .select('*')
    .single()
  if (error) throw error

  await supabase
    .from('ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.conversationId)

  return data
}

// --- saved study plans and quiz attempts -----------------------------------

export async function listStudyPlans(): Promise<StudyPlanRecord[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveStudyPlan(
  input: { title: string; subject: string; examDate: string; hoursPerDay: number; plan: StudyPlan },
  userId: string,
): Promise<StudyPlanRecord> {
  const { data, error } = await supabase
    .from('study_plans')
    .insert({
      user_id: userId,
      title: input.title,
      subject: input.subject,
      exam_date: input.examDate,
      hours_per_day: input.hoursPerDay,
      plan: input.plan as unknown as StudyPlanRecord['plan'],
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteStudyPlan(id: string) {
  const { error } = await supabase.from('study_plans').delete().eq('id', id)
  if (error) throw error
}

export async function saveQuizAttempt(
  input: {
    subject: string
    topic: string
    difficulty: QuizDifficulty
    questions: QuizQuestion[]
    answers: (number | null)[]
    score: number
  },
  userId: string,
): Promise<QuizAttempt> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      subject: input.subject,
      topic: input.topic,
      difficulty: input.difficulty,
      questions: input.questions as unknown as QuizAttempt['questions'],
      answers: input.answers as unknown as QuizAttempt['answers'],
      score: input.score,
      total_questions: input.questions.length,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listQuizAttempts(limit = 10): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
