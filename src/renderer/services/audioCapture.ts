import { EventEmitter } from '../utils/EventEmitter'

interface AudioCaptureConfig {
  microphoneDeviceId?: string
  systemAudioSourceId?: string
  sampleRate?: number
  echoCancellation?: boolean
  noiseSuppression?: boolean
}

export class AudioCaptureService extends EventEmitter {
  private microphoneStream: MediaStream | null = null
  private systemAudioStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private microphoneSource: MediaStreamAudioSourceNode | null = null
  private systemAudioSource: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private isCapturing = false

  async initialize() {
    // Request microphone permissions and get devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      
      // Send devices to main process
      await window.electronAPI.getAudioDevices(audioInputs)
      
      return audioInputs
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      throw error
    }
  }

  async startCapture(config: AudioCaptureConfig = {}) {
    if (this.isCapturing) {
      console.warn('Audio capture already in progress')
      return
    }

    try {
      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: config.sampleRate || 48000
      })

      // Get microphone stream
      const microphoneConstraints: MediaStreamConstraints = {
        audio: {
          deviceId: config.microphoneDeviceId,
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: true
        }
      }

      this.microphoneStream = await navigator.mediaDevices.getUserMedia(microphoneConstraints)
      this.microphoneSource = this.audioContext.createMediaStreamSource(this.microphoneStream)

      // Get system audio if source ID provided
      if (config.systemAudioSourceId) {
        try {
          // @ts-ignore - getDisplayMedia with audio constraint for Chrome
          this.systemAudioStream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
              // @ts-ignore - Chrome-specific constraint
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: config.systemAudioSourceId
              }
            } as any,
            video: {
              // @ts-ignore - Chrome-specific constraint  
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: config.systemAudioSourceId
              }
            } as any
          })

          // Remove video track if present
          const videoTracks = this.systemAudioStream.getVideoTracks()
          videoTracks.forEach(track => {
            track.stop()
            this.systemAudioStream!.removeTrack(track)
          })

          if (this.systemAudioStream.getAudioTracks().length > 0) {
            this.systemAudioSource = this.audioContext.createMediaStreamSource(this.systemAudioStream)
          }
        } catch (error) {
          console.warn('Failed to capture system audio:', error)
        }
      }

      // Create script processor for audio processing
      const bufferSize = 4096
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      // Connect audio sources to processor
      if (this.microphoneSource) {
        this.microphoneSource.connect(this.processor)
      }
      if (this.systemAudioSource) {
        this.systemAudioSource.connect(this.processor)
      }

      // Process audio data
      this.processor.onaudioprocess = (event) => {
        if (!this.isCapturing) return

        const inputData = event.inputBuffer.getChannelData(0)
        const samples = Array.from(inputData)

        // Send to main process
        window.electronAPI.sendAudioData({
          samples,
          sampleRate: this.audioContext!.sampleRate
        })

        // Emit raw audio data for transcription
        this.emit('audio-data', inputData, this.audioContext!.sampleRate)

        // Emit locally for visualization
        this.emit('audio-level', this.calculateAudioLevel(inputData))
      }

      // Connect processor to destination (required for Chrome)
      this.processor.connect(this.audioContext.destination)

      this.isCapturing = true
      this.emit('capture-started')

      // Notify main process
      await window.electronAPI.startAudioCapture()

    } catch (error) {
      console.error('Failed to start audio capture:', error)
      this.stopCapture()
      throw error
    }
  }

  async stopCapture() {
    this.isCapturing = false

    // Stop all tracks
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }

    if (this.systemAudioStream) {
      this.systemAudioStream.getTracks().forEach(track => track.stop())
      this.systemAudioStream = null
    }

    // Disconnect audio nodes
    if (this.microphoneSource) {
      this.microphoneSource.disconnect()
      this.microphoneSource = null
    }

    if (this.systemAudioSource) {
      this.systemAudioSource.disconnect()
      this.systemAudioSource = null
    }

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }

    this.emit('capture-stopped')

    // Notify main process
    await window.electronAPI.stopAudioCapture()
  }

  private calculateAudioLevel(samples: Float32Array): number {
    let sum = 0
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i]
    }
    const rms = Math.sqrt(sum / samples.length)
    const db = 20 * Math.log10(rms)
    return Math.max(0, Math.min(100, (db + 60) / 60 * 100))
  }

  isActive(): boolean {
    return this.isCapturing
  }

  async getSystemAudioSources() {
    const result = await window.electronAPI.getSystemAudioSources()
    if (result.success) {
      return result.sources
    }
    throw new Error(result.error || 'Failed to get system audio sources')
  }
}

export const audioCaptureService = new AudioCaptureService()