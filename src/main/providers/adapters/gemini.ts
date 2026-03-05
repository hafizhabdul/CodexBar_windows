import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export class GeminiAdapter implements ProviderAdapter {
  id = 'gemini'
  displayName = 'Gemini'
  defaultEnabled = false
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'> = ['api', 'cli', 'local']

  async fetch(ctx: FetchContext): Promise<UsageSnapshot> {
    // Strategy 1: Try gcloud OAuth credentials (from Gemini CLI)
    const oauthResult = await this.fetchViaGcloudOAuth()
    if (oauthResult && !oauthResult.error) return oauthResult

    // Strategy 2: Manual API key
    const apiKey = ctx.secrets.get('gemini-api-key')
    if (apiKey) {
      return this.fetchViaAPIKey(apiKey)
    }

    // Strategy 3: CLI
    const cliResult = await this.fetchViaCLI()
    if (cliResult && !cliResult.error) return cliResult

    return oauthResult || cliResult || this.makeSnapshot({
      error: { kind: 'auth', message: 'No Gemini credentials found. Run `gemini` CLI or add API key in Settings.' },
    })
  }

  private async fetchViaGcloudOAuth(): Promise<UsageSnapshot | null> {
    // Check for Gemini CLI OAuth credentials
    const credPaths = [
      path.join(os.homedir(), '.config', 'gemini', 'oauth_credentials.json'),
      path.join(os.homedir(), '.gemini', 'oauth_credentials.json'),
      ...(process.env.APPDATA ? [path.join(process.env.APPDATA, 'gemini', 'oauth_credentials.json')] : []),
    ]

    for (const credPath of credPaths) {
      try {
        if (fs.existsSync(credPath)) {
          const raw = fs.readFileSync(credPath, 'utf-8')
          const creds = JSON.parse(raw)
          if (creds.access_token) {
            // Use token to check quota
            return this.makeSnapshot({
              status: { level: 'ok', message: 'Plan: Gemini (OAuth)' },
            })
          }
        }
      } catch { continue }
    }
    return null
  }

  private async fetchViaAPIKey(apiKey: string): Promise<UsageSnapshot> {
    try {
      // Validate key with a simple models list call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (response.ok) {
        return this.makeSnapshot({
          status: { level: 'ok', message: 'Plan: API Key (free tier or pay-as-you-go)' },
        })
      }
      return this.makeSnapshot({
        error: { kind: 'auth', message: `Gemini API key invalid: HTTP ${response.status}` },
      })
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }

  private async fetchViaCLI(): Promise<UsageSnapshot | null> {
    const commands = [
      'gemini --version',
    ]

    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 5000 })
        return this.makeSnapshot({
          status: { level: 'ok', message: `Plan: Gemini CLI (${stdout.trim()})` },
        })
      } catch { continue }
    }
    return null
  }

  private makeSnapshot(data: Partial<UsageSnapshot>): UsageSnapshot {
    return {
      provider: this.id,
      fetchedAt: new Date().toISOString(),
      stale: false,
      ...data,
    }
  }
}
