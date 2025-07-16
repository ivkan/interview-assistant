// ELECTRON LEGACY - Audio capture using Electron APIs
// This file is kept for reference but not used in browser version
// The browser version uses Web Speech API instead of Electron audio capture

import { ipcMain, systemPreferences, BrowserWindow, desktopCapturer } from 'electron'
import { EventEmitter } from 'events'

interface AudioDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

class AudioCaptureManager extends EventEmitter {
  private isCapturing = false
  private captureWindow: BrowserWindow | null = null

  async checkPermissions(): Promise<boolean> {
    if (process.platform === 'darwin') {
      const microphoneStatus = systemPreferences.getMediaAccessStatus('microphone')
      if (microphoneStatus !== 'granted') {
        const granted = await systemPreferences.askForMediaAccess('microphone')
        return granted
      }
      return true
    }
    return true
  }

  async getSystemAudioSources() {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      fetchWindowIcons: true
    })
    
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  }

  startCapture(window: BrowserWindow) {
    this.isCapturing = true
    this.captureWindow = window
    
    // Notify renderer that capture has started
    window.webContents.send('audio:capture-started')
  }

  stopCapture() {
    this.isCapturing = false
    
    if (this.captureWindow) {
      this.captureWindow.webContents.send('audio:capture-stopped')
      this.captureWindow = null
    }
  }

  handleAudioData(data: Float32Array, sampleRate: number) {
    if (this.isCapturing && this.captureWindow) {
      // Convert audio data to a format suitable for IPC
      const audioData = {
        samples: Array.from(data),
        sampleRate,
        timestamp: Date.now()
      }
      
      this.captureWindow.webContents.send('audio:data', audioData)
      this.emit('audio-data', audioData)
    }
  }

  getStatus() {
    return {
      isCapturing: this.isCapturing
    }
  }
}

const audioCaptureManager = new AudioCaptureManager()

export function registerAudioHandlers() {
  // Start audio capture
  ipcMain.handle('audio:start', async (event) => {
    try {
      const hasPermission = await audioCaptureManager.checkPermissions()
      if (!hasPermission) {
        throw new Error('Microphone access denied')
      }

      const window = BrowserWindow.fromWebContents(event.sender)
      if (window) {
        audioCaptureManager.startCapture(window)
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Stop audio capture
  ipcMain.handle('audio:stop', async () => {
    audioCaptureManager.stopCapture()
    return { success: true }
  })

  // Get available audio devices (will be populated from renderer)
  ipcMain.handle('audio:get-devices', async (event, devices: MediaDeviceInfo[]) => {
    // Store devices sent from renderer
    return { success: true, devices }
  })

  // Get system audio sources for screen/app capture
  ipcMain.handle('audio:get-system-sources', async () => {
    try {
      const sources = await audioCaptureManager.getSystemAudioSources()
      return { success: true, sources }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Handle audio data from renderer
  ipcMain.on('audio:process-data', (_event, data: { samples: number[], sampleRate: number }) => {
    const float32Data = new Float32Array(data.samples)
    audioCaptureManager.handleAudioData(float32Data, data.sampleRate)
  })

  // Get capture status
  ipcMain.handle('audio:get-status', async () => {
    return audioCaptureManager.getStatus()
  })
}

export { audioCaptureManager }