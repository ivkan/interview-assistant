import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface APIKeys {
  googleCloud: string
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
  isConfigured: () => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: {
        googleCloud: '',
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
        set((state) => ({
          apiKeys: { ...state.apiKeys, ...keys }
        }))
      },

      updateAudioSettings: (settings) => {
        set((state) => ({
          audioSettings: { ...state.audioSettings, ...settings }
        }))
      },

      updateTranscriptionSettings: (settings) => {
        set((state) => ({
          transcriptionSettings: { ...state.transcriptionSettings, ...settings }
        }))
      },

      updateUserProfile: (profile) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile }
        }))
      },

      setTheme: (theme) => {
        set({ theme })
      },

      isConfigured: () => {
        const { apiKeys } = get()
        // Google Cloud uses service account auth, not API keys
        return !!(apiKeys.openAI || apiKeys.deepSeek)
      }
    }),
    {
      name: 'interview-assistant-settings',
      // Only persist certain fields for security
      partialize: (state) => ({
        audioSettings: state.audioSettings,
        transcriptionSettings: state.transcriptionSettings,
        userProfile: state.userProfile,
        theme: state.theme,
        // Don't persist API keys in localStorage for security
        // They will be stored via Electron's secure store
      })
    }
  )
)