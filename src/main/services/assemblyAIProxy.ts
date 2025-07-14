// Electron main process service to proxy AssemblyAI API calls
import { ipcMain } from 'electron'
import WebSocket from 'ws'

class AssemblyAIProxy {
  private ws: WebSocket | null = null
  private apiKey: string = ''

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
    this.apiKey = config.apiKey
    
    try {
      // Direct WebSocket connection with auth header (works in Node.js)
      const params = new URLSearchParams({
        sample_rate: (config.sampleRate || 16000).toString(),
        format_turns: 'true'
      })

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${params}`
      
      this.ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': this.apiKey
        }
      })

      return new Promise((resolve, reject) => {
        this.ws!.on('open', () => {
          console.log('✅ AssemblyAI connected from main process')
          resolve(true)
        })

        this.ws!.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString())
            // Forward to renderer process
            const allWindows = require('electron').BrowserWindow.getAllWindows()
            allWindows.forEach(window => {
              window.webContents.send('assemblyai-message', message)
            })
          } catch (error) {
            console.error('Error parsing AssemblyAI message:', error)
          }
        })

        this.ws!.on('error', (error) => {
          console.error('AssemblyAI WebSocket error:', error)
          reject(error)
        })

        this.ws!.on('close', (code, reason) => {
          console.log('AssemblyAI WebSocket closed:', code, reason.toString())
          // Notify renderer
          const allWindows = require('electron').BrowserWindow.getAllWindows()
          allWindows.forEach(window => {
            window.webContents.send('assemblyai-disconnected', { code, reason: reason.toString() })
          })
        })
      })
    } catch (error) {
      console.error('Failed to connect to AssemblyAI:', error)
      throw error
    }
  }

  sendAudioData(audioData: number[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      // Convert array back to Buffer for WebSocket
      const buffer = Buffer.from(new Int16Array(audioData).buffer)
      this.ws.send(buffer)
    } catch (error) {
      console.error('Error sending audio data:', error)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.ws) return

    try {
      if (this.ws.readyState === WebSocket.OPEN) {
        const terminateMessage = { type: 'Terminate' }
        this.ws.send(JSON.stringify(terminateMessage))
      }
      
      this.ws.close()
      this.ws = null
    } catch (error) {
      console.error('Error disconnecting AssemblyAI:', error)
    }
  }
}

// Create singleton instance
export const assemblyAIProxy = new AssemblyAIProxy()