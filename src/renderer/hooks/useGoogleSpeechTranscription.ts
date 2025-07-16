import { useState, useEffect, useCallback, useRef } from 'react'
import { useInterviewStore } from '../store/interviewStore'
import { useSettingsStore } from '../store/settingsStore'
import { useSafeAudioCapture } from './useSafeAudioCapture'

export interface TranscriptionResult {
  text: string
  isFinal: boolean
  confidence?: number
  languageCode?: string
}

export interface TranscriptionError {
  message: string
  code?: string
}

export function useGoogleSpeechTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<TranscriptionError | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [partialTranscript, setPartialTranscript] = useState<string>('')
  const partialTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { isActive, isPaused, addTranscriptEntry } = useInterviewStore()
  const { apiKeys, transcriptionSettings } = useSettingsStore()
  
  const audioBufferRef = useRef<Float32Array[]>([])
  const isInitializedRef = useRef(false)

  // Handle audio data from capture hook
  const handleAudioData = useCallback((samples: Float32Array, sampleRate: number) => {
    if (!isTranscribing || isPaused || !isActive) {
      return
    }

    // Convert Float32Array to Int16Array for Google Speech API
    const int16Buffer = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) {
      // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, samples[i]))
      int16Buffer[i] = Math.round(sample * 32767)
    }

    // Prepare audio data for IPC transfer
    const audioData = {
      samples: Array.from(int16Buffer), // Convert to regular array for IPC
      sampleRate: sampleRate,
      isInt16: true // Flag to indicate format
    }
    
    // Send to main process via IPC
    if (window.electronAPI) {
      window.electronAPI.invoke('transcription:send-audio', audioData)
        .catch((error: any) => {
          console.error('❌ Failed to send audio data:', error)
          setError({ message: 'Failed to send audio data', code: 'AUDIO_SEND_ERROR' })
        })
    } else {
      console.error('❌ window.electronAPI not available')
    }
  }, [isTranscribing, isPaused, isActive])

  // Initialize audio capture
  const audioCapture = useSafeAudioCapture({
    onAudioData: handleAudioData
  })

  // Handle transcription results from main process
  useEffect(() => {
    if (!window.electronAPI) return

    const handleTranscriptionResult = (result: TranscriptionResult) => {
      if (result.isFinal && result.text.trim()) {
        addTranscriptEntry(result.text.trim())
        setPartialTranscript('') // Clear partial transcript when final result arrives
        
        // Clear any pending partial transcript timeout
        if (partialTranscriptTimeoutRef.current) {
          clearTimeout(partialTranscriptTimeoutRef.current)
          partialTranscriptTimeoutRef.current = null
        }
      } else if (!result.isFinal && result.text.trim()) {
        // Debounce partial transcript updates to avoid rapid changes
        if (partialTranscriptTimeoutRef.current) {
          clearTimeout(partialTranscriptTimeoutRef.current)
        }
        
        partialTranscriptTimeoutRef.current = setTimeout(() => {
          setPartialTranscript(result.text.trim())
        }, 300) // 300ms debounce
      }
    }

    const handleTranscriptionError = (error: TranscriptionError) => {
      console.error('Transcription error:', error)
      setError(error)
      setConnectionStatus('disconnected')
    }

    const handleTranscriptionStarted = () => {
      setConnectionStatus('connected')
      setIsTranscribing(true)
      setError(null)
    }

    const handleTranscriptionStopped = () => {
      setConnectionStatus('disconnected')
      setIsTranscribing(false)
    }

    const handleTranscriptionPaused = () => {
      // Keep connection status as connected since it's just paused
    }

    const handleTranscriptionResumed = () => {
      // Connection is already established, just resumed
    }

    // Register IPC listeners
    window.electronAPI.on('transcription:result', handleTranscriptionResult)
    window.electronAPI.on('transcription:error', handleTranscriptionError)
    window.electronAPI.on('transcription:started', handleTranscriptionStarted)
    window.electronAPI.on('transcription:stopped', handleTranscriptionStopped)
    window.electronAPI.on('transcription:paused', handleTranscriptionPaused)
    window.electronAPI.on('transcription:resumed', handleTranscriptionResumed)

    return () => {
      window.electronAPI.removeAllListeners('transcription:result')
      window.electronAPI.removeAllListeners('transcription:error')
      window.electronAPI.removeAllListeners('transcription:started')
      window.electronAPI.removeAllListeners('transcription:stopped')
      window.electronAPI.removeAllListeners('transcription:paused')
      window.electronAPI.removeAllListeners('transcription:resumed')
    }
  }, [addTranscriptEntry])

  // Start transcription
  const startTranscription = useCallback(async () => {
    if (isTranscribing) {
      return
    }

    setConnectionStatus('connecting')
    setError(null)

    try {
      const config = {
        language: transcriptionSettings.language || 'en-US',
        sampleRateHertz: 16000,
        encoding: 'LINEAR16'
      }

      const result = await window.electronAPI.invoke('transcription:start', config)
      
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Failed to start transcription:', error)
      setError({ message: error.message || 'Failed to start transcription', code: 'START_ERROR' })
      setConnectionStatus('disconnected')
    }
  }, [transcriptionSettings.language, isTranscribing])

  // Stop transcription
  const stopTranscription = useCallback(async () => {
    if (!isTranscribing) {
      return
    }

    try {
      await window.electronAPI.invoke('transcription:stop')
    } catch (error: any) {
      console.error('Failed to stop transcription:', error)
      setError({ message: error.message || 'Failed to stop transcription', code: 'STOP_ERROR' })
    }
  }, [isTranscribing])

  // Pause transcription
  const pauseTranscription = useCallback(async () => {
    if (!isTranscribing) {
      return
    }

    try {
      await window.electronAPI.invoke('transcription:pause')
    } catch (error: any) {
      console.error('Failed to pause transcription:', error)
      setError({ message: error.message || 'Failed to pause transcription', code: 'PAUSE_ERROR' })
    }
  }, [isTranscribing])

  // Resume transcription
  const resumeTranscription = useCallback(async () => {
    if (!isTranscribing) {
      return
    }

    try {
      await window.electronAPI.invoke('transcription:resume')
    } catch (error: any) {
      console.error('Failed to resume transcription:', error)
      setError({ message: error.message || 'Failed to resume transcription', code: 'RESUME_ERROR' })
    }
  }, [isTranscribing])

  // Update language configuration
  const updateLanguage = useCallback(async (language: string) => {
    if (!isTranscribing) {
      return
    }

    try {
      await window.electronAPI.invoke('transcription:update-config', { language })
    } catch (error: any) {
      console.error('Failed to update language:', error)
      setError({ message: error.message || 'Failed to update language', code: 'UPDATE_ERROR' })
    }
  }, [isTranscribing])

  // Handle interview state changes
  useEffect(() => {
    const handleInterviewStateChange = async () => {
      if (isActive && !isTranscribing && !isPaused) {
        await startTranscription()
      } else if (!isActive && isTranscribing) {
        await stopTranscription()
      }
    }

    handleInterviewStateChange()
  }, [isActive, isTranscribing, isPaused, startTranscription, stopTranscription])

  // Handle pause/resume
  useEffect(() => {
    const handlePauseResume = async () => {
      if (isActive && isTranscribing) {
        if (isPaused) {
          await pauseTranscription()
        } else {
          await resumeTranscription()
        }
      }
    }

    handlePauseResume()
  }, [isPaused, isActive, isTranscribing, pauseTranscription, resumeTranscription])

  // Handle language changes
  useEffect(() => {
    if (isTranscribing) {
      updateLanguage(transcriptionSettings.language || 'en-US')
    }
  }, [transcriptionSettings.language, isTranscribing, updateLanguage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTranscribing) {
        stopTranscription()
      }
    }
  }, [])

  return {
    isTranscribing,
    error,
    connectionStatus,
    partialTranscript,
    audioCapture,
    startTranscription,
    stopTranscription,
    pauseTranscription,
    resumeTranscription,
    updateLanguage
  }
}