import { create } from 'zustand'

export interface TranscriptEntry {
  id: string
  text: string
  timestamp: Date
  isQuestion?: boolean
}

export interface Question {
  id: string
  text: string
  timestamp: Date
  response?: string
  isActive?: boolean
  isLoading?: boolean
}

export interface SavedInterview {
  id: string
  date: Date
  duration: number
  questionsCount: number
  transcript: TranscriptEntry[]
  questions: Question[]
  title?: string
}

interface InterviewState {
  isActive: boolean
  startTime: Date | null
  transcript: TranscriptEntry[]
  questions: Question[]
  currentQuestion: Question | null
  savedInterviews: SavedInterview[]
  
  // Actions
  startInterview: () => void
  endInterview: () => void
  addTranscriptEntry: (text: string) => void
  markAsQuestion: (entryId: string) => void
  addQuestion: (text: string) => void
  setCurrentQuestion: (questionId: string) => void
  updateQuestionResponse: (questionId: string, response: string) => void
  setQuestionLoading: (questionId: string, loading: boolean) => void
  saveCurrentInterview: (title?: string) => string
  loadSavedInterview: (id: string) => void
  deleteSavedInterview: (id: string) => void
  getSavedInterviews: () => SavedInterview[]
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  isActive: false,
  startTime: null,
  transcript: [],
  questions: [],
  currentQuestion: null,
  savedInterviews: [],

  startInterview: () => {
    set({
      isActive: true,
      startTime: new Date(),
      transcript: [],
      questions: [],
      currentQuestion: null
    })
  },

  endInterview: () => {
    set({
      isActive: false
    })
  },

  addTranscriptEntry: (text: string) => {
    const entry: TranscriptEntry = {
      id: Date.now().toString(),
      text,
      timestamp: new Date()
    }
    set((state) => ({
      transcript: [...state.transcript, entry]
    }))
  },

  markAsQuestion: (entryId: string) => {
    set((state) => {
      const entry = state.transcript.find(e => e.id === entryId)
      if (entry && !entry.isQuestion) {
        const updatedTranscript = state.transcript.map(e =>
          e.id === entryId ? { ...e, isQuestion: true } : e
        )
        
        const newQuestion: Question = {
          id: Date.now().toString(),
          text: entry.text,
          timestamp: entry.timestamp,
          isActive: true,
          isLoading: true
        }
        
        return {
          transcript: updatedTranscript,
          questions: [...state.questions, newQuestion],
          currentQuestion: newQuestion
        }
      }
      return state
    })
  },

  addQuestion: (text: string) => {
    const question: Question = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isActive: true,
      isLoading: true
    }
    
    set((state) => ({
      questions: [...state.questions, question],
      currentQuestion: question
    }))
  },

  setCurrentQuestion: (questionId: string) => {
    set((state) => {
      const question = state.questions.find(q => q.id === questionId)
      const updatedQuestions = state.questions.map(q => ({
        ...q,
        isActive: q.id === questionId
      }))
      
      return {
        questions: updatedQuestions,
        currentQuestion: question || null
      }
    })
  },

  updateQuestionResponse: (questionId: string, response: string) => {
    set((state) => ({
      questions: state.questions.map(q =>
        q.id === questionId
          ? { ...q, response, isLoading: false }
          : q
      )
    }))
  },

  setQuestionLoading: (questionId: string, loading: boolean) => {
    set((state) => ({
      questions: state.questions.map(q =>
        q.id === questionId
          ? { ...q, isLoading: loading }
          : q
      )
    }))
  },

  saveCurrentInterview: (title?: string) => {
    const state = get()
    const duration = state.startTime 
      ? Math.floor((Date.now() - state.startTime.getTime()) / 1000)
      : 0

    const savedInterview: SavedInterview = {
      id: Date.now().toString(),
      date: new Date(),
      duration,
      questionsCount: state.questions.length,
      transcript: [...state.transcript],
      questions: [...state.questions],
      title: title || `Interview ${new Date().toLocaleDateString()}`
    }

    set((state) => ({
      savedInterviews: [...state.savedInterviews, savedInterview]
    }))

    // Save to Electron store if available
    if (window.electronAPI) {
      window.electronAPI.saveInterview(savedInterview)
    }

    return savedInterview.id
  },

  loadSavedInterview: (id: string) => {
    const state = get()
    const savedInterview = state.savedInterviews.find(i => i.id === id)
    
    if (savedInterview) {
      set({
        transcript: savedInterview.transcript,
        questions: savedInterview.questions,
        currentQuestion: savedInterview.questions.find(q => q.isActive) || savedInterview.questions[0] || null,
        isActive: false,
        startTime: null
      })
    }
  },

  deleteSavedInterview: (id: string) => {
    set((state) => ({
      savedInterviews: state.savedInterviews.filter(i => i.id !== id)
    }))
  },

  getSavedInterviews: () => {
    return get().savedInterviews
  }
}))