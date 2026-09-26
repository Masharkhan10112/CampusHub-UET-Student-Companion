/**
 * Provider abstraction for CampusHub's AI features.
 *
 * Everything the rest of the function needs is expressed as `complete(messages)`,
 * so swapping vendors means adding a branch here (or pointing AI_BASE_URL at any
 * OpenAI-compatible gateway) without touching the feature handlers.
 */

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type CompletionOptions = {
  temperature?: number
  maxTokens?: number
  json?: boolean
}

export interface AiProvider {
  readonly name: string
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>
}

export class AiConfigurationError extends Error {}
export class AiProviderError extends Error {}

type ProviderConfig = {
  apiKey: string
  model: string
  baseUrl: string
}

function readConfig(): ProviderConfig {
  const apiKey = Deno.env.get('AI_API_KEY')
  if (!apiKey) {
    throw new AiConfigurationError(
      'The AI assistant is not configured yet. Set the AI_API_KEY Edge Function secret.',
    )
  }
  return {
    apiKey,
    model: Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini',
    baseUrl: (Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
  }
}

/** OpenAI-compatible chat completions: OpenAI, Groq, Together, OpenRouter, Ollama, ... */
class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string
  readonly #config: ProviderConfig

  constructor(name: string, config: ProviderConfig) {
    this.name = name
    this.#config = config
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
    const response = await fetch(`${this.#config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.#config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.#config.model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 1800,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('AI provider error', response.status, detail)
      throw new AiProviderError(
        response.status === 429
          ? 'The AI provider is rate limiting requests. Please try again in a moment.'
          : 'The AI provider could not complete this request.',
      )
    }

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new AiProviderError('The AI provider returned an empty response.')
    }
    return content
  }
}

/** Google Gemini, which uses a different request/response shape. */
class GeminiProvider implements AiProvider {
  readonly name = 'gemini'
  readonly #config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.#config = config
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n')
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const baseUrl = this.#config.baseUrl.includes('generativelanguage')
      ? this.#config.baseUrl
      : 'https://generativelanguage.googleapis.com/v1beta'

    const response = await fetch(
      `${baseUrl}/models/${this.#config.model}:generateContent?key=${this.#config.apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            temperature: options.temperature ?? 0.4,
            maxOutputTokens: options.maxTokens ?? 1800,
            ...(options.json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      },
    )

    if (!response.ok) {
      const detail = await response.text()
      console.error('AI provider error', response.status, detail)
      throw new AiProviderError('The AI provider could not complete this request.')
    }

    const payload = await response.json()
    const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new AiProviderError('The AI provider returned an empty response.')
    }
    return content
  }
}

export function getProvider(): AiProvider {
  const config = readConfig()
  const provider = (Deno.env.get('AI_PROVIDER') ?? 'openai').toLowerCase()

  switch (provider) {
    case 'gemini':
    case 'google':
      return new GeminiProvider({
        ...config,
        model: Deno.env.get('AI_MODEL') ?? 'gemini-1.5-flash',
      })
    case 'openai':
    case 'groq':
    case 'openrouter':
    case 'together':
    case 'custom':
      return new OpenAiCompatibleProvider(provider, config)
    default:
      throw new AiConfigurationError(`Unknown AI_PROVIDER "${provider}".`)
  }
}
