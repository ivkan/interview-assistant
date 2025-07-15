import { ipcMain } from 'electron'
import Store from 'electron-store'
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'

const store = new Store()

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
          assemblyAI: '', // To be removed
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
}