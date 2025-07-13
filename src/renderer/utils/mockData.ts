import { useInterviewStore } from '../store/interviewStore'

export function addMockTranscript() {
  const { addTranscriptEntry } = useInterviewStore.getState()
  
  const mockTranscripts = [
    "Hello, welcome to the interview today.",
    "Can you tell me about your experience with React?",
    "I have been working with React for about 3 years now.",
    "What is your experience with TypeScript?",
    "How do you handle state management in large applications?",
    "Can you explain the difference between props and state?",
    "What are your thoughts on server-side rendering?",
    "How would you optimize a React application for performance?"
  ]
  
  let index = 0
  const interval = setInterval(() => {
    if (index < mockTranscripts.length) {
      addTranscriptEntry(mockTranscripts[index])
      index++
    } else {
      clearInterval(interval)
    }
  }, 2000)
  
  return interval
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  ;(window as any).addMockTranscript = addMockTranscript
}