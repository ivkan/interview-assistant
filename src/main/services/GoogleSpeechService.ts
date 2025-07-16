import { SpeechClient } from '@google-cloud/speech'
import { EventEmitter } from 'events'

export interface GoogleSpeechConfig {
  credentialsPath?: string
  projectId?: string
  language: string
  sampleRateHertz: number
  encoding: string
}

export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence?: number
  languageCode?: string
}

export class GoogleSpeechService extends EventEmitter {
  private speechClient: SpeechClient | null = null
  private recognizeStream: any = null
  private isStreaming = false
  private streamStartTime = 0
  private config: GoogleSpeechConfig

  constructor(config: GoogleSpeechConfig) {
    super()
    this.config = config
    this.initializeClient()
  }

  private initializeClient() {
    try {
      // Initialize Google Cloud Speech client with service account credentials
      const clientConfig: any = {}
      
      if (this.config.credentialsPath) {
        // Use explicit credentials path
        clientConfig.keyFilename = this.config.credentialsPath
      }
      
      if (this.config.projectId) {
        clientConfig.projectId = this.config.projectId
      }
      
      this.speechClient = new SpeechClient(clientConfig)
    } catch (error) {
      this.emit('error', `Failed to initialize Google Speech client: ${error}`)
    }
  }

  private createRecognizeStream() {
    if (!this.speechClient) {
      throw new Error('Speech client not initialized')
    }

    const request = {
      config: {
        encoding: this.config.encoding as any,
        sampleRateHertz: this.config.sampleRateHertz,
        languageCode: this.config.language === 'en' ? 'en-US' : this.config.language,
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        enableWordConfidence: true,
        enableSpeakerDiarization: false,
        model: 'command_and_search', // Use working model from reference
        useEnhanced: true,
        profanityFilter: false
      },
      interimResults: true
    }

    this.recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on('error', (error: any) => {
        console.error('Google Speech API error:', error)
        this.emit('error', error)
        // Only restart on errors that are not about destroyed streams
        if (!error.message?.includes('stream was destroyed')) {
          this.restartStream()
        }
      })
      .on('data', (data: any) => {
        this.handleTranscriptionData(data)
      })
      .on('end', () => {
        console.log('Stream ended naturally')
        // Don't automatically restart on end - let the data handler decide
      })

    this.streamStartTime = Date.now()
  }

  private handleTranscriptionData(data: any) {
    console.log('📨 Raw Google Speech data received:', JSON.stringify(data, null, 2))
    
    if (data.results && data.results.length > 0) {
      // Find the result with highest stability (most confident)
      let bestResult = data.results[0]
      let bestStability = bestResult.stability || 0
      
      for (const result of data.results) {
        const stability = result.stability || 0
        if (stability > bestStability) {
          bestResult = result
          bestStability = stability
        }
      }
      
      if (bestResult.alternatives?.[0]) {
        const alternative = bestResult.alternatives[0]
        
        console.log(`📝 Transcription result: "${alternative.transcript}" (isFinal: ${bestResult.isFinal}, confidence: ${alternative.confidence}, stability: ${bestStability})`)
        
        const transcriptionResult: TranscriptionResult = {
          text: alternative.transcript,
          isFinal: bestResult.isFinal,
          confidence: alternative.confidence,
          languageCode: this.config.language
        }

        this.emit('transcription', transcriptionResult)

        // Only restart stream on final results that have actual content
        // Don't restart on empty final results to avoid unnecessary restarts
        if (bestResult.isFinal && alternative.transcript.trim()) {
          console.log('✅ Final result with content received, restarting stream...')
          this.restartStream()
        } else if (bestResult.isFinal && !alternative.transcript.trim()) {
          console.log('⚠️ Empty final result, not restarting stream')
        }
      }
    } else {
      console.log('⚠️ No transcription results in data:', data)
    }
  }


  private restartStream() {
    if (this.recognizeStream && this.isStreaming) {
      console.log('Restarting Google Speech stream...')
      
      // Safely end the current stream (like reference implementation)
      if (!this.recognizeStream.destroyed) {
        this.recognizeStream.end()
      }
      this.recognizeStream = null
      
      // Create new stream after a short delay
      setTimeout(() => {
        if (this.isStreaming) {
          this.createRecognizeStream()
        }
      }, 100)
    }
  }

  public startStreaming() {
    if (this.isStreaming) {
      console.log('Stream already started, skipping...')
      return
    }

    console.log('Starting Google Speech stream...')
    this.isStreaming = true
    this.createRecognizeStream()
    this.emit('started')
  }

  public stopStreaming() {
    if (!this.isStreaming) {
      return
    }

    this.isStreaming = false
    
    if (this.recognizeStream) {
      this.recognizeStream.end()
      this.recognizeStream = null
    }

    this.emit('stopped')
  }

  public pauseStreaming() {
    if (this.recognizeStream && this.isStreaming) {
      this.recognizeStream.pause()
      this.emit('paused')
    }
  }

  public resumeStreaming() {
    if (this.recognizeStream && this.isStreaming) {
      this.recognizeStream.resume()
      this.emit('resumed')
    }
  }

  public writeAudio(audioData: Buffer) {
    if (this.recognizeStream && this.isStreaming && !this.recognizeStream.destroyed) {
      try {
        this.recognizeStream.write(audioData)
        // Only log occasionally to avoid flooding
        if (Math.random() < 0.01) {
          console.log(`✅ Audio data written to stream (${audioData.length} bytes)`)
        }
      } catch (error) {
        console.error('❌ Error writing audio data:', error)
        this.emit('error', error)
      }
    } else {
      console.log('⚠️ Cannot write audio - stream not ready:', {
        hasStream: !!this.recognizeStream,
        isStreaming: this.isStreaming,
        destroyed: this.recognizeStream?.destroyed
      })
    }
  }

  public updateConfig(newConfig: Partial<GoogleSpeechConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // Reinitialize client if credentials changed
    if (newConfig.credentialsPath || newConfig.projectId) {
      this.initializeClient()
    }
    
    // Restart stream if language or other config changed
    if (this.isStreaming && (newConfig.language || newConfig.sampleRateHertz || newConfig.encoding)) {
      this.restartStream()
    }
  }

  public isActive(): boolean {
    return this.isStreaming
  }

  public destroy() {
    this.stopStreaming()
    this.speechClient = null
    this.removeAllListeners()
  }
}