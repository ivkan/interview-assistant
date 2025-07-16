export interface StorageData {
  apiKeys?: {
    openAI?: string
    deepSeek?: string
  }
  settings?: {
    language?: string
    theme?: 'light' | 'dark'
    audioDevices?: {
      microphone?: string
      speaker?: string
    }
    transcriptionSettings?: {
      language?: string
      autoDetectLanguage?: boolean
    }
  }
  userProfile?: {
    resume?: string
    background?: string
    position?: string
    interviewType?: string
  }
  interviews?: Array<{
    id: string
    date: string
    duration: number
    transcript: any[]
    questions: any[]
  }>
}

class BrowserStorageService {
  private readonly STORAGE_KEY = 'interview-assistant-data'
  private readonly ENCRYPTION_KEY = 'interview-assistant-encryption'

  // Simple XOR encryption for API keys (not production-grade, but better than plaintext)
  private encrypt(text: string): string {
    const key = this.getOrCreateEncryptionKey()
    let encrypted = ''
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return btoa(encrypted) // Base64 encode
  }

  private decrypt(encrypted: string): string {
    try {
      const key = this.getOrCreateEncryptionKey()
      const text = atob(encrypted) // Base64 decode
      let decrypted = ''
      for (let i = 0; i < text.length; i++) {
        decrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
      }
      return decrypted
    } catch {
      return ''
    }
  }

  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem(this.ENCRYPTION_KEY)
    if (!key) {
      // Generate a random key
      key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => String.fromCharCode(b))
        .join('')
      localStorage.setItem(this.ENCRYPTION_KEY, btoa(key))
    } else {
      key = atob(key)
    }
    return key
  }

  // Save data to localStorage
  save(data: StorageData): void {
    try {
      const dataToSave = { ...data }
      
      // Encrypt API keys
      if (dataToSave.apiKeys) {
        dataToSave.apiKeys = {
          openAI: dataToSave.apiKeys.openAI ? this.encrypt(dataToSave.apiKeys.openAI) : undefined,
          deepSeek: dataToSave.apiKeys.deepSeek ? this.encrypt(dataToSave.apiKeys.deepSeek) : undefined
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      throw new Error('Storage quota exceeded or localStorage not available')
    }
  }

  // Load data from localStorage
  load(): StorageData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data = JSON.parse(stored) as StorageData
      
      // Decrypt API keys
      if (data.apiKeys) {
        data.apiKeys = {
          openAI: data.apiKeys.openAI ? this.decrypt(data.apiKeys.openAI) : undefined,
          deepSeek: data.apiKeys.deepSeek ? this.decrypt(data.apiKeys.deepSeek) : undefined
        }
      }

      return data
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }

  // Update specific fields
  update(updates: Partial<StorageData>): void {
    const current = this.load() || {}
    const updated = this.deepMerge(current, updates)
    this.save(updated)
  }

  // Clear all stored data
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Save API keys
  saveAPIKeys(apiKeys: { openAI?: string; deepSeek?: string }): void {
    this.update({ apiKeys })
  }

  // Load API keys
  loadAPIKeys(): { openAI?: string; deepSeek?: string } {
    const data = this.load()
    return data?.apiKeys || {}
  }

  // Save settings
  saveSettings(settings: StorageData['settings']): void {
    this.update({ settings })
  }

  // Load settings
  loadSettings(): StorageData['settings'] {
    const data = this.load()
    return data?.settings || {}
  }

  // Save user profile
  saveUserProfile(profile: StorageData['userProfile']): void {
    this.update({ userProfile: profile })
  }

  // Load user profile
  loadUserProfile(): StorageData['userProfile'] {
    const data = this.load()
    return data?.userProfile || {}
  }

  // Save interview
  saveInterview(interview: NonNullable<StorageData['interviews']>[0]): void {
    const data = this.load() || {}
    const interviews = data.interviews || []
    
    // Add or update interview
    const existingIndex = interviews.findIndex(i => i.id === interview.id)
    if (existingIndex >= 0) {
      interviews[existingIndex] = interview
    } else {
      interviews.unshift(interview) // Add to beginning
    }

    // Keep only last 50 interviews
    if (interviews.length > 50) {
      interviews.splice(50)
    }

    this.update({ interviews })
  }

  // Load all interviews
  loadInterviews(): StorageData['interviews'] {
    const data = this.load()
    return data?.interviews || []
  }

  // Delete interview
  deleteInterview(id: string): void {
    const data = this.load() || {}
    const interviews = data.interviews || []
    const filtered = interviews.filter(i => i.id !== id)
    this.update({ interviews: filtered })
  }

  // Check if storage is available
  isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  // Get storage size (approximate)
  getStorageSize(): { used: number; limit: number } {
    let used = 0
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
    } catch {
      // Ignore errors
    }

    // Most browsers have a 5-10MB limit
    const limit = 5 * 1024 * 1024 // 5MB

    return { used, limit }
  }

  // Helper method for deep merging objects
  private deepMerge(target: any, source: any): any {
    const output = { ...target }
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key]
          } else {
            output[key] = this.deepMerge(target[key], source[key])
          }
        } else {
          output[key] = source[key]
        }
      })
    }
    
    return output
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  // Export data for backup
  exportData(): string {
    const data = this.load()
    return JSON.stringify(data, null, 2)
  }

  // Import data from backup
  importData(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString)
      // Re-encrypt API keys during import
      if (data.apiKeys) {
        const decryptedKeys = { ...data.apiKeys }
        data.apiKeys = decryptedKeys // Will be re-encrypted by save()
      }
      this.save(data)
    } catch (error) {
      throw new Error('Invalid backup data format')
    }
  }
}

// Singleton instance
let instance: BrowserStorageService | null = null

export const getBrowserStorage = (): BrowserStorageService => {
  if (!instance) {
    instance = new BrowserStorageService()
  }
  return instance
}

export default getBrowserStorage()