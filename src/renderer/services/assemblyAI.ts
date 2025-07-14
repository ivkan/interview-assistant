import { EventEmitter } from '../utils/EventEmitter'

export interface TranscriptionConfig {
  apiKey: string
  language?: string
  punctuate?: boolean
  format_text?: boolean
  dual_channel?: boolean
  speaker_labels?: boolean
}

export interface TranscriptionResult {
  message_type: string
  audio_start: number
  audio_end: number
  text: string
  words?: Array<{
    text: string
    start: number
    end: number
    confidence: number
  }>
  confidence?: number
  created?: string
  is_final?: boolean
}

export class AssemblyAIService extends EventEmitter {
  private socket: WebSocket | null = null
  private sessionToken: string | null = null
  private isConnected = false
  private config: TranscriptionConfig
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(config: TranscriptionConfig) {
    super()
    this.config = config
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('AssemblyAI already connected')
      return
    }

    try {
      // Get session token from AssemblyAI
      const tokenResponse = await fetch('https://api.assemblyai.com/v2/realtime/token', {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expires_in: 3600 // 1 hour
        })
      })

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get session token: ${tokenResponse.statusText}`)
      }

      const tokenData = await tokenResponse.json()
      this.sessionToken = tokenData.token

      // Connect to WebSocket
      await this.connectWebSocket()
    } catch (error) {
      if (this.config.apiKey.includes('test_')) {
        console.warn('🧪 Using test API key - AssemblyAI connection will fail (this is expected)')
      } else {
        console.error('Failed to connect to AssemblyAI:', error)
      }
      throw error
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionToken) {
        reject(new Error('No session token available'))
        return
      }

      const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=48000&token=${this.sessionToken}`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('AssemblyAI WebSocket connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
        resolve()
      }

      this.socket.onmessage = (event) => {
        try {
          const data: TranscriptionResult = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing AssemblyAI message:', error)
        }
      }

      this.socket.onclose = (event) => {
        console.log('AssemblyAI WebSocket closed:', event.code, event.reason)
        this.isConnected = false
        this.emit('disconnected')
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect()
        }
      }

      this.socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error)
        this.emit('error', error)
        reject(error)
      }
    })
  }

  private handleMessage(data: TranscriptionResult) {
    this.emit('message', data)

    switch (data.message_type) {
      case 'SessionBegins':
        this.emit('session-begin', data)
        break
      case 'PartialTranscript':
        this.emit('partial-transcript', data)
        break
      case 'FinalTranscript':
        this.emit('final-transcript', data)
        break
      case 'SessionTerminated':
        this.emit('session-terminated', data)
        break
      default:
        console.log('Unknown message type:', data.message_type)
    }
  }

  private attemptReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect to AssemblyAI (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)
    
    setTimeout(async () => {
      try {
        await this.connectWebSocket()
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }, delay)
  }

  sendAudio(audioData: ArrayBuffer) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('AssemblyAI WebSocket not connected')
      return
    }

    try {
      this.socket.send(audioData)
    } catch (error) {
      console.error('Error sending audio data:', error)
    }
  }

  sendAudioFromSamples(samples: Float32Array, sampleRate: number = 48000) {
    // Convert Float32Array to PCM16
    const pcm16 = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      // Convert from [-1, 1] to [-32768, 32767]
      pcm16[i] = Math.max(-32768, Math.min(32767, samples[i] * 32767))
    }

    // Send as ArrayBuffer
    this.sendAudio(pcm16.buffer)
  }

  async disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
      this.socket = null
    }
    this.isConnected = false
    this.sessionToken = null
    this.emit('disconnected')
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }

  updateConfig(newConfig: Partial<TranscriptionConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

export const createAssemblyAIService = (config: TranscriptionConfig) => {
  return new AssemblyAIService(config)
}