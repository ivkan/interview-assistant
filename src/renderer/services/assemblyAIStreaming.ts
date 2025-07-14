import { EventEmitter } from '../utils/EventEmitter'

interface StreamingConfig {
  apiKey: string
  sampleRate?: number
  formatTurns?: boolean
}

export class AssemblyAIStreamingService extends EventEmitter {
  private ws: WebSocket | null = null
  private config: StreamingConfig
  private isConnected = false

  constructor(config: StreamingConfig) {
    super()
    this.config = {
      sampleRate: 16000,
      formatTurns: true,
      ...config
    }
  }

  async connect(): Promise<void> {
    if (this.ws) {
      console.warn('Already connected to AssemblyAI streaming service')
      return
    }

    try {
      // Use direct WebSocket connection with API key in headers (like the official example)
      const params = new URLSearchParams({
        sample_rate: this.config.sampleRate!.toString(),
        format_turns: this.config.formatTurns!.toString()
      })

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${params}`
      
      // For browser, we need to get token first then connect
      const token = await this.getTemporaryToken()
      const wsUrlWithToken = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${this.config.sampleRate}&token=${token}`
      
      this.ws = new WebSocket(wsUrlWithToken)
      
      this.setupEventHandlers()
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.ws!.onopen = () => {
          clearTimeout(timeout)
          console.log('✅ Connected to AssemblyAI streaming service')
          this.isConnected = true
          this.emit('connected')
          resolve()
        }

        this.ws!.onerror = (error) => {
          clearTimeout(timeout)
          console.error('❌ WebSocket connection error:', error)
          reject(error)
        }
      })
    } catch (error) {
      console.error('Failed to connect to AssemblyAI streaming:', error)
      throw error
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('AssemblyAI WebSocket closed:', event.code, event.reason)
      this.isConnected = false
      this.emit('disconnected', event.code, event.reason)
    }

    this.ws.onerror = (error) => {
      console.error('AssemblyAI WebSocket error:', error)
      this.emit('error', error)
    }
  }

  private handleMessage(data: any): void {
    const msgType = data.type

    if (msgType === 'Begin') {
      console.log(`Session began: ${data.id}`)
      this.emit('session-begin', data)
    } else if (msgType === 'Turn') {
      const transcript = data.transcript || ''
      const isFormatted = data.turn_is_formatted

      if (isFormatted) {
        // Final transcript
        this.emit('transcript-final', {
          text: transcript,
          confidence: data.confidence
        })
      } else {
        // Partial transcript
        this.emit('transcript-partial', {
          text: transcript
        })
      }
    } else if (msgType === 'Termination') {
      console.log('Session terminated:', data)
      this.emit('session-end', data)
    }
  }

  sendAudioData(audioData: Float32Array | ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send audio data')
      return
    }

    try {
      // Convert Float32Array to the format expected by AssemblyAI
      let buffer: ArrayBuffer
      
      if (audioData instanceof Float32Array) {
        // Convert Float32Array to 16-bit PCM (Int16Array)
        const int16Array = new Int16Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) {
          int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767))
        }
        buffer = int16Array.buffer
      } else {
        buffer = audioData
      }

      this.ws.send(buffer)
    } catch (error) {
      console.error('Error sending audio data:', error)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return

    try {
      // Send termination message
      if (this.ws.readyState === WebSocket.OPEN) {
        const terminateMessage = { type: 'Terminate' }
        this.ws.send(JSON.stringify(terminateMessage))
      }

      // Close WebSocket
      this.ws.close()
      this.ws = null
      this.isConnected = false
      
      console.log('✅ Disconnected from AssemblyAI streaming service')
    } catch (error) {
      console.error('Error disconnecting from AssemblyAI:', error)
    }
  }

  private async getTemporaryToken(): Promise<string> {
    console.log('🔑 Getting AssemblyAI token with API key:', this.config.apiKey?.substring(0, 8) + '...')
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expires_in: 3600 })
    })

    if (!response.ok) {
      console.error('❌ Token request failed:', response.status, response.statusText)
      throw new Error(`Failed to get token: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Token received successfully')
    return data.token
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }
}

export const createAssemblyAIStreamingService = (config: StreamingConfig) => {
  return new AssemblyAIStreamingService(config)
}