import React, { useEffect } from 'react'
// import { useAudioCapture } from '../hooks/useAudioCapture'
import { useSafeAudioCapture as useAudioCapture } from '../hooks/useSafeAudioCapture'
import { useQuestionDetection } from '../hooks/useQuestionDetection'
import { useAIResponse } from '../hooks/useAIResponse'
import { useSettingsStore } from '../store/settingsStore'

interface TranscriptionProviderProps {
  children: React.ReactNode
}

export function TranscriptionProvider({ children }: TranscriptionProviderProps) {
  const { apiKeys, transcriptionSettings } = useSettingsStore()
  
  // TODO: Initialize new transcription service

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

  // Initialize audio capture (transcription service to be integrated later)
  const audioCapture = useAudioCapture({
    onAudioData: (samples, sampleRate) => {
      // TODO: Send audio data to new transcription service
      console.log('Audio data received, transcription service not yet integrated')
    }
  })

  // Log system status for debugging
  useEffect(() => {
    // TODO: Add transcription service status logging
    console.log('⚠️ Transcription service not yet integrated')
  }, [])

  useEffect(() => {
    if (aiResponse.availableProviders.openai || aiResponse.availableProviders.deepseek) {
      console.log('🤖 AI Response ready: Question → AI → Answer')
    }
  }, [aiResponse.availableProviders.openai, aiResponse.availableProviders.deepseek])

  // Log errors
  useEffect(() => {
    // TODO: Add transcription service error logging
  }, [])

  useEffect(() => {
    if (aiResponse.error) {
      console.error('AI Response Error:', aiResponse.error)
    }
  }, [aiResponse.error])

  return <>{children}</>
}