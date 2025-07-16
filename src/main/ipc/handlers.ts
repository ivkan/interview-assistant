import { ipcMain } from 'electron'
import Store from 'electron-store'
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'
import { GoogleSpeechService } from '../services/GoogleSpeechService'

const store = new Store()
let googleSpeechService: GoogleSpeechService | null = null

// Get credentials path from environment or use default
const getCredentialsPath = () => {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (envPath) {
    // If it's a relative path, resolve it from the app root
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath)
  }
  // Default to service-account-key.json in app root
  return path.join(process.cwd(), 'service-account-key.json')
}

export function registerIPCHandlers() {
  // Settings management
  ipcMain.handle('settings:save', async (_event, settings) => {
    try {
      store.set('settings', settings)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:load', async () => {
    try {
      const settings = store.get('settings', {
        apiKeys: {
          googleCloud: '',
          openAI: '',
          deepSeek: ''
        },
        language: 'auto',
        theme: 'light',
        audioDevices: {
          microphone: 'default',
          system: 'default'
        }
      })
      return { success: true, data: settings }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Interview data management
  ipcMain.handle('interview:save', async (_event, interviewData) => {
    try {
      const interviewsDir = path.join(app.getPath('userData'), 'interviews')
      await fs.mkdir(interviewsDir, { recursive: true })
      
      const fileName = `interview_${Date.now()}.json`
      const filePath = path.join(interviewsDir, fileName)
      
      await fs.writeFile(filePath, JSON.stringify(interviewData, null, 2))
      
      // Update index
      const interviews = store.get('interviews', []) as any[]
      interviews.push({
        id: fileName,
        date: new Date().toISOString(),
        duration: interviewData.duration,
        questionsCount: interviewData.questions.length
      })
      store.set('interviews', interviews)
      
      return { success: true, id: fileName }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('interview:load-all', async () => {
    try {
      const interviews = store.get('interviews', [])
      return { success: true, data: interviews }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Transcription service handlers
  ipcMain.handle('transcription:start', async (_event, config) => {
    try {
      // Get credentials path
      const credentialsPath = getCredentialsPath()
      
      // Check if credentials file exists
      try {
        await fs.access(credentialsPath)
      } catch (error) {
        return { success: false, error: `Google Cloud credentials file not found at: ${credentialsPath}` }
      }

      // Initialize Google Speech Service with service account credentials
      googleSpeechService = new GoogleSpeechService({
        credentialsPath,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.VITE_GOOGLE_CLOUD_PROJECT_ID,
        language: config.language || 'en-US',
        sampleRateHertz: 16000,
        encoding: 'LINEAR16'
      })

      // Set up event listeners
      googleSpeechService.on('transcription', (result) => {
        _event.sender.send('transcription:result', result)
      })

      googleSpeechService.on('error', (error) => {
        _event.sender.send('transcription:error', error)
      })

      googleSpeechService.on('started', () => {
        _event.sender.send('transcription:started')
      })

      googleSpeechService.on('stopped', () => {
        _event.sender.send('transcription:stopped')
      })

      googleSpeechService.on('paused', () => {
        _event.sender.send('transcription:paused')
      })

      googleSpeechService.on('resumed', () => {
        _event.sender.send('transcription:resumed')
      })

      googleSpeechService.startStreaming()
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('transcription:stop', async () => {
    try {
      if (googleSpeechService) {
        googleSpeechService.stopStreaming()
        googleSpeechService.destroy()
        googleSpeechService = null
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('transcription:pause', async () => {
    try {
      if (googleSpeechService) {
        googleSpeechService.pauseStreaming()
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('transcription:resume', async () => {
    try {
      if (googleSpeechService) {
        googleSpeechService.resumeStreaming()
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('transcription:send-audio', async (_event, audioData) => {
    try {
      // Reduce logging frequency - only log every 100th call
      if (Math.random() < 0.01) {
        console.log('🎤 IPC audio data sample:', {
          samplesLength: audioData.samples?.length,
          sampleRate: audioData.sampleRate,
          isInt16: audioData.isInt16
        })
      }
      
      if (googleSpeechService && audioData.samples) {
        let buffer: Buffer
        
        if (audioData.isInt16) {
          // Data is already in Int16Array format from renderer
          const int16Array = new Int16Array(audioData.samples)
          buffer = Buffer.alloc(int16Array.length * 2)
          
          for (let i = 0; i < int16Array.length; i++) {
            buffer.writeInt16LE(int16Array[i], i * 2)
          }
        } else {
          // Legacy Float32Array format (fallback)
          const samples = new Float32Array(audioData.samples)
          buffer = Buffer.alloc(samples.length * 2)
          
          for (let i = 0; i < samples.length; i++) {
            // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
            const sample = Math.max(-1, Math.min(1, samples[i]))
            const int16 = Math.round(sample * 32767)
            buffer.writeInt16LE(int16, i * 2)
          }
        }
        
        googleSpeechService.writeAudio(buffer)
      }
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error in transcription:send-audio:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('transcription:update-config', async (_event, config) => {
    try {
      if (googleSpeechService) {
        googleSpeechService.updateConfig(config)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}