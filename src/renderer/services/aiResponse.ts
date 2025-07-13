import { EventEmitter } from '../utils/EventEmitter'

export interface AIProvider {
  name: 'openai' | 'deepseek'
  model: string
  apiKey: string
}

export interface ResponseContext {
  question: string
  resume?: string
  background?: string
  previousQuestions?: string[]
  interviewType?: string
  position?: string
}

export interface AIResponse {
  content: string
  isComplete: boolean
  provider: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class AIResponseService extends EventEmitter {
  private provider: AIProvider
  private isStreaming = false

  constructor(provider: AIProvider) {
    super()
    this.provider = provider
  }

  async generateResponse(context: ResponseContext): Promise<void> {
    if (this.isStreaming) {
      console.warn('Already generating response')
      return
    }

    this.isStreaming = true
    this.emit('start')

    try {
      if (this.provider.name === 'openai') {
        await this.generateOpenAIResponse(context)
      } else if (this.provider.name === 'deepseek') {
        await this.generateDeepSeekResponse(context)
      }
    } catch (error) {
      console.error('AI Response error:', error)
      this.emit('error', error)
    } finally {
      this.isStreaming = false
      this.emit('end')
    }
  }

  private async generateOpenAIResponse(context: ResponseContext): Promise<void> {
    const systemPrompt = this.buildSystemPrompt(context)
    const userPrompt = this.buildUserPrompt(context)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.provider.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    await this.processStreamingResponse(response, 'openai')
  }

  private async generateDeepSeekResponse(context: ResponseContext): Promise<void> {
    const systemPrompt = this.buildSystemPrompt(context)
    const userPrompt = this.buildUserPrompt(context)

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.provider.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`)
    }

    await this.processStreamingResponse(response, 'deepseek')
  }

  private async processStreamingResponse(response: Response, provider: string): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              this.emit('chunk', {
                content: '',
                isComplete: true,
                provider,
                model: this.provider.model
              })
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              
              if (content) {
                this.emit('chunk', {
                  content,
                  isComplete: false,
                  provider,
                  model: this.provider.model
                })
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private buildSystemPrompt(context: ResponseContext): string {
    let prompt = `You are an AI interview assistant helping a candidate prepare for their interview. Your role is to provide helpful, concise, and relevant answers to interview questions.

Guidelines:
- Provide clear, structured answers
- Keep responses concise but comprehensive (2-4 sentences typically)
- Focus on practical examples when possible
- Be encouraging and professional
- If the question is technical, provide accurate technical information
- If the question is behavioral, suggest STAR method approaches

`

    if (context.resume) {
      prompt += `Candidate's Background:
${context.resume}

`
    }

    if (context.background) {
      prompt += `Additional Context:
${context.background}

`
    }

    if (context.position) {
      prompt += `Position: ${context.position}
`
    }

    if (context.interviewType) {
      prompt += `Interview Type: ${context.interviewType}
`
    }

    return prompt
  }

  private buildUserPrompt(context: ResponseContext): string {
    let prompt = `Please provide a helpful answer for this interview question: "${context.question}"`

    if (context.previousQuestions && context.previousQuestions.length > 0) {
      prompt += `\n\nPrevious questions in this interview:
${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    return prompt
  }

  updateProvider(provider: AIProvider) {
    this.provider = provider
  }

  getProvider(): AIProvider {
    return this.provider
  }

  isGenerating(): boolean {
    return this.isStreaming
  }
}

export const createAIResponseService = (provider: AIProvider) => {
  return new AIResponseService(provider)
}