import React, { useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { TranscriptColumn } from './components/TranscriptColumn'
import { ResponseColumn } from './components/ResponseColumn'
import { HistoryColumn } from './components/HistoryColumn'
import { TranscriptionProvider } from './components/TranscriptionProvider'
import { useInterviewStore } from './store/interviewStore'
import { useSettingsStore } from './store/settingsStore'
import { useQuestionDetection } from './hooks/useQuestionDetection'
import { ThemeProvider } from './components/ThemeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import './utils/mockData' // Load mock data utilities

function App() {
  const { isActive, startInterview, endInterview, transcript } = useInterviewStore()
  const { updateAPIKeys } = useSettingsStore()
  const { markAsQuestion } = useQuestionDetection()
  const [elapsedTime, setElapsedTime] = useState(0)

  // Load API keys from environment variables on startup
  useEffect(() => {
    const envKeys = {
      assemblyAI: import.meta.env.VITE_ASSEMBLYAI_API_KEY || '',
      openAI: import.meta.env.VITE_OPENAI_API_KEY || '',
      deepSeek: import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    }
    
    // Only update if we have keys from environment
    if (envKeys.assemblyAI || envKeys.openAI || envKeys.deepSeek) {
      updateAPIKeys(envKeys)
      console.log(`[${new Date().toISOString()}] 🔑 API keys loaded from environment`)
    }
  }, [])

  // Listen for manual question marking from hotkey
  useEffect(() => {
    const handleMarkAsQuestion = () => {
      // Mark the most recent transcript entry as a question
      if (transcript.length > 0) {
        const lastEntry = transcript[transcript.length - 1]
        if (!lastEntry.isQuestion) {
          markAsQuestion(lastEntry.id)
        }
      }
    }

    // Listen for hotkey from main process
    if (window.electronAPI) {
      window.electronAPI.onMarkAsQuestion(handleMarkAsQuestion)
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('mark-as-question')
      }
    }
  }, [transcript, markAsQuestion])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsedTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive])

  const handleToggleInterview = () => {
    console.log('🎯 Toggle interview clicked, isActive:', isActive)
    try {
      if (isActive) {
        console.log('📴 Ending interview...')
        endInterview()
      } else {
        console.log('🎬 Starting interview...')
        startInterview()
        console.log('✅ Interview started successfully')
      }
    } catch (error) {
      console.error('❌ Error toggling interview:', error)
    }
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="interview-assistant-theme">
        <TranscriptionProvider>
          <div className="flex flex-col h-screen bg-background">
            <Toolbar 
              isActive={isActive}
              elapsedTime={elapsedTime}
              onToggleInterview={handleToggleInterview}
            />
            
            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 border-r">
                <TranscriptColumn />
              </div>
              
              <div className="flex-1">
                <ResponseColumn />
              </div>
              
              <div className="w-72 border-l">
                <HistoryColumn />
              </div>
            </div>
          </div>
        </TranscriptionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App