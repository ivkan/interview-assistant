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
import { getWebSpeechRecognition } from './services/webSpeechRecognition'
import { getBrowserStorage } from './services/browserStorage'
import './utils/mockData' // Load mock data utilities

function App() {
  // ELECTRON LEGACY - Removed electron-specific code
  // - Global shortcuts are now handled with document.addEventListener
  // - Storage is now handled with localStorage instead of electron-store
  // - Audio capture is now handled with Web Speech API instead of Electron audio APIs
  const { isActive, isPaused, startInterview, endInterview, transcript } = useInterviewStore()
  const { updateAPIKeys, loadSettings } = useSettingsStore()
  const { markAsQuestion } = useQuestionDetection()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [browserCompatibility, setBrowserCompatibility] = useState({
    speechRecognition: false,
    localStorage: false
  })

  // Check browser compatibility and load settings
  useEffect(() => {
    // Check browser compatibility
    const speechRecognition = getWebSpeechRecognition()
    const storage = getBrowserStorage()
    
    setBrowserCompatibility({
      speechRecognition: speechRecognition.isAvailable(),
      localStorage: storage.isAvailable()
    })

    // Load settings from browser storage
    const storedSettings = storage.loadSettings()
    if (storedSettings) {
      // Apply stored settings
      loadSettings(storedSettings)
      console.log('⚙️ Settings loaded from browser storage')
    }

    // Load API keys from browser storage or environment
    const storedKeys = storage.loadAPIKeys()
    const envKeys = {
      openAI: import.meta.env.VITE_OPENAI_API_KEY || '',
      deepSeek: import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    }
    
    // Prefer stored keys, fallback to environment
    const finalKeys = {
      openAI: storedKeys.openAI || envKeys.openAI,
      deepSeek: storedKeys.deepSeek || envKeys.deepSeek
    }
    
    if (finalKeys.openAI || finalKeys.deepSeek) {
      updateAPIKeys(finalKeys)
      console.log(`[${new Date().toISOString()}] 🔑 API keys loaded`)
    }
  }, [])

  // Browser-based keyboard shortcuts (replacing Electron global shortcuts)
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Ctrl+Shift+Q (or Cmd+Shift+Q on Mac) to mark as question
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Q') {
        event.preventDefault()
        
        // Mark the most recent transcript entry as a question
        if (transcript.length > 0) {
          const lastEntry = transcript[transcript.length - 1]
          if (!lastEntry.isQuestion) {
            markAsQuestion(lastEntry.id)
            console.log('⌨️ Question marked via keyboard shortcut')
          }
        }
      }
    }

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [transcript, markAsQuestion])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else if (!isActive) {
      setElapsedTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused])

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

  // Show compatibility warning if needed
  if (!browserCompatibility.speechRecognition && !browserCompatibility.localStorage) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light" storageKey="interview-assistant-theme">
          <div className="flex flex-col h-screen bg-background items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <h1 className="text-2xl font-bold mb-4">Browser Compatibility Issue</h1>
              <p className="text-muted-foreground mb-6">
                Your browser doesn&apos;t support the required features for this application.
              </p>
              <div className="space-y-2 text-sm">
                <p>• Speech Recognition: {browserCompatibility.speechRecognition ? '✅' : '❌'}</p>
                <p>• Local Storage: {browserCompatibility.localStorage ? '✅' : '❌'}</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Please use a modern browser like Chrome, Firefox, or Edge.
              </p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    )
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