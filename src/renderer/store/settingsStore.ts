import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getBrowserStorage } from '../services/browserStorage'

export interface APIKeys {
  openAI: string
  deepSeek: string
}

export interface AudioSettings {
  microphoneDeviceId: string
  systemAudioEnabled: boolean
  echoCancellation: boolean
  noiseSuppression: boolean
}

export interface TranscriptionSettings {
  language: string
  autoDetectLanguage: boolean
  punctuation: boolean
  speakerLabels: boolean
}

export interface UserProfile {
  resume: string
  background: string
  position: string
  interviewType: string
  skills: string[]
}

interface SettingsState {
  apiKeys: APIKeys
  audioSettings: AudioSettings
  transcriptionSettings: TranscriptionSettings
  userProfile: UserProfile
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  updateAPIKeys: (keys: Partial<APIKeys>) => void
  updateAudioSettings: (settings: Partial<AudioSettings>) => void
  updateTranscriptionSettings: (settings: Partial<TranscriptionSettings>) => void
  updateUserProfile: (profile: Partial<UserProfile>) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  loadSettings: (settings: any) => void
  isConfigured: () => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: {
        openAI: '',
        deepSeek: ''
      },
      audioSettings: {
        microphoneDeviceId: 'default',
        systemAudioEnabled: false,
        echoCancellation: true,
        noiseSuppression: true
      },
      transcriptionSettings: {
        language: 'en-US',
        autoDetectLanguage: true,
        punctuation: true,
        speakerLabels: false
      },
      userProfile: {
        resume: '',
        background: '',
        position: '',
        interviewType: '',
        skills: []
      },
      theme: 'system',

      updateAPIKeys: (keys) => {
        set((state) => {
          const newKeys = { ...state.apiKeys, ...keys }
          // Save to browser storage
          const storage = getBrowserStorage()
          storage.saveAPIKeys(newKeys)
          console.log('🔑 API keys updated:', Object.keys(newKeys).filter(k => newKeys[k as keyof typeof newKeys]))
          return { apiKeys: newKeys }
        })
      },

      updateAudioSettings: (settings) => {
        set((state) => {
          const newSettings = { ...state.audioSettings, ...settings }
          // Save to browser storage
          const storage = getBrowserStorage()
          storage.saveSettings({ audioDevices: { microphone: newSettings.microphoneDeviceId } })
          console.log('🎤 Audio settings updated:', newSettings)
          return { audioSettings: newSettings }
        })
      },

      updateTranscriptionSettings: (settings) => {
        set((state) => {
          const newSettings = { ...state.transcriptionSettings, ...settings }
          // Save to browser storage
          const storage = getBrowserStorage()
          storage.saveSettings({ transcriptionSettings: newSettings })
          console.log('🔧 Transcription settings updated:', newSettings)
          return { transcriptionSettings: newSettings }
        })
      },

      updateUserProfile: (profile) => {
        set((state) => {
          const newProfile = { ...state.userProfile, ...profile }
          // Save to browser storage
          const storage = getBrowserStorage()
          storage.saveUserProfile(newProfile)
          return { userProfile: newProfile }
        })
      },

      setTheme: (theme) => {
        set({ theme })
        // Save to browser storage
        const storage = getBrowserStorage()
        storage.saveSettings({ theme: theme === 'system' ? 'light' : theme })
      },

      loadSettings: (settings) => {
        console.log('💾 Loading settings from storage:', settings)
        set({
          audioSettings: settings.audioSettings || get().audioSettings,
          transcriptionSettings: settings.transcriptionSettings || get().transcriptionSettings,
          userProfile: settings.userProfile || get().userProfile,
          theme: settings.theme || get().theme
        })
      },

      isConfigured: () => {
        const { apiKeys } = get()
        // Only need AI provider
        return !!(apiKeys.openAI || apiKeys.deepSeek)
      }
    }),
    {
      name: 'interview-assistant-settings',
      // Browser storage handles persistence via browserStorage service
      // This zustand persistence is kept as backup/cache
      partialize: (state) => ({
        audioSettings: state.audioSettings,
        transcriptionSettings: state.transcriptionSettings,
        userProfile: state.userProfile,
        theme: state.theme,
        // API keys are handled separately by browserStorage with encryption
      })
    }
  )
)