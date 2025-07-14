import { EventEmitter } from '../utils/EventEmitter'

interface StreamingConfig {
  apiKey: string
  sampleRate?: number
}

export class AssemblyAIProxyService extends EventEmitter {
  private isConnected = false
  private config: StreamingConfig

  constructor(config: StreamingConfig) {
    super()
    this.config = {
      sampleRate: 16000,
      ...config
    }
    this.setupIPCHandlers()
  }

  private setupIPCHandlers(): void {
    if (!window.electronAPI) {
      console.error('ElectronAPI not available')
      return
    }

    // Listen for messages from main process
    window.electronAPI.onAssemblyAIMessage((message: any) => {
      this.handleMessage(message)
    })

    // Listen for disconnection events
    window.electronAPI.onAssemblyAIDisconnected((data: { code: number; reason: string }) => {
      console.log('AssemblyAI disconnected:', data.code, data.reason)
      this.isConnected = false
      this.emit('disconnected', data.code, data.reason)
    })
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to AssemblyAI')
      return
    }

    try {
      console.log('🔌 Connecting to AssemblyAI via main process...')
      const connected = await window.electronAPI.assemblyAIConnect({
        apiKey: this.config.apiKey,
        sampleRate: this.config.sampleRate
      })

      if (connected) {
        this.isConnected = true
        console.log('✅ Connected to AssemblyAI')
        this.emit('connected')
      } else {
        throw new Error('Failed to connect to AssemblyAI')
      }
    } catch (error) {
      console.error('Failed to connect to AssemblyAI:', error)
      throw error
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

  sendAudioData(audioData: Float32Array): void {
    if (!this.isConnected || !window.electronAPI) {
      console.warn('Not connected or ElectronAPI not available')
      return
    }

    try {
      // Convert Float32Array to 16-bit PCM for sending to main process
      const int16Array = new Int16Array(audioData.length)
      for (let i = 0; i < audioData.length; i++) {
        int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767))
      }

      // Convert to regular array for IPC transfer
      const audioArray = Array.from(int16Array)
      window.electronAPI.assemblyAISendAudio(audioArray)
    } catch (error) {
      console.error('Error sending audio data:', error)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected || !window.electronAPI) {
      return
    }

    try {
      await window.electronAPI.assemblyAIDisconnect()
      this.isConnected = false
      console.log('✅ Disconnected from AssemblyAI')
    } catch (error) {
      console.error('Error disconnecting from AssemblyAI:', error)
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export const createAssemblyAIProxyService = (config: StreamingConfig) => {
  return new AssemblyAIProxyService(config)
}