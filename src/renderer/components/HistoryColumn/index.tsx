import React, { useEffect, useRef } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { useInterviewStore } from '../../store/interviewStore'
import { cn } from '../../utils/cn'
import { Clock } from 'lucide-react'

export function HistoryColumn() {
  const { questions, setCurrentQuestion, currentQuestion } = useInterviewStore()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        })
      }
    }
  }, [questions, autoScroll])
  
  // Auto-scroll when current question changes
  useEffect(() => {
    if (autoScroll && currentQuestion && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }, 100) // Small delay to ensure new question is rendered
      }
    }
  }, [currentQuestion, autoScroll])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.target as HTMLDivElement
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight
    setAutoScroll(isAtBottom)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">History</h2>
      </div>

      <ScrollArea 
        className="flex-1" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        <div className="px-4 py-3 space-y-3">
          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Questions and answers will appear here
            </div>
          )}

          {questions.map((question) => (
            <div
              key={question.id}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-all',
                question.id === currentQuestion?.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/50'
              )}
              onClick={() => setCurrentQuestion(question.id)}
            >
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">Q:</span>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {question.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{question.text}</p>
                </div>
                
                {question.response && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">A:</span>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                      {question.response}
                    </p>
                  </div>
                )}
                
                {question.isLoading && (
                  <p className="text-xs text-muted-foreground italic">
                    Generating response...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-4 py-2 border-t">
        <p className="text-xs text-center text-muted-foreground">
          {autoScroll ? 'Auto-scrolling enabled' : 'Auto-scrolling paused'}
        </p>
      </div>
    </div>
  )
}