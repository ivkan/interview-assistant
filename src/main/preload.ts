import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Audio controls
  startAudioCapture: () => ipcRenderer.invoke('audio:start'),
  stopAudioCapture: () => ipcRenderer.invoke('audio:stop'),
  getAudioDevices: (devices: MediaDeviceInfo[]) => ipcRenderer.invoke('audio:get-devices', devices),
  getSystemAudioSources: () => ipcRenderer.invoke('audio:get-system-sources'),
  getAudioStatus: () => ipcRenderer.invoke('audio:get-status'),
  sendAudioData: (data: { samples: number[], sampleRate: number }) => 
    ipcRenderer.send('audio:process-data', data),
  
  // Settings
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  
  // Interview data
  saveInterview: (data: any) => ipcRenderer.invoke('interview:save', data),
  loadInterviews: () => ipcRenderer.invoke('interview:load-all'),
  
  // IPC methods
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  onAudioData: (callback: (data: any) => void) => {
    ipcRenderer.on('audio:data', (_event, data) => callback(data))
  },
  onAudioCaptureStarted: (callback: () => void) => {
    ipcRenderer.on('audio:capture-started', callback)
  },
  onAudioCaptureStopped: (callback: () => void) => {
    ipcRenderer.on('audio:capture-stopped', callback)
  },
  onMarkAsQuestion: (callback: () => void) => {
    ipcRenderer.on('mark-as-question', callback)
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})