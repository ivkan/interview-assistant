import React, { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { MessageSquareText, Keyboard, Mic, MicOff, Wifi, WifiOff } from 'lucide-react'
import { useInterviewStore } from '../../store/interviewStore'
import { useSafeAudioCapture as useAudioCapture } from '../../hooks/useSafeAudioCapture'
import { useAssemblyAI } from '../../hooks/useAssemblyAI'
import { useSettingsStore } from '../../store/settingsStore'
import { AudioLevelIndicator } from '../AudioLevelIndicator'
import { cn } from '../../utils/cn'

export function TranscriptColumn() {
  const { transcript, isActive, markAsQuestion } = useInterviewStore()
  const { isCapturing, audioLevel } = useAudioCapture()
  const { apiKeys } = useSettingsStore()
  const { isConnected, isConnecting, partialTranscript, error } = useAssemblyAI({
    apiKey: apiKeys.assemblyAI,
    autoStart: true
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null)

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
          {transcript.length === 0 && !partialTranscript && (
            <div className="text-center py-8 text-muted-foreground">
              {error ? (
                <div className="text-red-500">
                  <p>Transcription Error:</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : isActive && isCapturing && isConnected ? (
                'Listening for speech...'
              ) : isActive && isCapturing ? (
                'Connecting to transcription service...'
              ) : isActive ? (
                'Setting up audio capture...'
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
              <span className="text-xs text-muted-foreground mt-1">
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
          
          {partialTranscript && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
                {partialTranscript}
              </p>
              <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Partial transcript...
              </span>
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