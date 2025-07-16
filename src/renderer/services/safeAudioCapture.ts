import { EventEmitter } from '../utils/EventEmitter'
import { audioContextManager } from './audioContextManager'

interface AudioCaptureConfig {
  microphoneDeviceId?: string
  systemAudioSourceId?: string
  sampleRate?: number
  echoCancellation?: boolean
  noiseSuppression?: boolean
}

export class SafeAudioCaptureService extends EventEmitter {
  private microphoneStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private microphoneSource: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private isCapturing = false
  private animationId: number | null = null
  private audioProcessor: AudioWorkletNode | null = null
  private isWorkletSupported = false

  async initialize() {
    // Initialization if needed
  }

  async startCapture(config: AudioCaptureConfig = {}) {
    if (this.isCapturing) {
      console.warn('Audio capture already in progress')
      return
    }
    
    // Additional check to prevent race conditions
    if (this.microphoneStream || this.audioContext) {
      console.warn('Audio resources already initialized, stopping previous capture')
      await this.stopCapture()
    }

    try {
      // Get audio context from manager
      this.audioContext = await audioContextManager.getAudioContext()
      console.log('✅ Got audio context from manager')

      // Get microphone stream
      const microphoneConstraints: MediaStreamConstraints = {
        audio: {
          deviceId: config.microphoneDeviceId,
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: true
        }
      }

      try {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints)
        this.microphoneSource = this.audioContext.createMediaStreamSource(this.microphoneStream)
        console.log('✅ Microphone stream created')
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          console.error('Microphone permission denied')
          this.emit('error', new Error('Microphone permission denied. Please allow access to continue.'))
          throw new Error('Microphone permission denied')
        } else if (error.name === 'NotFoundError') {
          console.error('No microphone found')
          this.emit('error', new Error('No microphone found. Please connect a microphone.'))
          throw new Error('No microphone found')
        } else {
          console.error('Failed to get microphone access:', error)
          throw error
        }
      }

      // Create analyser for audio levels
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
      
      // Connect microphone to analyser
      this.microphoneSource.connect(this.analyser)
      
      // Try to use AudioWorklet for optimal performance
      const ctx = this.audioContext
      if (ctx && ctx.audioWorklet) {
        try {
          // Load the audio worklet processor
          await ctx.audioWorklet.addModule('/audioProcessor.worklet.js')
          this.audioProcessor = new AudioWorkletNode(ctx, 'audio-processor')
          this.microphoneSource!.connect(this.audioProcessor)
          
          // Handle messages from the worklet
          this.audioProcessor.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'audio') {
              // Convert ArrayBuffer back to Float32Array for compatibility
              const int16Data = new Int16Array(event.data.data)
              const floatData = new Float32Array(int16Data.length)
              
              // Convert Int16 back to Float32 for level calculation
              for (let i = 0; i < int16Data.length; i++) {
                floatData[i] = int16Data[i] / 32767
              }
              
              // Emit the processed audio data
              this.emit('audio-data', floatData, event.data.sampleRate)
            } else if (event.data.type === 'config') {
              console.log('⚙️ Worklet configuration:', event.data)
            }
          }
          
          this.isWorkletSupported = true
          console.log('✅ AudioWorklet processor loaded successfully')
        } catch (error) {
          console.warn('AudioWorklet not available, falling back to alternative approach:', error)
          this.isWorkletSupported = false
        }
      }

      // Use alternative approach: periodic sampling with AnalyserNode (only if worklet not supported)
      this.isCapturing = true
      
      if (!this.isWorkletSupported) {
        console.log('📊 Using fallback audio monitoring (no worklet support)')
        this.startAudioMonitoring()
      } else {
        console.log('🎛️ Using AudioWorklet for audio processing')
        // Still start monitoring for audio levels even with worklet
        this.startAudioLevelMonitoring()
      }

      this.emit('capture-started')
      console.log('✅ Audio capture started successfully')

      // Notify main process
      await window.electronAPI.startAudioCapture()

    } catch (error) {
      console.error('Failed to start audio capture:', error)
      this.stopCapture()
      throw error
    }
  }

  private startAudioMonitoring() {
    if (!this.analyser || !this.audioContext) return

    const timeDataArray = new Float32Array(this.analyser.fftSize)

    let lastEmitTime = 0
    const EMIT_INTERVAL = 100 // Emit audio data every 100ms

    const monitor = () => {
      if (!this.isCapturing) return

      // Get time domain data for more accurate level calculation
      this.analyser!.getFloatTimeDomainData(timeDataArray)
      
      // Calculate RMS (Root Mean Square) for better audio level detection
      let sum = 0
      for (let i = 0; i < timeDataArray.length; i++) {
        sum += timeDataArray[i] * timeDataArray[i]
      }
      const rms = Math.sqrt(sum / timeDataArray.length)
      
      // Convert to decibels and normalize for better visualization
      const db = 20 * Math.log10(rms)
      const normalizedLevel = Math.max(0, Math.min(100, (db + 60) * 2)) // Map -60dB to 0, -30dB to 60, 0dB to 120 (clamped to 100)
      
      this.emit('audio-level', normalizedLevel)

      // Emit audio data periodically for transcription
      const now = Date.now()
      if (now - lastEmitTime > EMIT_INTERVAL) {
        // Use the same time domain data we already have
        
        // Send to main process and emit for transcription
        if (window.electronAPI) {
          window.electronAPI.sendAudioData({
            samples: Array.from(timeDataArray),
            sampleRate: this.audioContext!.sampleRate
          })
        }
        
        this.emit('audio-data', timeDataArray, this.audioContext!.sampleRate)
        lastEmitTime = now
      }

      this.animationId = requestAnimationFrame(monitor)
    }

    monitor()
  }

  private startAudioLevelMonitoring() {
    if (!this.analyser || !this.audioContext) return

    const timeDataArray = new Float32Array(this.analyser.fftSize)

    const monitor = () => {
      if (!this.isCapturing) return

      // Get time domain data for level calculation only
      this.analyser!.getFloatTimeDomainData(timeDataArray)
      
      // Calculate RMS (Root Mean Square) for better audio level detection
      let sum = 0
      for (let i = 0; i < timeDataArray.length; i++) {
        sum += timeDataArray[i] * timeDataArray[i]
      }
      const rms = Math.sqrt(sum / timeDataArray.length)
      
      // Convert to decibels and normalize for better visualization
      const db = 20 * Math.log10(rms)
      const normalizedLevel = Math.max(0, Math.min(100, (db + 60) * 2))
      
      this.emit('audio-level', normalizedLevel)

      this.animationId = requestAnimationFrame(monitor)
    }

    monitor()
  }

  async stopCapture() {
    this.isCapturing = false

    // Cancel animation frame
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // Stop all tracks
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }

    // Disconnect audio nodes
    if (this.microphoneSource) {
      this.microphoneSource.disconnect()
      this.microphoneSource = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect()
      this.audioProcessor = null
    }

    // Don't close the shared audio context
    this.audioContext = null

    this.emit('capture-stopped')

    // Notify main process
    await window.electronAPI.stopAudioCapture()
  }

  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      throw error
    }
  }

  async getSystemAudioSources() {
    // This would require screen capture API or Electron desktopCapturer
    // For now, return empty array
    return []
  }
}

// Create singleton instance
export const safeAudioCaptureService = new SafeAudioCaptureService()