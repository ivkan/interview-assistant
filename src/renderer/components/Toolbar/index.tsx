import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Play, Square, Pause, Moon, Sun, Save } from 'lucide-react'
import { useTheme } from '../ThemeProvider'
import { useInterviewStore } from '../../store/interviewStore'
import { Settings } from '../Settings'

interface ToolbarProps {
  isActive: boolean
  elapsedTime: number
  onToggleInterview: () => void
}

export function Toolbar({ isActive, elapsedTime, onToggleInterview }: ToolbarProps) {
  const { theme, setTheme } = useTheme()
  const { transcript, questions, isPaused, pauseInterview, resumeInterview, saveCurrentInterview } = useInterviewStore()
  const [isSaving, setIsSaving] = useState(false)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSaveInterview = async () => {
    if (transcript.length === 0 && questions.length === 0) return
    
    setIsSaving(true)
    try {
      const id = saveCurrentInterview()
      console.log('Interview saved with ID:', id)
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to save interview:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = transcript.length > 0 || questions.length > 0
  
  const handleTogglePause = () => {
    if (isPaused) {
      resumeInterview()
    } else {
      pauseInterview()
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IA</span>
          </div>
          <span className="font-semibold text-lg">Interview Assistant</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <Settings />

        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveInterview}
          disabled={!canSave || isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Interview'}
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-3">
          <span className={`font-mono text-lg font-medium ${isPaused ? 'text-yellow-600' : ''}`}>
            {formatTime(elapsedTime)}
            {isPaused && (
              <span className="text-yellow-600 ml-2">(PAUSED)</span>
            )}
          </span>

          {isActive && (
            <Button
              onClick={handleTogglePause}
              variant={isPaused ? 'default' : 'outline'}
              size="sm"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          )}

          <Button
            onClick={onToggleInterview}
            variant={isActive ? 'destructive' : 'default'}
            className="min-w-[120px]"
          >
            {isActive ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                End Interview
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Interview
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}