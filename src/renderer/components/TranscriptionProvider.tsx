import React, { useEffect, useRef } from 'react'
// ELECTRON LEGACY - Audio capture hooks (commented out for browser version)
// import { useAudioCapture } from '../hooks/useAudioCapture'
// import { useSafeAudioCapture as useAudioCapture } from '../hooks/useSafeAudioCapture'
import { useQuestionDetection } from '../hooks/useQuestionDetection'
import { useAIResponse } from '../hooks/useAIResponse'
import { useSettingsStore } from '../store/settingsStore'
import { useInterviewStore } from '../store/interviewStore'
import { getWebSpeechRecognition, type TranscriptEntry } from '../services/webSpeechRecognition'

interface TranscriptionProviderProps {
  children: React.ReactNode
}

export function TranscriptionProvider({ children }: TranscriptionProviderProps) {
  const { apiKeys, transcriptionSettings } = useSettingsStore()
  const { isActive, isPaused, addTranscriptEntry } = useInterviewStore()
  const speechRecognition = useRef(getWebSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: transcriptionSettings?.language || 'en-US'
  }))
  
  // Initialize question detection
  const questionDetection = useQuestionDetection({
    autoDetect: true,
    confidenceThreshold: 0.6,
    onQuestionDetected: (text, match) => {
      console.log('🎯 Question detected:', {
        text: text.substring(0, 50) + '...',
        type: match.type,
        confidence: Math.round(match.confidence * 100) + '%'
      })
    }
  })

  // Initialize AI response generation
  const aiResponse = useAIResponse({
    autoRespond: true,
    preferredProvider: 'openai' // Can be made configurable
  })

  // ELECTRON LEGACY - Audio capture (commented out for browser version)
  // const audioCapture = useAudioCapture({
  //   onAudioData: (samples, sampleRate) => {
  //     console.log('Audio data received, transcription service not yet integrated')
  //   }
  // })

  // Setup Web Speech API event handlers
  useEffect(() => {
    const recognition = speechRecognition.current
    
    const handleTranscript = (entry: TranscriptEntry) => {
      console.log('🎯 TranscriptionProvider received transcript:', {
        id: entry.id,
        text: entry.text,
        isFinal: entry.isFinal,
        timestamp: entry.timestamp
      })
      
      // Add to transcript store (only final transcripts)
      if (entry.isFinal) {
        console.log('✅ Adding to transcript store:', entry.text)
        addTranscriptEntry(entry.text)
      } else {
        console.log('⏳ Skipping non-final transcript:', entry.text)
      }
    }

    const handleError = (error: Error) => {
      console.error('Speech recognition error:', error)
    }

    const handleStart = () => {
      console.log('🎤 Speech recognition started')
    }

    const handleEnd = () => {
      console.log('🔇 Speech recognition ended')
    }

    // Register event listeners - only final transcripts now
    recognition.on('finalTranscript', handleTranscript)
    recognition.on('error', handleError)
    recognition.on('start', handleStart)
    recognition.on('end', handleEnd)

    return () => {
      recognition.off('finalTranscript', handleTranscript)
      recognition.off('error', handleError)
      recognition.off('start', handleStart)
      recognition.off('end', handleEnd)
    }
  }, [])

  // Handle interview state changes
  useEffect(() => {
    const recognition = speechRecognition.current
    
    if (isActive && !isPaused && recognition.isAvailable()) {
      console.log('🎬 Starting speech recognition for interview')
      recognition.start().catch(error => {
        console.error('Failed to start speech recognition:', error)
      })
    } else if (!isActive || isPaused) {
      console.log('📴 Stopping speech recognition')
      recognition.stop()
    }
  }, [isActive, isPaused])

  // Handle language changes
  useEffect(() => {
    const recognition = speechRecognition.current
    const language = transcriptionSettings?.language || 'en-US'
    
    if (recognition.getLanguage() !== language) {
      recognition.setLanguage(language)
      console.log(`🌐 Speech recognition language changed to: ${language}`)
    }
  }, [transcriptionSettings?.language])

  // Log system status for debugging
  useEffect(() => {
    const recognition = speechRecognition.current
    const status = recognition.getStatus()
    
    console.log('🎤 Speech Recognition Status:', {
      available: status.isAvailable,
      listening: status.isListening,
      language: status.language
    })
    
    if (!status.isAvailable) {
      console.warn('⚠️ Web Speech API not supported in this browser')
    }
  }, [])

  useEffect(() => {
    if (aiResponse.availableProviders.openai || aiResponse.availableProviders.deepseek) {
      console.log('🤖 AI Response ready: Question → AI → Answer')
    }
  }, [aiResponse.availableProviders.openai, aiResponse.availableProviders.deepseek])

  useEffect(() => {
    if (aiResponse.error) {
      console.error('AI Response Error:', aiResponse.error)
    }
  }, [aiResponse.error])

  return <>{children}</>
}