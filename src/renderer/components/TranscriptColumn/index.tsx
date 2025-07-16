import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { MessageSquareText, Keyboard, Mic, MicOff, Wifi, WifiOff } from 'lucide-react'
import { useInterviewStore } from '../../store/interviewStore'
// ELECTRON LEGACY - Audio capture hook commented out for browser version
// import { useSafeAudioCapture as useAudioCapture } from '../../hooks/useSafeAudioCapture'
import { useSettingsStore } from '../../store/settingsStore'
import { AudioLevelIndicator } from '../AudioLevelIndicator'
import { getWebSpeechRecognition } from '../../services/webSpeechRecognition'
import { cn } from '../../utils/cn'

export function TranscriptColumn() {
  const { transcript, isActive, markAsQuestion } = useInterviewStore()
  const { apiKeys } = useSettingsStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Browser version - use Web Speech API status
  const speechRecognition = getWebSpeechRecognition()
  const status = speechRecognition.getStatus()
  const isCapturing = status.isListening
  const isConnected = status.isAvailable
  const isConnecting = false
  const audioLevel = isCapturing ? 0.5 : 0 // Simplified audio level for browser version
  
  // Setup event listeners for errors only (no more interim results)
  useEffect(() => {
    const handleError = (error: Error) => {
      setError(error.message)
    }
    
    speechRecognition.on('error', handleError)
    
    return () => {
      speechRecognition.off('error', handleError)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const handleMarkAsQuestion = () => {
    if (selectedEntryId) {
      markAsQuestion(selectedEntryId)
      setSelectedEntryId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Live Transcript</h2>
          <div className="flex items-center space-x-2">
            {isCapturing ? (
              <Mic className="w-4 h-4 text-green-500" />
            ) : (
              <MicOff className="w-4 h-4 text-muted-foreground" />
            )}
            
            {isConnected ? (
              <Wifi className="w-4 h-4 text-blue-500" />
            ) : isConnecting ? (
              <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
            
            <AudioLevelIndicator level={audioLevel} />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-2">
          {transcript.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {error ? (
                <div className="text-red-500">
                  <p>Transcription Error:</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : isActive && isCapturing ? (
                'Listening... Speak clearly for best results'
              ) : isActive && isConnected ? (
                'Ready to listen - start speaking'
              ) : isActive ? (
                'Web Speech API not available in this browser'
              ) : (
                'Start an interview to see transcript'
              )}
            </div>
          )}
          
          {transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'p-3 rounded-lg cursor-pointer transition-colors',
                entry.isQuestion && 'bg-primary/10 border border-primary/20',
                selectedEntryId === entry.id && 'bg-accent',
                !entry.isQuestion && 'hover:bg-accent/50'
              )}
              onClick={() => !entry.isQuestion && setSelectedEntryId(entry.id)}
            >
              <p className="text-sm leading-relaxed">{entry.text}</p>
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>{entry.timestamp.toLocaleTimeString()}</span>
                {entry.isQuestion && (
                  <span className="text-primary font-medium">QUESTION</span>
                )}
              </div>
            </div>
          ))}
          
          {isActive && isCapturing && transcript.length > 0 && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-800 dark:text-green-200">Listening...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Keyboard className="w-4 h-4" />
          <span>Press Ctrl+Shift+Q to mark as question</span>
        </div>
        
        <Button
          onClick={handleMarkAsQuestion}
          disabled={!selectedEntryId}
          className="w-full"
          variant="outline"
        >
          <MessageSquareText className="w-4 h-4 mr-2" />
          Mark as Question
        </Button>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-xs text-center text-muted-foreground">
            Meeting UI placeholder
            <br />
            (minimize your meeting here)
          </p>
        </div>
      </div>
    </div>
  )
}