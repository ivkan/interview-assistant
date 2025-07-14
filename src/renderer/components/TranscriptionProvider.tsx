import React, { useEffect } from 'react'
// import { useAudioCapture } from '../hooks/useAudioCapture'
import { useSafeAudioCapture as useAudioCapture } from '../hooks/useSafeAudioCapture'
import { useAssemblyAI } from '../hooks/useAssemblyAI'
import { useQuestionDetection } from '../hooks/useQuestionDetection'
import { useAIResponse } from '../hooks/useAIResponse'
import { useSettingsStore } from '../store/settingsStore'

interface TranscriptionProviderProps {
  children: React.ReactNode
}

export function TranscriptionProvider({ children }: TranscriptionProviderProps) {
  const { apiKeys, transcriptionSettings } = useSettingsStore()
  
  // Initialize AssemblyAI with settings
  const assemblyAI = useAssemblyAI({
    apiKey: apiKeys.assemblyAI,
    language: transcriptionSettings.autoDetectLanguage ? 'en' : transcriptionSettings.language,
    autoStart: true
  })

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

  // Initialize audio capture with AssemblyAI integration
  const audioCapture = useAudioCapture({
    onAudioData: (samples, sampleRate) => {
      // Send audio data to AssemblyAI when connected
      if (assemblyAI.isConnected) {
        assemblyAI.sendAudioData(samples, sampleRate)
      }
    }
  })

  // Log system status for debugging
  useEffect(() => {
    if (assemblyAI.isConnected) {
      console.log('🎤 Transcription ready: Audio → AssemblyAI → Transcript')
    }
  }, [assemblyAI.isConnected])

  useEffect(() => {
    if (aiResponse.availableProviders.openai || aiResponse.availableProviders.deepseek) {
      console.log('🤖 AI Response ready: Question → AI → Answer')
    }
  }, [aiResponse.availableProviders.openai, aiResponse.availableProviders.deepseek])

  // Log errors
  useEffect(() => {
    if (assemblyAI.error) {
      console.error('AssemblyAI Error:', assemblyAI.error)
    }
  }, [assemblyAI.error])

  useEffect(() => {
    if (aiResponse.error) {
      console.error('AI Response Error:', aiResponse.error)
    }
  }, [aiResponse.error])

  return <>{children}</>
}