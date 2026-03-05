import { safeStorage, app } from 'electron'
import fs from 'fs'
import path from 'path'

export class SecretsStore {
  private filePath: string
  private cache: Map<string, string> = new Map()

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'secrets.enc')
    this.load()
  }

  private load() {
    try {
      if (!fs.existsSync(this.filePath)) return
      const data = fs.readFileSync(this.filePath, 'utf-8')
      const entries: Record<string, string> = JSON.parse(data)

      for (const [key, encryptedB64] of Object.entries(entries)) {
        try {
          if (safeStorage.isEncryptionAvailable()) {
            const encrypted = Buffer.from(encryptedB64, 'base64')
            const decrypted = safeStorage.decryptString(encrypted)
            this.cache.set(key, decrypted)
          }
        } catch {
          // Skip corrupted entries
        }
      }
    } catch {
      // Start fresh
    }
  }

  private save() {
    try {
      const entries: Record<string, string> = {}
      for (const [key, value] of this.cache.entries()) {
        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(value)
          entries[key] = encrypted.toString('base64')
        }
      }
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save secrets:', err)
    }
  }

  get(key: string): string | null {
    return this.cache.get(key) ?? null
  }

  set(key: string, value: string) {
    this.cache.set(key, value)
    this.save()
  }

  delete(key: string) {
    this.cache.delete(key)
    this.save()
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }
}
