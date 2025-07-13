import { useState, useEffect, useCallback, useRef } from 'react'
import { AssemblyAIService, createAssemblyAIService, TranscriptionResult } from '../services/assemblyAI'
import { useInterviewStore } from '../store/interviewStore'

interface UseAssemblyAIProps {
  apiKey: string
  language?: string
  autoStart?: boolean
}

export function useAssemblyAI({ apiKey, language = 'en', autoStart = false }: UseAssemblyAIProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialTranscript, setPartialTranscript] = useState('')
  
  const serviceRef = useRef<AssemblyAIService | null>(null)
  const { isActive, addTranscriptEntry } = useInterviewStore()

  // Initialize service
  useEffect(() => {
    if (!apiKey) return

    const service = createAssemblyAIService({
      apiKey,
      language,
      punctuate: true,
      format_text: true
    })

    // Set up event listeners
    service.on('connected', () => {
      setIsConnected(true)
      setIsConnecting(false)
      setError(null)
      console.log('AssemblyAI connected successfully')
    })

    service.on('disconnected', () => {
      setIsConnected(false)
      setIsConnecting(false)
      setPartialTranscript('')
    })

    service.on('error', (err: Error) => {
      setError(err.message)
      setIsConnecting(false)
      console.error('AssemblyAI error:', err)
    })

    service.on('session-begin', (data: TranscriptionResult) => {
      console.log('AssemblyAI session started:', data)
    })

    service.on('partial-transcript', (data: TranscriptionResult) => {
      if (data.text) {
        setPartialTranscript(data.text)
      }
    })

    service.on('final-transcript', (data: TranscriptionResult) => {
      if (data.text && data.text.trim()) {
        // Add to transcript store
        addTranscriptEntry(data.text.trim())
        setPartialTranscript('') // Clear partial transcript
        console.log('Final transcript:', data.text)
      }
    })

    serviceRef.current = service

    // Auto-connect if specified and interview is active
    if (autoStart && isActive) {
      connect()
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect()
        serviceRef.current.removeAllListeners()
      }
    }
  }, [apiKey, language, autoStart])

  // Connect/disconnect based on interview state
  useEffect(() => {
    if (isActive && !isConnected && !isConnecting && apiKey) {
      connect()
    } else if (!isActive && isConnected) {
      disconnect()
    }
  }, [isActive, isConnected, isConnecting, apiKey])

  const connect = useCallback(async () => {
    if (!serviceRef.current || !apiKey) {
      setError('AssemblyAI service not initialized or API key missing')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      await serviceRef.current.connect()
    } catch (err: any) {
      setError(err.message)
      setIsConnecting(false)
    }
  }, [apiKey])

  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect()
    }
  }, [])

  const sendAudioData = useCallback((samples: Float32Array, sampleRate: number = 48000) => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.sendAudioFromSamples(samples, sampleRate)
    }
  }, [isConnected])

  const updateLanguage = useCallback((newLanguage: string) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig({ language: newLanguage })
    }
  }, [])

  return {
    isConnected,
    isConnecting,
    error,
    partialTranscript,
    connect,
    disconnect,
    sendAudioData,
    updateLanguage
  }
}