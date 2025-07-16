import { EventEmitter } from '../utils/EventEmitter'
import { getTextSegmentation, type TextSegment } from './textSegmentation'

export interface TranscriptEntry {
  id: string
  text: string
  timestamp: Date
  isFinal: boolean
  confidence: number
  language?: string
}

export interface WebSpeechConfig {
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  language?: string
  grammars?: string[]
}

export class WebSpeechRecognitionService extends EventEmitter {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private config: WebSpeechConfig
  private lastTranscriptId = 0
  private textSegmentation = getTextSegmentation()
  private lastProcessedResultIndex = 0
  private lastProcessedText = '' // Track the last processed cumulative text
  private segmentCallback: ((segments: TextSegment[]) => void) | null = null

  constructor(config: WebSpeechConfig = {}) {
    super()
    this.config = {
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      language: 'en-US',
      ...config
    }
    
    // Set up callback for segments from timer
    this.segmentCallback = (segments: TextSegment[]) => {
      segments.forEach(segment => {
        const entry: TranscriptEntry = {
          id: `transcript-${++this.lastTranscriptId}`,
          text: segment.text,
          timestamp: segment.timestamp,
          isFinal: segment.isComplete,
          confidence: 0.9,
          language: this.config.language
        }
        
        console.log('📤 Timer callback emitting transcript entry:', {
          id: entry.id,
          text: entry.text,
          isFinal: entry.isFinal
        })
        
        if (entry.isFinal) {
          this.emit('transcript', entry)
          this.emit('finalTranscript', entry)
        }
      })
    }
    
    this.textSegmentation.setSegmentCallback(this.segmentCallback)
    this.initializeRecognition()
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionAPI) {
      this.emit('error', new Error('Web Speech API not supported in this browser'))
      return
    }

    this.recognition = new SpeechRecognitionAPI()
    
    // Configure recognition
    if (this.recognition) {
      this.recognition.continuous = this.config.continuous!
      this.recognition.interimResults = this.config.interimResults!
      this.recognition.maxAlternatives = this.config.maxAlternatives!
      this.recognition.lang = this.config.language!
    }

    // Set up event handlers
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started')
      this.isListening = true
      this.emit('start')
    }

    this.recognition.onend = () => {
      console.log('🔇 Speech recognition ended')
      const wasListening = this.isListening
      this.isListening = false
      this.emit('end')
      
      // Restart if it was stopped unintentionally (with a short delay)
      if (wasListening) {
        setTimeout(() => {
          if (wasListening) {
            console.log('🔄 Auto-restarting speech recognition')
            this.start().catch(err => console.log('Auto-restart failed:', err))
          }
        }, 1000) // 1 second delay before restart
      }
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results
      
      // Build cumulative transcript from all results
      let cumulativeTranscript = ''
      let hasNewFinalResult = false
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        cumulativeTranscript += result[0].transcript
        
        // Check if this is a new final result
        if (result.isFinal && i >= this.lastProcessedResultIndex) {
          hasNewFinalResult = true
        }
      }
      
      // Extract only the new text that hasn't been processed yet
      const newText = cumulativeTranscript.substring(this.lastProcessedText.length).trim()
      
      console.log('🎬 WebSpeech processing results:', {
        totalResults: results.length,
        cumulativeTranscript: cumulativeTranscript.substring(0, 100) + '...',
        lastProcessedText: this.lastProcessedText.substring(0, 100) + '...',
        newText: newText.substring(0, 100) + '...',
        hasNewFinalResult,
        lastProcessedResultIndex: this.lastProcessedResultIndex
      })
      
      // Only process if we have new text
      if (newText) {
        // Use text segmentation to create proper segments
        const segments = this.textSegmentation.addText(newText, hasNewFinalResult)
        console.log('📝 Text segmentation returned:', segments.length, 'segments')
        
        // Emit segments as transcript entries
        segments.forEach(segment => {
          const entry: TranscriptEntry = {
            id: `transcript-${++this.lastTranscriptId}`,
            text: segment.text,
            timestamp: segment.timestamp,
            isFinal: segment.isComplete,
            confidence: 0.9,
            language: this.config.language
          }
          
          console.log('📤 Emitting transcript entry:', {
            id: entry.id,
            text: entry.text,
            isFinal: entry.isFinal
          })
          
          // Only emit final transcript entries (no partial ones)
          if (entry.isFinal) {
            this.emit('transcript', entry)
            this.emit('finalTranscript', entry)
          } else {
            console.log('⚠️ Skipping incomplete segment:', entry.text)
          }
        })
        
        // Update processed text tracking
        this.lastProcessedText = cumulativeTranscript
      }
      
      // Update processed result index for final results
      if (hasNewFinalResult) {
        // Find the last final result index
        for (let i = results.length - 1; i >= 0; i--) {
          if (results[i].isFinal) {
            this.lastProcessedResultIndex = i + 1
            console.log('📍 Updated lastProcessedResultIndex to:', this.lastProcessedResultIndex)
            break
          }
        }
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🚫 Speech recognition error:', event.error)
      
      let errorMessage = 'Speech recognition error'
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied'
          break
        case 'network':
          errorMessage = 'Network error occurred'
          break
        case 'aborted':
          errorMessage = 'Speech recognition aborted'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      this.emit('error', new Error(errorMessage))
      
      // Don't restart on permission errors
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        this.isListening = false
      }
    }

    this.recognition.onnomatch = () => {
      console.log('🤷 No speech match found')
      this.emit('nomatch')
    }

    this.recognition.onsoundstart = () => {
      this.emit('soundstart')
    }

    this.recognition.onsoundend = () => {
      this.emit('soundend')
    }

    this.recognition.onspeechstart = () => {
      this.emit('speechstart')
    }

    this.recognition.onspeechend = () => {
      this.emit('speechend')
    }

    this.recognition.onaudiostart = () => {
      this.emit('audiostart')
    }

    this.recognition.onaudioend = () => {
      this.emit('audioend')
    }
  }

  async start(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not available')
    }

    if (this.isListening) {
      console.log('Already listening')
      return
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Reset segmentation and processing index
      this.textSegmentation.reset()
      this.lastProcessedResultIndex = 0
      this.lastProcessedText = ''
      
      this.isListening = true
      this.recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      this.emit('error', error)
      throw error
    }
  }

  stop(): void {
    if (!this.recognition || !this.isListening) {
      return
    }

    this.isListening = false
    this.recognition.stop()
    
    // Process any remaining text in buffer as final
    const remainingSegments = this.textSegmentation.addText('', true)
    remainingSegments.forEach(segment => {
      const entry: TranscriptEntry = {
        id: `transcript-${++this.lastTranscriptId}`,
        text: segment.text,
        timestamp: segment.timestamp,
        isFinal: true,
        confidence: 0.9,
        language: this.config.language
      }
      
      this.emit('transcript', entry)
      this.emit('finalTranscript', entry)
    })
  }

  abort(): void {
    if (!this.recognition) {
      return
    }

    this.isListening = false
    this.recognition.abort()
  }

  setLanguage(language: string): void {
    this.config.language = language
    
    if (this.recognition) {
      this.recognition.lang = language
      
      // Restart recognition if it's currently active
      if (this.isListening) {
        this.stop()
        setTimeout(() => this.start(), 100)
      }
    }
  }

  getLanguage(): string {
    return this.config.language || 'en-US'
  }

  isAvailable(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  }

  getStatus(): { isListening: boolean; isAvailable: boolean; language: string } {
    return {
      isListening: this.isListening,
      isAvailable: this.isAvailable(),
      language: this.getLanguage()
    }
  }

  // Helper method to check microphone permission
  async checkMicrophonePermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      return result.state
    } catch (error) {
      // Fallback for browsers that don't support permission query
      console.warn('Permission API not supported, attempting direct access')
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        return 'granted'
      } catch {
        return 'denied'
      }
    }
  }

  // Get supported languages (static list of common languages)
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' }
    ]
  }
}

// Singleton instance
let instance: WebSpeechRecognitionService | null = null

export const getWebSpeechRecognition = (config?: WebSpeechConfig): WebSpeechRecognitionService => {
  if (!instance) {
    instance = new WebSpeechRecognitionService(config)
  }
  return instance
}

// Type definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    readonly [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    lang: string
    start(): void
    stop(): void
    abort(): void
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  }

  interface SpeechRecognitionConstructor {
    new(): SpeechRecognition
  }

  const SpeechRecognition: SpeechRecognitionConstructor
  const webkitSpeechRecognition: SpeechRecognitionConstructor
}