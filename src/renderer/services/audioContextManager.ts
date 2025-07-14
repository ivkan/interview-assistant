// Singleton manager for AudioContext to prevent multiple instances and crashes
class AudioContextManager {
  private static instance: AudioContextManager
  private audioContext: AudioContext | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager()
    }
    return AudioContextManager.instance
  }

  async getAudioContext(): Promise<AudioContext> {
    // If we already have a context, return it
    if (this.audioContext && this.audioContext.state !== 'closed') {
      return this.audioContext
    }

    // Create new context with proper error handling
    try {
      // In Electron, we need to wait for user interaction sometimes
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000
      })

      // Resume if suspended (common in Electron)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.isInitialized = true
      console.log('✅ AudioContext created successfully:', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate
      })

      return this.audioContext
    } catch (error) {
      console.error('❌ Failed to create AudioContext:', error)
      throw new Error('Failed to initialize audio. Please ensure audio permissions are granted.')
    }
  }

  async closeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close()
        console.log('✅ AudioContext closed')
      } catch (error) {
        console.warn('Failed to close AudioContext:', error)
      }
      this.audioContext = null
      this.isInitialized = false
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.audioContext !== null && this.audioContext.state === 'running'
  }
}

export const audioContextManager = AudioContextManager.getInstance()