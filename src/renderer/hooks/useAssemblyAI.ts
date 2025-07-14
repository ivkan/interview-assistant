import { useState, useEffect, useCallback, useRef } from 'react'
import { AssemblyAIProxyService, createAssemblyAIProxyService } from '../services/assemblyAIProxy'
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
  
  const serviceRef = useRef<AssemblyAIProxyService | null>(null)
  const connectionAttemptRef = useRef<boolean>(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef<number>(0)
  const { isActive, addTranscriptEntry } = useInterviewStore()

  // Initialize service
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] 🔄 useAssemblyAI useEffect triggered - apiKey:`, apiKey?.substring(0, 8) + '...')
    if (!apiKey) {
      console.log(`[${new Date().toISOString()}] ❌ No API key provided`)
      return
    }

    const service = createAssemblyAIProxyService({
      apiKey,
      sampleRate: 48000
    })

    // Set up event listeners
    service.on('connected', () => {
      setIsConnected(true)
      setIsConnecting(false)
      setError(null)
      retryCountRef.current = 0 // Reset retry count on success
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

    service.on('session-begin', (data: any) => {
      console.log('AssemblyAI session started:', data)
    })

    service.on('transcript-partial', (data: any) => {
      if (data.text) {
        setPartialTranscript(data.text)
      }
    })

    service.on('transcript-final', (data: any) => {
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
    console.log(`[${new Date().toISOString()}] 🔄 useAssemblyAI connect/disconnect useEffect triggered:`, {
      isActive, isConnected, isConnecting, hasApiKey: !!apiKey
    })
    
    // Prevent multiple connection attempts
    if (isActive && !isConnected && !isConnecting && apiKey && !connectionAttemptRef.current) {
      console.log(`[${new Date().toISOString()}] 🔌 Triggering connect...`)
      connectionAttemptRef.current = true
      connect()
    } else if (!isActive && isConnected) {
      console.log(`[${new Date().toISOString()}] 🔌 Triggering disconnect...`)
      connectionAttemptRef.current = false
      disconnect()
    } else if (!isActive) {
      // Reset connection attempt flag when interview is not active
      connectionAttemptRef.current = false
    }
  }, [isActive, isConnected, apiKey]) // Removed isConnecting to prevent loops

  const connect = useCallback(async () => {
    if (!serviceRef.current || !apiKey) {
      console.error(`[${new Date().toISOString()}] ❌ AssemblyAI service not initialized or API key missing`)
      connectionAttemptRef.current = false
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      await serviceRef.current.connect()
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] ❌ AssemblyAI connection failed:`, err.message)
      setError(err.message)
      setIsConnecting(false)
      
      // Retry with exponential backoff (max 3 retries)
      if (retryCountRef.current < 3 && isActive) {
        retryCountRef.current++
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000)
        console.log(`[${new Date().toISOString()}] ⏳ Retrying in ${delay}ms (attempt ${retryCountRef.current}/3)`)
        
        retryTimeoutRef.current = setTimeout(() => {
          connectionAttemptRef.current = false
          if (isActive) {
            connect()
          }
        }, delay)
      } else {
        // Give up after max retries
        connectionAttemptRef.current = false
        retryCountRef.current = 0
        console.error(`[${new Date().toISOString()}] ❌ AssemblyAI connection failed after ${retryCountRef.current} retries`)
      }
    }
  }, [apiKey])

  const disconnect = useCallback(async () => {
    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    // Reset retry count
    retryCountRef.current = 0
    connectionAttemptRef.current = false
    
    if (serviceRef.current) {
      await serviceRef.current.disconnect()
    }
  }, [])

  const sendAudioData = useCallback((samples: Float32Array, sampleRate: number = 48000) => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.sendAudioData(samples)
    }
  }, [isConnected])

  return {
    isConnected,
    isConnecting,
    error,
    partialTranscript,
    connect,
    disconnect,
    sendAudioData
  }
}