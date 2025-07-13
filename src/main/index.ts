import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import path from 'path'
import { registerAudioHandlers } from './audio/audioCapture'
import { registerIPCHandlers } from './ipc/handlers'

let mainWindow: BrowserWindow | null = null
const isDev = process.argv.includes('--dev')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    show: false
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Register global shortcuts
  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+Q', () => {
    mainWindow?.webContents.send('mark-as-question')
  })
  
  if (!shortcutRegistered) {
    console.log('Failed to register global shortcut')
  }
}

app.whenReady().then(() => {
  createWindow()
  registerAudioHandlers()
  registerIPCHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})