import { useEffect, useRef } from 'react'
import { useInterviewStore } from '../store/interviewStore'
import { questionDetectionService, QuestionMatch } from '../services/questionDetection'

interface UseQuestionDetectionProps {
  autoDetect?: boolean
  confidenceThreshold?: number
  onQuestionDetected?: (text: string, match: QuestionMatch) => void
}

export function useQuestionDetection({
  autoDetect = true,
  confidenceThreshold = 0.6,
  onQuestionDetected
}: UseQuestionDetectionProps = {}) {
  const { transcript } = useInterviewStore()
  const processedTranscriptIds = useRef(new Set<string>())

  // Process new transcript entries for question detection
  useEffect(() => {
    if (!autoDetect || transcript.length === 0) return

    // Get recent transcript entries that haven't been processed
    const newEntries = transcript.filter(entry => 
      !processedTranscriptIds.current.has(entry.id) && !entry.isQuestion
    )

    if (newEntries.length === 0) return

    // Process each new entry
    newEntries.forEach(entry => {
      processedTranscriptIds.current.add(entry.id)
      
      // Skip empty or very short entries
      if (!entry.text || entry.text.trim().length < 3) {
        return
      }
      
      // Get context from recent entries for better detection
      const recentTexts = transcript
        .slice(-5) // Last 5 entries for context
        .map(t => t.text)
        .filter(text => text && text.trim().length > 0) // Filter out empty texts
      
      const match = questionDetectionService.analyzeSequence(recentTexts)
      
      if (match.isQuestion && match.confidence >= confidenceThreshold) {
        // Double-check the entry text is not empty
        if (entry.text.trim().length > 0) {
          // Mark the current entry as a question using the store method
          const { markAsQuestion: storeMarkAsQuestion } = useInterviewStore.getState()
          storeMarkAsQuestion(entry.id)
          
          // Trigger callback if provided
          if (onQuestionDetected) {
            onQuestionDetected(entry.text, match)
          }
          
          console.log('🤖 Auto-detected question:', {
            text: entry.text,
            type: match.type,
            confidence: Math.round(match.confidence * 100) + '%',
            keywords: match.keywords
          })
        }
      }
    })
  }, [transcript, autoDetect, confidenceThreshold, onQuestionDetected])

  // Manual question detection for specific text
  const detectQuestion = (text: string): QuestionMatch => {
    return questionDetectionService.detectQuestion(text)
  }

  // Manual question detection with context
  const detectQuestionWithContext = (texts: string[]): QuestionMatch => {
    return questionDetectionService.analyzeSequence(texts)
  }

  // Get explanation for debugging
  const explainDetection = (text: string): string => {
    return questionDetectionService.explainDetection(text)
  }

  // Force process a specific transcript entry as question
  const markAsQuestion = (entryId: string) => {
    const { markAsQuestion: storeMarkAsQuestion } = useInterviewStore.getState()
    storeMarkAsQuestion(entryId)
    console.log('👤 Manually marked as question for entry:', entryId)
  }

  return {
    detectQuestion,
    detectQuestionWithContext,
    explainDetection,
    markAsQuestion
  }
}