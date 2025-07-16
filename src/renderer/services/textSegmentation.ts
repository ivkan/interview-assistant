export interface TextSegment {
  id: string
  text: string
  timestamp: Date
  isComplete: boolean
  speaker?: string
}

export class TextSegmentationService {
  private buffer: string = ''
  private lastSegmentId: number = 0
  private pendingSegments: TextSegment[] = []
  private completedSegments: TextSegment[] = []
  private onSegmentCallback: ((segments: TextSegment[]) => void) | null = null

  // Sentence ending patterns
  private sentenceEndings = [
    /[.!?]+\s+/g,  // Period, exclamation, question mark followed by space
    /[.!?]+$/g,    // Period, exclamation, question mark at end
    /\.\.\.\s+/g,  // Ellipsis followed by space
  ]

  // Patterns that indicate speaker change or natural pause
  private speakerChangePatterns = [
    /\b(okay|alright|right|well|so|now|um|uh|yeah|yes|no)\s+/gi,
    /\b(and|but|however|therefore|meanwhile|actually|basically)\s+/gi,
  ]

  // Minimum length for a segment (avoid very short fragments)
  private readonly MIN_SEGMENT_LENGTH = 5 // Reduced for testing
  
  // Maximum time to wait before forcing a segment (milliseconds)
  private readonly MAX_SEGMENT_WAIT = 1500 // Reduced for testing

  private segmentTimer: NodeJS.Timeout | null = null

  /**
   * Set callback for when segments are created
   */
  setSegmentCallback(callback: (segments: TextSegment[]) => void): void {
    this.onSegmentCallback = callback
  }

  /**
   * Add new text to the buffer and process segments
   */
  addText(text: string, isFinal: boolean = false): TextSegment[] {
    console.log('📝 TextSegmentation.addText called:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      isFinal,
      currentBuffer: this.buffer.substring(0, 50) + (this.buffer.length > 50 ? '...' : '')
    })
    
    // Clean and normalize the text
    const cleanText = this.normalizeText(text)
    
    if (!cleanText) {
      console.log('⚠️ Empty text after normalization')
      return []
    }

    // Update buffer - add space if buffer already has content
    if (this.buffer && !this.buffer.endsWith(' ') && !cleanText.startsWith(' ')) {
      this.buffer += ' '
    }
    this.buffer += cleanText
    console.log('📝 Buffer updated, length:', this.buffer.length)

    // Clear any pending timer
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer)
      this.segmentTimer = null
    }

    if (isFinal) {
      console.log('✅ Processing final text, forcing segments')
      // Process all remaining text as final segments
      return this.processBuffer(true)
    } else {
      console.log('⏳ Processing interim text')
      // Process buffer for complete sentences
      const segments = this.processBuffer(false)
      
      // Set timer to force segment if buffer gets too old
      if (this.buffer.length > 0) {
        this.segmentTimer = setTimeout(() => {
          const timedSegments = this.processBuffer(true)
          this.emit('segments', timedSegments)
          // Call callback if set
          if (this.onSegmentCallback && timedSegments.length > 0) {
            this.onSegmentCallback(timedSegments)
          }
        }, this.MAX_SEGMENT_WAIT)
      }
      
      return segments
    }
  }

  /**
   * Process the buffer and extract complete segments
   */
  private processBuffer(forceFinal: boolean = false): TextSegment[] {
    console.log('🔄 processBuffer called:', {
      forceFinal,
      bufferLength: this.buffer.length,
      buffer: this.buffer.substring(0, 100) + (this.buffer.length > 100 ? '...' : '')
    })
    
    const segments: TextSegment[] = []
    
    if (!this.buffer.trim()) {
      console.log('⚠️ Empty buffer, returning no segments')
      return segments
    }

    // Find sentence boundaries
    const sentences = this.findSentenceBoundaries(this.buffer)
    console.log('🔍 Found sentences:', sentences.length, sentences.map(s => s.substring(0, 30) + '...'))
    
    // Process complete sentences
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const isLastSentence = i === sentences.length - 1
      const isComplete = this.isCompleteSentence(sentence)
      
      console.log(
        `📝 Processing sentence ${i + 1}/${sentences.length}:`,
        {
          text: sentence.substring(0, 50) + '...',
          isLastSentence,
          isComplete,
          length: sentence.length,
          forceFinal
        }
      )
      
      // Only create segment if:
      // 1. It's not the last sentence (incomplete)
      // 2. OR it's the last sentence but we're forcing final
      // 3. OR it's long enough and has proper ending
      if (!isLastSentence || forceFinal || isComplete) {
        if (sentence.trim().length >= this.MIN_SEGMENT_LENGTH) {
          // If we're forcing final, make sure the segment is marked as complete
          const segmentIsComplete = forceFinal || !isLastSentence || isComplete
          
          const segment: TextSegment = {
            id: `segment-${++this.lastSegmentId}`,
            text: sentence.trim(),
            timestamp: new Date(),
            isComplete: segmentIsComplete
          }
          
          console.log('✅ Created segment:', {
            id: segment.id,
            text: segment.text,
            isComplete: segment.isComplete
          })
          
          segments.push(segment)
          this.completedSegments.push(segment)
        } else {
          console.log('⚠️ Sentence too short, skipping:', sentence.length)
        }
        
        // Remove processed text from buffer
        if (!isLastSentence) {
          this.buffer = this.buffer.substring(sentence.length).trim()
        } else if (forceFinal || isComplete) {
          this.buffer = ''
        }
      } else {
        console.log('⏳ Keeping sentence in buffer for later processing')
      }
    }
    
    console.log('📦 processBuffer returning:', segments.length, 'segments')
    return segments
  }

  /**
   * Find sentence boundaries in text
   */
  private findSentenceBoundaries(text: string): string[] {
    const sentences: string[] = []
    let currentStart = 0
    
    // Find all sentence endings
    const endings: Array<{ index: number, length: number }> = []
    
    for (const pattern of this.sentenceEndings) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        endings.push({ index: match.index + match[0].length, length: match[0].length })
        pattern.lastIndex = 0 // Reset regex
      }
    }
    
    // Sort endings by position
    endings.sort((a, b) => a.index - b.index)
    
    // Extract sentences
    for (const ending of endings) {
      const sentence = text.substring(currentStart, ending.index).trim()
      if (sentence.length >= this.MIN_SEGMENT_LENGTH) {
        sentences.push(sentence)
        currentStart = ending.index
      }
    }
    
    // Add remaining text as potential sentence
    const remaining = text.substring(currentStart).trim()
    if (remaining) {
      sentences.push(remaining)
    }
    
    return sentences.filter(s => s.length > 0)
  }

  /**
   * Check if a sentence is complete (has proper ending)
   */
  private isCompleteSentence(text: string): boolean {
    const trimmed = text.trim()
    return /[.!?]$/.test(trimmed) || /\.\.\.$/.test(trimmed)
  }

  /**
   * Normalize text (remove extra spaces, etc.)
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\s+([.!?])/g, '$1')  // Remove space before punctuation
      .trim()
  }

  /**
   * Detect potential speaker changes
   */
  private detectSpeakerChange(text: string): boolean {
    const lowercaseText = text.toLowerCase()
    
    // Check for speaker change patterns
    for (const pattern of this.speakerChangePatterns) {
      if (pattern.test(lowercaseText)) {
        return true
      }
    }
    
    // Check for long pause indicators
    if (text.includes('...') || text.includes('—') || text.includes('–')) {
      return true
    }
    
    return false
  }

  /**
   * Get all completed segments
   */
  getCompletedSegments(): TextSegment[] {
    return [...this.completedSegments]
  }

  /**
   * Clear all segments and reset
   */
  reset(): void {
    this.buffer = ''
    this.pendingSegments = []
    this.completedSegments = []
    this.lastSegmentId = 0
    
    if (this.segmentTimer) {
      clearTimeout(this.segmentTimer)
      this.segmentTimer = null
    }
  }

  /**
   * Get current buffer content (for debugging)
   */
  getCurrentBuffer(): string {
    return this.buffer
  }

  /**
   * Simple event emission for segments
   */
  private emit(event: string, data: any): void {
    console.log(`TextSegmentation ${event}:`, data)
    
    // If this is a segments event and we have a callback, call it
    if (event === 'segments' && this.onSegmentCallback && Array.isArray(data) && data.length > 0) {
      console.log('🔔 Calling segment callback with', data.length, 'segments')
      this.onSegmentCallback(data)
    }
  }
}

// Singleton instance
let instance: TextSegmentationService | null = null

export const getTextSegmentation = (): TextSegmentationService => {
  if (!instance) {
    instance = new TextSegmentationService()
  }
  return instance
}

export default getTextSegmentation()