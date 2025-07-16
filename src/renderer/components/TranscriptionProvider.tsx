import React, { useEffect } from 'react'
import { useGoogleSpeechTranscription } from '../hooks/useGoogleSpeechTranscription'
import { useQuestionDetection } from '../hooks/useQuestionDetection'
import { useAIResponse } from '../hooks/useAIResponse'
import { useSettingsStore } from '../store/settingsStore'

interface TranscriptionProviderProps {
  children: React.ReactNode
}

export function TranscriptionProvider({ children }: TranscriptionProviderProps) {
  const { apiKeys, transcriptionSettings } = useSettingsStore()
  
  // Initialize Google Speech transcription
  const transcription = useGoogleSpeechTranscription()

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

  // Log system status for debugging
  useEffect(() => {
    if (transcription.isTranscribing) {
      console.log('🎙️ Google Speech transcription active')
    } else {
      console.log('⚠️ Google Speech transcription inactive')
    }
  }, [transcription.isTranscribing])

  useEffect(() => {
    if (aiResponse.availableProviders.openai || aiResponse.availableProviders.deepseek) {
      console.log('🤖 AI Response ready: Question → AI → Answer')
    }
  }, [aiResponse.availableProviders.openai, aiResponse.availableProviders.deepseek])

  // Log errors
  useEffect(() => {
    if (transcription.error) {
      console.error('Google Speech Transcription Error:', transcription.error)
    }
  }, [transcription.error])

  useEffect(() => {
    if (aiResponse.error) {
      console.error('AI Response Error:', aiResponse.error)
    }
  }, [aiResponse.error])

  // Log connection status
  useEffect(() => {
    console.log('🔗 Transcription connection status:', transcription.connectionStatus)
  }, [transcription.connectionStatus])

  return <>{children}</>
}