export interface ElectronAPI {
  // Audio controls
  startAudioCapture: () => Promise<{ success: boolean; error?: string }>
  stopAudioCapture: () => Promise<{ success: boolean }>
  getAudioDevices: (devices: MediaDeviceInfo[]) => Promise<{ success: boolean; devices: MediaDeviceInfo[] }>
  getSystemAudioSources: () => Promise<{ success: boolean; sources?: any[]; error?: string }>
  getAudioStatus: () => Promise<{ isCapturing: boolean }>
  sendAudioData: (data: { samples: number[]; sampleRate: number }) => void
  
  // Settings
  saveSettings: (settings: any) => Promise<{ success: boolean; error?: string }>
  loadSettings: () => Promise<{ success: boolean; data: any; error?: string }>
  
  // Interview data
  saveInterview: (data: any) => Promise<{ success: boolean; id?: string; error?: string }>
  loadInterviews: () => Promise<{ success: boolean; data: any[]; error?: string }>
  
  // Event listeners
  onAudioData: (callback: (data: any) => void) => void
  onAudioCaptureStarted: (callback: () => void) => void
  onAudioCaptureStopped: (callback: () => void) => void
  onMarkAsQuestion: (callback: () => void) => void
  
  // Remove listeners
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}