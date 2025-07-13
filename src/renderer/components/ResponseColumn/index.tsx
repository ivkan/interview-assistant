import React from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { Loader2 } from 'lucide-react'
import { useInterviewStore } from '../../store/interviewStore'

export function ResponseColumn() {
  const { currentQuestion } = useInterviewStore()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h2 className="font-semibold">Active Q&A</h2>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {!currentQuestion ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No active question</p>
              <p className="text-sm text-muted-foreground">
                Questions will appear here when detected or marked
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Question:
              </h3>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-base leading-relaxed">{currentQuestion.text}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                AI Response:
              </h3>
              <div className="p-4 bg-accent/50 rounded-lg min-h-[200px]">
                {currentQuestion.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Generating response...
                    </span>
                  </div>
                ) : currentQuestion.response ? (
                  <p className="response-text text-base leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.response}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Waiting for response...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}