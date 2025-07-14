import { ipcMain } from 'electron'
import { AssemblyAI } from 'assemblyai'

class AssemblyAIOfficialProxy {
  private client: AssemblyAI | null = null
  private rt: any = null

  constructor() {
    this.setupIpcHandlers()
  }

  private setupIpcHandlers(): void {
    // Handle connection requests from renderer
    ipcMain.handle('assemblyai-connect', async (event, config) => {
      return await this.connect(config)
    })

    // Handle audio data from renderer
    ipcMain.on('assemblyai-send-audio', (event, audioData) => {
      this.sendAudioData(audioData)
    })

    // Handle disconnect requests
    ipcMain.handle('assemblyai-disconnect', async () => {
      return await this.disconnect()
    })
  }

  async connect(config: { apiKey: string; sampleRate?: number }): Promise<boolean> {
    try {
      console.log('🔌 Connecting to AssemblyAI with official SDK...')
      
      this.client = new AssemblyAI({
        apiKey: config.apiKey
      })

      // Create real-time transcriber
      this.rt = this.client.streaming.transcriber({
        sampleRate: config.sampleRate || 16000,
        formatTurns: true
      })

      // Set up event handlers
      this.rt.on('begin', (data: any) => {
        console.log('✅ AssemblyAI session began:', data.sessionId)
        const allWindows = require('electron').BrowserWindow.getAllWindows()
        allWindows.forEach((window: any) => {
          window.webContents.send('assemblyai-message', {
            type: 'Begin',
            ...data
          })
        })
      })
      
      this.rt.on('open', () => {
        console.log('🔌 AssemblyAI WebSocket opened')
      })
      
      this.rt.on('close', () => {
        console.log('🔌 AssemblyAI WebSocket closed')
      })

      this.rt.on('turn', (data: any) => {
        console.log('📝 AssemblyAI transcript:', data.text)
        const allWindows = require('electron').BrowserWindow.getAllWindows()
        allWindows.forEach((window: any) => {
          window.webContents.send('assemblyai-message', {
            type: 'Turn',
            transcript: data.text,
            turn_is_formatted: data.turnIsFormatted,
            confidence: data.confidence
          })
        })
      })

      this.rt.on('termination', (data: any) => {
        console.log('🔚 AssemblyAI session terminated:', data)
        const allWindows = require('electron').BrowserWindow.getAllWindows()
        allWindows.forEach((window: any) => {
          window.webContents.send('assemblyai-message', {
            type: 'Termination',
            ...data
          })
        })
      })

      this.rt.on('error', (error: any) => {
        console.error('❌ AssemblyAI error:', error)
        const allWindows = require('electron').BrowserWindow.getAllWindows()
        allWindows.forEach((window: any) => {
          window.webContents.send('assemblyai-disconnected', {
            code: -1,
            reason: error.message
          })
        })
      })

      // Connect to AssemblyAI
      await this.rt.connect()
      
      // Wait a bit for WebSocket to fully establish
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Connected to AssemblyAI streaming service')
      return true

    } catch (error) {
      console.error('❌ Failed to connect to AssemblyAI:', error)
      return false
    }
  }

  sendAudioData(audioData: number[]): void {
    if (!this.rt) {
      console.warn('⚠️  AssemblyAI not connected, cannot send audio data')
      return
    }

    try {
      // Check if WebSocket is actually open
      if (!this.rt.isConnected()) {
        console.warn('⚠️  AssemblyAI WebSocket not open yet, skipping audio data')
        return
      }
      
      // Convert array to Int16Array buffer
      const int16Array = new Int16Array(audioData)
      this.rt.sendAudio(int16Array)
    } catch (error) {
      console.error('❌ Error sending audio data:', error)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.rt) return

    try {
      await this.rt.close()
      this.rt = null
      this.client = null
      console.log('✅ Disconnected from AssemblyAI')
    } catch (error) {
      console.error('❌ Error disconnecting from AssemblyAI:', error)
    }
  }
}

// Create singleton instance
export const assemblyAIOfficialProxy = new AssemblyAIOfficialProxy()