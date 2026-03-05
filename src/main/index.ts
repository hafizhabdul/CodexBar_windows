import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import path from 'path'
import { SettingsStore } from './storage/settingsStore'
import { SecretsStore } from './storage/secretsStore'
import { ProviderScheduler } from './providers/scheduler'
import { providerRegistry } from './providers/providerRegistry'
import { createMeterIcon } from './tray/meterIcon'
import type { UsageSnapshot, AppSettings } from '../shared/types'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let scheduler: ProviderScheduler | null = null

const settingsStore = new SettingsStore()
const secretsStore = new SecretsStore()

const DIST = path.join(__dirname, '../../dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || ''
const PRELOAD = path.join(__dirname, '../preload/preload.js')

function createPopoverWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 380,
    height: 520,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    transparent: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev && VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}#/popover`)
  } else {
    win.loadFile(path.join(DIST, 'index.html'), { hash: '/popover' })
  }

  win.on('blur', () => {
    win.hide()
  })

  return win
}

function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return settingsWindow
  }

  const win = new BrowserWindow({
    width: 720,
    height: 560,
    minWidth: 600,
    minHeight: 400,
    show: false,
    title: 'CodexBar Settings',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev && VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}#/settings`)
  } else {
    win.loadFile(path.join(DIST, 'index.html'), { hash: '/settings' })
  }

  win.once('ready-to-show', () => win.show())
  win.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow = win
  return win
}

function showPopover() {
  if (!mainWindow) {
    mainWindow = createPopoverWindow()
  }

  if (mainWindow.isVisible()) {
    mainWindow.hide()
    return
  }

  // Position near tray icon
  const trayBounds = tray?.getBounds()
  if (trayBounds) {
    const windowBounds = mainWindow.getBounds()
    const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    const { workArea } = display

    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
    let y: number

    // Taskbar at bottom
    if (trayBounds.y > workArea.y + workArea.height / 2) {
      y = Math.round(trayBounds.y - windowBounds.height - 4)
    } else {
      // Taskbar at top
      y = Math.round(trayBounds.y + trayBounds.height + 4)
    }

    // Keep within screen bounds
    x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - windowBounds.width))
    y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - windowBounds.height))

    mainWindow.setPosition(x, y, false)
  }

  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  const icon = createMeterIcon([])
  tray = new Tray(icon)
  tray.setToolTip('CodexBar - AI Usage Monitor')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open CodexBar', click: () => showPopover() },
    { label: 'Refresh Now', click: () => scheduler?.refreshAll() },
    { type: 'separator' },
    { label: 'Settings', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => showPopover())
}

function updateTrayIcon(snapshots: UsageSnapshot[]) {
  if (!tray) return
  const icon = createMeterIcon(snapshots)
  tray.setImage(icon)

  // Update tooltip with summary
  const enabledSnapshots = snapshots.filter(s => !s.error)
  if (enabledSnapshots.length > 0) {
    const summary = enabledSnapshots
      .map(s => {
        const session = s.session
        if (session && session.limit) {
          const pct = Math.round((session.used / session.limit) * 100)
          return `${s.provider}: ${pct}%`
        }
        return `${s.provider}: active`
      })
      .join(' | ')
    tray.setToolTip(`CodexBar: ${summary}`)
  }
}

function setupIPC() {
  ipcMain.handle('get-settings', () => settingsStore.getAll())
  ipcMain.handle('set-settings', (_e, settings: Partial<AppSettings>) => {
    settingsStore.update(settings)
    // Restart scheduler with new settings
    scheduler?.updateSettings(settingsStore.getAll())
  })

  ipcMain.handle('get-snapshots', () => scheduler?.getSnapshots() ?? [])

  ipcMain.handle('refresh-provider', async (_e, providerId: string) => {
    return scheduler?.refreshProvider(providerId)
  })

  ipcMain.handle('refresh-all', async () => {
    return scheduler?.refreshAll()
  })

  ipcMain.handle('get-secret', (_e, key: string) => secretsStore.get(key))
  ipcMain.handle('set-secret', (_e, key: string, value: string) => secretsStore.set(key, value))
  ipcMain.handle('delete-secret', (_e, key: string) => secretsStore.delete(key))

  ipcMain.handle('open-settings', () => {
    createSettingsWindow()
    return true
  })

  ipcMain.handle('get-provider-list', () => {
    return providerRegistry.map(p => ({
      id: p.id,
      displayName: p.displayName,
      defaultEnabled: p.defaultEnabled,
      strategies: p.strategies,
    }))
  })
}

function startScheduler() {
  const settings = settingsStore.getAll()
  scheduler = new ProviderScheduler(settings, secretsStore, (snapshots) => {
    updateTrayIcon(snapshots)
    // Notify all renderer windows
    mainWindow?.webContents.send('snapshots-updated', snapshots)
    settingsWindow?.webContents.send('snapshots-updated', snapshots)
  })
  scheduler.start()
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showPopover()
  })
}

app.whenReady().then(() => {
  createTray()
  setupIPC()
  startScheduler()
})

app.on('window-all-closed', () => {
  // Don't quit when windows close - keep tray running
})

app.on('before-quit', () => {
  scheduler?.stop()
})
