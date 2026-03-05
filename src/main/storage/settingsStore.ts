import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AppSettings } from '../../shared/types'

const DEFAULT_SETTINGS: AppSettings = {
  refreshInterval: 120, // 2 minutes in seconds
  enabledProviders: ['claude', 'codex'],
  mergeIcons: false,
  launchAtLogin: false,
  theme: 'system',
  providerConfigs: {},
}

export class SettingsStore {
  private settings: AppSettings
  private filePath: string

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'settings.json')
    this.settings = this.load()
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
      }
    } catch {
      // Fall through to defaults
    }
    return { ...DEFAULT_SETTINGS }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }

  getAll(): AppSettings {
    return { ...this.settings }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key]
  }

  update(partial: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...partial }
    this.save()
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.settings[key] = value
    this.save()
  }
}
