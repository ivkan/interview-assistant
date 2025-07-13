export interface QuestionMatch {
  isQuestion: boolean
  confidence: number
  type: 'direct' | 'indirect' | 'behavioral' | 'technical' | 'hypothetical'
  keywords: string[]
}

export class QuestionDetectionService {
  private questionWords = [
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'whose',
    'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did',
    'is', 'are', 'was', 'were', 'am', 'have', 'has', 'had'
  ]

  private interviewQuestionPatterns = [
    // Direct questions
    /tell me about/i,
    /describe/i,
    /explain/i,
    /walk me through/i,
    /give me an example/i,
    
    // Behavioral questions
    /give an example of/i,
    /tell me about a time/i,
    /describe a situation/i,
    /how did you handle/i,
    /what would you do if/i,
    
    // Technical questions
    /how do you/i,
    /what is the difference/i,
    /how would you implement/i,
    /what are the advantages/i,
    /how does .* work/i,
    
    // Experience questions
    /years of experience/i,
    /worked with/i,
    /familiar with/i,
    /experience in/i,
    
    // Hypothetical questions
    /imagine you/i,
    /suppose you/i,
    /if you were/i,
    /in this scenario/i
  ]

  private questionEndings = [
    /\?$/,
    /right\?$/i,
    /correct\?$/i,
    /make sense\?$/i,
    /understand\?$/i,
    /thoughts\?$/i,
    /opinion\?$/i
  ]

  detectQuestion(text: string): QuestionMatch {
    const cleanText = text.trim().toLowerCase()
    
    if (!cleanText) {
      return { isQuestion: false, confidence: 0, type: 'direct', keywords: [] }
    }

    let confidence = 0
    let type: QuestionMatch['type'] = 'direct'
    const matchedKeywords: string[] = []

    // Check for question mark
    if (this.questionEndings.some(pattern => pattern.test(text))) {
      confidence += 0.8
      matchedKeywords.push('question_mark')
    }

    // Check for question words at the beginning
    const words = cleanText.split(/\s+/)
    const firstWord = words[0]
    
    if (this.questionWords.includes(firstWord)) {
      confidence += 0.7
      matchedKeywords.push(firstWord)
    }

    // Check for interview question patterns
    for (const pattern of this.interviewQuestionPatterns) {
      if (pattern.test(text)) {
        confidence += 0.6
        matchedKeywords.push(pattern.source)
        
        // Determine question type based on pattern
        if (/tell me about a time|describe a situation|give an example of/.test(pattern.source)) {
          type = 'behavioral'
        } else if (/how do you|how would you implement|what is the difference/.test(pattern.source)) {
          type = 'technical'
        } else if (/imagine you|suppose you|if you were/.test(pattern.source)) {
          type = 'hypothetical'
        } else if (/tell me about|describe|explain/.test(pattern.source)) {
          type = 'indirect'
        }
        break
      }
    }

    // Check for inverted questions (statements that imply questions)
    const invertedPatterns = [
      /you mentioned/i,
      /i'd like to know/i,
      /i'm curious about/i,
      /help me understand/i
    ]

    for (const pattern of invertedPatterns) {
      if (pattern.test(text)) {
        confidence += 0.5
        type = 'indirect'
        matchedKeywords.push(pattern.source)
        break
      }
    }

    // Boost confidence for longer texts that match patterns
    if (confidence > 0.3 && words.length > 5) {
      confidence += 0.1
    }

    // Check for contextual clues
    const contextualClues = [
      /interview/i,
      /question/i,
      /ask/i,
      /answer/i,
      /discuss/i
    ]

    for (const clue of contextualClues) {
      if (clue.test(text)) {
        confidence += 0.1
        break
      }
    }

    // Normalize confidence to 0-1 range
    confidence = Math.min(confidence, 1.0)

    return {
      isQuestion: confidence >= 0.6,
      confidence,
      type,
      keywords: matchedKeywords
    }
  }

  // Analyze multiple consecutive transcript entries for better context
  analyzeSequence(texts: string[]): QuestionMatch {
    if (texts.length === 0) return { isQuestion: false, confidence: 0, type: 'direct', keywords: [] }
    
    // Combine recent texts for better context
    const combinedText = texts.slice(-3).join(' ')
    
    const individual = this.detectQuestion(combinedText)
    
    // Boost confidence if multiple recent entries suggest a question
    if (texts.length > 1) {
      const recentQuestionCount = texts.slice(-3).reduce((count, text) => {
        return count + (this.detectQuestion(text).confidence > 0.3 ? 1 : 0)
      }, 0)
      
      if (recentQuestionCount > 1) {
        individual.confidence = Math.min(individual.confidence + 0.2, 1.0)
      }
    }
    
    return individual
  }

  // Get human-readable explanation for debugging
  explainDetection(text: string): string {
    const result = this.detectQuestion(text)
    
    if (!result.isQuestion) {
      return `Not detected as question (confidence: ${(result.confidence * 100).toFixed(0)}%)`
    }
    
    return `Detected ${result.type} question (confidence: ${(result.confidence * 100).toFixed(0)}%). Keywords: ${result.keywords.join(', ')}`
  }
}

export const questionDetectionService = new QuestionDetectionService()