import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

interface OAuthCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  scopes?: string[]
}

interface OAuthUsageWindow {
  utilization: number | null
  resets_at: string | null
}

interface OAuthUsageResponse {
  five_hour?: OAuthUsageWindow
  seven_day?: OAuthUsageWindow
  seven_day_opus?: OAuthUsageWindow
  extra_usage?: {
    is_enabled: boolean
    monthly_limit?: number
    used_credits?: number
    utilization?: number
    currency?: string
  }
}

interface ClaudeOrganization {
  uuid: string
  name: string
  billing_type?: string
  plan_type?: string
  capabilities?: string[]
}

interface ClaudeWebUsage {
  daily_usage?: number
  daily_limit?: number
  monthly_usage?: number
  monthly_limit?: number
}

export class ClaudeAdapter implements ProviderAdapter {
  id = 'claude'
  displayName = 'Claude'
  defaultEnabled = true
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'> = ['api', 'cli', 'local']

  async fetch(ctx: FetchContext): Promise<UsageSnapshot> {
    // Strategy 1: Try OAuth from Claude CLI credentials file
    const oauthResult = await this.fetchViaOAuth()
    if (oauthResult && !oauthResult.error) return oauthResult

    // Strategy 2: Try API key if user provided one manually
    const apiKey = ctx.secrets.get('claude-api-key')
    if (apiKey) {
      const result = await this.fetchViaAPIKey(apiKey)
      if (!result.error) return result
    }

    // Strategy 3: Try CLI probe
    const cliResult = await this.fetchViaCLI()
    if (cliResult && !cliResult.error) return cliResult

    // Return best available result (with error info)
    return oauthResult || cliResult || this.makeSnapshot({
      error: { kind: 'auth', message: 'No Claude credentials found. Run `claude` CLI to authenticate, or add API key in Settings.' },
    })
  }

  /** Load OAuth credentials from ~/.claude/.credentials.json */
  private loadOAuthCredentials(): OAuthCredentials | null {
    const possiblePaths = [
      path.join(os.homedir(), '.claude', '.credentials.json'),
      // WSL: check Windows user home too
      ...(process.platform === 'win32' ? [] : this.getWindowsHomePaths().map(
        p => path.join(p, '.claude', '.credentials.json')
      )),
    ]

    for (const credPath of possiblePaths) {
      try {
        if (fs.existsSync(credPath)) {
          const raw = fs.readFileSync(credPath, 'utf-8')
          const data = JSON.parse(raw)

          // The credentials file can have multiple formats:
          // 1. Direct: { accessToken, refreshToken }
          // 2. Nested: { claudeAiOauth: { accessToken, refreshToken } }
          if (data.accessToken) {
            return data as OAuthCredentials
          }
          if (data.claudeAiOauth?.accessToken) {
            return data.claudeAiOauth as OAuthCredentials
          }
          // Try first key that has accessToken
          for (const val of Object.values(data)) {
            if (val && typeof val === 'object' && 'accessToken' in (val as Record<string, unknown>)) {
              return val as OAuthCredentials
            }
          }
        }
      } catch {
        continue
      }
    }
    return null
  }

  private getWindowsHomePaths(): string[] {
    const paths: string[] = []
    const winHome = process.env.WSLENV ? `/mnt/c/Users/${process.env.USER || process.env.USERNAME}` : ''
    if (winHome) paths.push(winHome)
    const userProfile = process.env.USERPROFILE
    if (userProfile) paths.push(userProfile)
    return paths
  }

  /** Fetch usage via Claude OAuth API — returns plan, session, weekly usage */
  private async fetchViaOAuth(): Promise<UsageSnapshot | null> {
    const creds = this.loadOAuthCredentials()
    if (!creds) return null

    try {
      const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'anthropic-beta': 'oauth-2025-04-20',
          'User-Agent': 'CodexBar-Windows',
        },
      })

      if (response.status === 401 && creds.refreshToken) {
        // Token expired — try refresh
        const newToken = await this.refreshOAuthToken(creds.refreshToken)
        if (newToken) {
          return this.fetchViaOAuthWithToken(newToken)
        }
      }

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'auth', message: `Claude OAuth: HTTP ${response.status}. Run \`claude\` to re-authenticate.` },
        })
      }

      const data: OAuthUsageResponse = await response.json()
      return this.parseOAuthUsage(data)
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: `Claude OAuth: ${err instanceof Error ? err.message : String(err)}` },
      })
    }
  }

  private async fetchViaOAuthWithToken(accessToken: string): Promise<UsageSnapshot> {
    try {
      const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'anthropic-beta': 'oauth-2025-04-20',
          'User-Agent': 'CodexBar-Windows',
        },
      })

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'auth', message: `Claude OAuth: HTTP ${response.status}` },
        })
      }

      const data: OAuthUsageResponse = await response.json()
      return this.parseOAuthUsage(data)
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }

  private async refreshOAuthToken(refreshToken: string): Promise<string | null> {
    try {
      const clientId = '9d1c250a-e61b-44d9-88ed-5944d1962f5e' // Claude CLI public OAuth client ID
      const response = await fetch('https://platform.claude.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update stored credentials
        const credPath = path.join(os.homedir(), '.claude', '.credentials.json')
        try {
          const existing = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
          if (existing.accessToken) existing.accessToken = data.access_token
          fs.writeFileSync(credPath, JSON.stringify(existing, null, 2))
        } catch { /* ignore write errors */ }
        return data.access_token
      }
    } catch { /* ignore refresh errors */ }
    return null
  }

  private parseOAuthUsage(data: OAuthUsageResponse): UsageSnapshot {
    const session = data.five_hour
    const weekly = data.seven_day
    const extra = data.extra_usage

    // Determine plan from available data
    let plan = 'Free'
    if (extra?.is_enabled) {
      plan = extra.monthly_limit && extra.monthly_limit >= 100 ? 'Max' : 'Pro'
    } else if (data.seven_day_opus) {
      plan = 'Pro'
    }

    return this.makeSnapshot({
      session: session?.utilization != null ? {
        used: Math.round(session.utilization * 100),
        limit: 100,
        resetAt: session.resets_at ?? undefined,
      } : undefined,
      weekly: weekly?.utilization != null ? {
        used: Math.round(weekly.utilization * 100),
        limit: 100,
        resetAt: weekly.resets_at ?? undefined,
      } : undefined,
      credits: extra?.is_enabled ? {
        used: extra.used_credits ? Math.round(extra.used_credits * 100) : undefined,
        remaining: extra.monthly_limit && extra.used_credits
          ? Math.round((extra.monthly_limit - extra.used_credits) * 100)
          : undefined,
        currency: extra.currency ?? 'USD',
      } : undefined,
      status: { level: 'ok', message: `Plan: ${plan}` },
    })
  }

  /** Fetch via manual API key — limited info, no plan details */
  private async fetchViaAPIKey(apiKey: string): Promise<UsageSnapshot> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'test' }],
        }),
      })

      if (response.ok) {
        return this.makeSnapshot({
          status: { level: 'ok', message: 'Plan: API Key (pay-per-use)' },
        })
      }
      return this.makeSnapshot({
        error: { kind: 'auth', message: `API key invalid: HTTP ${response.status}` },
      })
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }

  /** Fetch via claude CLI —  detect presence and read auth */
  private async fetchViaCLI(): Promise<UsageSnapshot | null> {
    const commands = [
      'claude --version',
    ]

    // Check if CLI exists
    let cliVersion = ''
    for (const cmd of commands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 5000 })
        cliVersion = stdout.trim()
        break
      } catch { continue }
    }

    if (!cliVersion) return null

    // CLI is installed — auth credentials should be usable via OAuth strategy.
    // If we got here, OAuth strategy failed. Indicate CLI is present but auth may be needed.
    return this.makeSnapshot({
      status: { level: 'degraded', message: `Claude CLI detected (${cliVersion}). Run \`claude\` to authenticate.` },
    })
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
