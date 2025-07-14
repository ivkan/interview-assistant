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
  private audioProcessor: any = null // For AudioWorklet when available

  async initialize() {
    // Initialization if needed
  }

  async startCapture(config: AudioCaptureConfig = {}) {
    if (this.isCapturing) {
      console.warn('Audio capture already in progress')
      return
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
      
      // Try to use AudioWorklet if available (modern approach)
      const ctx = this.audioContext
      if (ctx && ctx.audioWorklet && false) { // Disabled for now
        try {
          await ctx.audioWorklet.addModule('/audio-processor.js')
          this.audioProcessor = new (window as any).AudioWorkletNode(ctx, 'audio-processor')
          this.microphoneSource!.connect(this.audioProcessor)
          
          this.audioProcessor.port.onmessage = (event: MessageEvent) => {
            if (event.data.type === 'audio-data') {
              this.emit('audio-data', event.data.samples, event.data.sampleRate)
            }
          }
        } catch (error) {
          console.warn('AudioWorklet not available, using alternative approach:', error)
        }
      }

      // Use alternative approach: periodic sampling with AnalyserNode
      this.isCapturing = true
      this.startAudioMonitoring()

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

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Float32Array(this.analyser.fftSize)

    let lastEmitTime = 0
    const EMIT_INTERVAL = 100 // Emit audio data every 100ms

    const monitor = () => {
      if (!this.isCapturing) return

      // Get frequency data for visualization
      this.analyser!.getByteFrequencyData(dataArray)
      
      // Calculate audio level
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      const normalizedLevel = average / 255
      
      this.emit('audio-level', normalizedLevel)

      // Emit audio data periodically for transcription
      const now = Date.now()
      if (now - lastEmitTime > EMIT_INTERVAL) {
        // Get time domain data (actual audio samples)
        this.analyser!.getFloatTimeDomainData(timeDataArray)
        
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