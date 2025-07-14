import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AIResponseService, createAIResponseService, AIProvider, ResponseContext, AIResponse } from '../services/aiResponse'
import { useSettingsStore } from '../store/settingsStore'
import { useInterviewStore } from '../store/interviewStore'

interface UseAIResponseProps {
  autoRespond?: boolean
  preferredProvider?: 'openai' | 'deepseek'
}

export function useAIResponse({ 
  autoRespond = true, 
  preferredProvider = 'openai' 
}: UseAIResponseProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentResponse, setCurrentResponse] = useState('')
  
  const { apiKeys, userProfile } = useSettingsStore()
  const { questions, updateQuestionResponse, setQuestionLoading } = useInterviewStore()
  const serviceRef = useRef<AIResponseService | null>(null)
  const activeQuestionRef = useRef<string | null>(null)

  // Initialize AI service when API keys are available
  useEffect(() => {
    const availableProvider = getAvailableProvider()
    if (!availableProvider) return

    // Avoid recreating service if already exists with same provider
    if (serviceRef.current && 
        serviceRef.current.getProvider().name === availableProvider.name &&
        serviceRef.current.getProvider().apiKey === availableProvider.apiKey) {
      return
    }

    const service = createAIResponseService(availableProvider)
    
    // Set up event listeners
    service.on('start', () => {
      setIsGenerating(true)
      setError(null)
      setCurrentResponse('')
    })

    service.on('chunk', (response: AIResponse) => {
      if (response.isComplete) {
        setIsGenerating(false)
        if (activeQuestionRef.current) {
          setQuestionLoading(activeQuestionRef.current, false)
          activeQuestionRef.current = null
        }
      } else {
        setCurrentResponse(prev => {
          const newResponse = prev + response.content
          
          // Update the question response in real-time
          if (activeQuestionRef.current) {
            updateQuestionResponse(activeQuestionRef.current, newResponse)
          }
          
          return newResponse
        })
      }
    })

    service.on('error', (err: Error) => {
      setError(err.message)
      setIsGenerating(false)
      if (activeQuestionRef.current) {
        setQuestionLoading(activeQuestionRef.current, false)
        activeQuestionRef.current = null
      }
    })

    service.on('end', () => {
      setIsGenerating(false)
    })

    serviceRef.current = service

    return () => {
      if (serviceRef.current) {
        serviceRef.current.removeAllListeners()
      }
    }
  }, [apiKeys, preferredProvider])

  // Auto-respond to new questions
  useEffect(() => {
    if (!autoRespond || !serviceRef.current) return

    // Find questions that don't have responses and aren't loading
    const unansweredQuestions = questions.filter(q => 
      !q.response && !q.isLoading && q.isActive
    )

    if (unansweredQuestions.length > 0) {
      const question = unansweredQuestions[0]
      generateResponse(question.id, question.text)
    }
  }, [questions, autoRespond])

  const getAvailableProvider = (): AIProvider | null => {
    if (preferredProvider === 'openai' && apiKeys.openAI) {
      return {
        name: 'openai',
        model: 'gpt-4o-mini',
        apiKey: apiKeys.openAI
      }
    }
    
    if (preferredProvider === 'deepseek' && apiKeys.deepSeek) {
      return {
        name: 'deepseek',
        model: 'deepseek-chat',
        apiKey: apiKeys.deepSeek
      }
    }

    // Fallback to any available provider
    if (apiKeys.openAI) {
      return {
        name: 'openai',
        model: 'gpt-4o-mini',
        apiKey: apiKeys.openAI
      }
    }

    if (apiKeys.deepSeek) {
      return {
        name: 'deepseek',
        model: 'deepseek-chat',
        apiKey: apiKeys.deepSeek
      }
    }

    return null
  }

  const generateResponse = useCallback(async (questionId: string, questionText: string) => {
    if (!serviceRef.current) {
      setError('AI service not available')
      return
    }

    const provider = getAvailableProvider()
    if (!provider) {
      setError('No AI provider configured')
      return
    }

    // Update service provider if needed
    if (serviceRef.current.getProvider().name !== provider.name || 
        serviceRef.current.getProvider().apiKey !== provider.apiKey) {
      serviceRef.current.updateProvider(provider)
    }

    // Mark question as loading
    setQuestionLoading(questionId, true)
    activeQuestionRef.current = questionId

    // Build context for AI response
    const context: ResponseContext = {
      question: questionText,
      resume: userProfile.resume || undefined,
      background: userProfile.background || undefined,
      position: userProfile.position || undefined,
      interviewType: userProfile.interviewType || undefined,
      previousQuestions: questions
        .filter(q => q.id !== questionId && q.response)
        .map(q => q.text)
        .slice(-3) // Last 3 questions for context
    }

    try {
      await serviceRef.current.generateResponse(context)
    } catch (err: any) {
      setError(err.message)
      setQuestionLoading(questionId, false)
      activeQuestionRef.current = null
    }
  }, [questions, setQuestionLoading, updateQuestionResponse])

  const retryResponse = useCallback((questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question) {
      // Clear previous response
      updateQuestionResponse(questionId, '')
      setCurrentResponse('')
      generateResponse(questionId, question.text)
    }
  }, [questions, generateResponse, updateQuestionResponse])

  const stopGeneration = useCallback(() => {
    if (serviceRef.current && isGenerating) {
      // Note: Actual stopping would require AbortController in fetch
      setIsGenerating(false)
      if (activeQuestionRef.current) {
        setQuestionLoading(activeQuestionRef.current, false)
        activeQuestionRef.current = null
      }
    }
  }, [isGenerating, setQuestionLoading])

  const availableProviders = useMemo(() => ({
    openai: !!apiKeys.openAI,
    deepseek: !!apiKeys.deepSeek
  }), [apiKeys.openAI, apiKeys.deepSeek])

  return {
    isGenerating,
    error,
    currentResponse,
    generateResponse,
    retryResponse,
    stopGeneration,
    availableProviders
  }
}