import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

interface CodexAuthData {
  access_token?: string
  accessToken?: string
  refresh_token?: string
  refreshToken?: string
  account_id?: string
  accountId?: string
  id_token?: string
}

interface CodexAuthFile {
  auth_mode?: string
  OPENAI_API_KEY?: string | null
  tokens?: CodexAuthData
  last_refresh?: string
  // Flat format (legacy)
  access_token?: string
  accessToken?: string
  refresh_token?: string
  refreshToken?: string
  account_id?: string
  accountId?: string
}

interface CodexUsageResponse {
  plan_type?: string
  rate_limit?: {
    primary_window?: {
      used_percent: number
      reset_at: number
      limit_window_seconds: number
    }
    secondary_window?: {
      used_percent: number
      reset_at: number
      limit_window_seconds: number
    }
  }
  credits?: {
    has_credits: boolean
    unlimited: boolean
    balance?: number
  }
}

export class CodexAdapter implements ProviderAdapter {
  id = 'codex'
  displayName = 'Codex (OpenAI)'
  defaultEnabled = true
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'> = ['api', 'cli', 'local']

  async fetch(ctx: FetchContext): Promise<UsageSnapshot> {
    // Strategy 1: Try OAuth from Codex CLI auth file
    const oauthResult = await this.fetchViaOAuth()
    if (oauthResult && !oauthResult.error) return oauthResult

    // Strategy 2: Try manual API key
    const apiKey = ctx.secrets.get('openai-api-key')
    if (apiKey) {
      const result = await this.fetchViaAPIKey(apiKey)
      if (!result.error) return result
    }

    // Strategy 3: Try reading auth file directly for plan info (JWT claims)
    const auth = this.loadAuthData()
    if (auth) {
      const accessToken = auth.access_token || auth.accessToken
      if (accessToken) {
        const planInfo = this.parsePlanFromJWT(accessToken)
        if (planInfo) {
          return this.makeSnapshot({
            status: {
              level: 'ok',
              message: `Plan: ${planInfo}${oauthResult?.error ? ' (usage API unavailable)' : ''}`,
            },
          })
        }
      }
    }

    // Strategy 4: CLI fallback (detect presence)
    const cliResult = await this.fetchViaCLI()
    if (cliResult) return cliResult

    return oauthResult || this.makeSnapshot({
      error: { kind: 'auth', message: 'No Codex credentials found. Run `codex` CLI to authenticate, or add API key in Settings.' },
    })
  }

  private loadAuthData(): CodexAuthData | null {
    const possiblePaths = [
      path.join(os.homedir(), '.codex', 'auth.json'),
      path.join(os.homedir(), '.config', 'codex', 'auth.json'),
      // Windows paths
      ...(process.env.APPDATA ? [path.join(process.env.APPDATA, 'codex', 'auth.json')] : []),
      ...(process.env.LOCALAPPDATA ? [path.join(process.env.LOCALAPPDATA, 'codex', 'auth.json')] : []),
    ]

    for (const authPath of possiblePaths) {
      try {
        if (fs.existsSync(authPath)) {
          const raw = fs.readFileSync(authPath, 'utf-8')
          const data: CodexAuthFile = JSON.parse(raw)

          // Format 1: Nested tokens (codex-cli 0.107+)
          // { auth_mode: "chatgpt", tokens: { access_token, refresh_token, account_id } }
          if (data.tokens?.access_token || data.tokens?.accessToken) {
            return data.tokens as CodexAuthData
          }

          // Format 2: Flat format (legacy / older versions)
          // { access_token, refresh_token, account_id }
          if (data.access_token || data.accessToken) {
            return data as CodexAuthData
          }
        }
      } catch { continue }
    }
    return null
  }

  private async fetchViaOAuth(): Promise<UsageSnapshot | null> {
    const auth = this.loadAuthData()
    if (!auth) return null

    const accessToken = auth.access_token || auth.accessToken
    const accountId = auth.account_id || auth.accountId
    if (!accessToken) return null

    try {
      const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'CodexBar-Windows',
          'Accept': 'application/json',
          ...(accountId ? { 'ChatGPT-Account-Id': accountId } : {}),
        },
      })

      if (response.status === 401 || response.status === 403) {
        // Try token refresh
        const refreshToken = auth.refresh_token || auth.refreshToken
        if (refreshToken) {
          const newToken = await this.refreshToken(refreshToken)
          if (newToken) {
            return this.fetchUsageWithToken(newToken, accountId)
          }
        }
        return this.makeSnapshot({
          error: { kind: 'auth', message: `Codex OAuth: HTTP ${response.status}. Run \`codex\` to re-authenticate.` },
        })
      }

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'network', message: `Codex API: HTTP ${response.status}` },
        })
      }

      const data: CodexUsageResponse = await response.json()
      return this.parseUsageResponse(data)
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: `Codex OAuth: ${err instanceof Error ? err.message : String(err)}` },
      })
    }
  }

  private async fetchUsageWithToken(accessToken: string, accountId?: string | null): Promise<UsageSnapshot> {
    try {
      const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'CodexBar-Windows',
          'Accept': 'application/json',
          ...(accountId ? { 'ChatGPT-Account-Id': accountId } : {}),
        },
      })

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'auth', message: `Codex API: HTTP ${response.status}` },
        })
      }

      const data: CodexUsageResponse = await response.json()
      return this.parseUsageResponse(data)
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }

  private async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://auth.openai.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'app_codex',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update stored auth file
        const authPath = path.join(os.homedir(), '.codex', 'auth.json')
        try {
          const existing = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
          existing.access_token = data.access_token
          if (data.refresh_token) existing.refresh_token = data.refresh_token
          fs.writeFileSync(authPath, JSON.stringify(existing, null, 2))
        } catch { /* ignore */ }
        return data.access_token
      }
    } catch { /* ignore */ }
    return null
  }

  private parseUsageResponse(data: CodexUsageResponse): UsageSnapshot {
    const planLabels: Record<string, string> = {
      guest: 'Guest', free: 'Free', go: 'Go', plus: 'Plus', pro: 'Pro',
      team: 'Team', business: 'Business', enterprise: 'Enterprise',
      education: 'Education', edu: 'Education', free_workspace: 'Free Workspace',
    }
    const plan = data.plan_type ? (planLabels[data.plan_type] || data.plan_type) : 'Unknown'

    const primary = data.rate_limit?.primary_window
    const secondary = data.rate_limit?.secondary_window

    return this.makeSnapshot({
      session: primary ? {
        used: primary.used_percent,
        limit: 100,
        resetAt: new Date(primary.reset_at * 1000).toISOString(),
      } : undefined,
      weekly: secondary ? {
        used: secondary.used_percent,
        limit: 100,
        resetAt: new Date(secondary.reset_at * 1000).toISOString(),
      } : undefined,
      credits: data.credits?.has_credits ? {
        remaining: data.credits.balance != null ? Math.round(data.credits.balance * 100) : undefined,
        currency: 'USD',
      } : undefined,
      status: { level: 'ok', message: `Plan: ${plan}` },
    })
  }

  private async fetchViaAPIKey(apiKey: string): Promise<UsageSnapshot> {
    try {
      // Check if key works with a simple models list call
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      })

      if (response.ok) {
        return this.makeSnapshot({
          status: { level: 'ok', message: 'Plan: API Key (pay-per-use)' },
        })
      }
      return this.makeSnapshot({
        error: { kind: 'auth', message: `OpenAI API key invalid: HTTP ${response.status}` },
      })
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }

  private async fetchViaCLI(): Promise<UsageSnapshot | null> {
    // Check if Codex CLI is installed
    const versionCommands = [
      'codex --version',
    ]

    let cliVersion = ''
    for (const cmd of versionCommands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 5000 })
        cliVersion = stdout.trim()
        break
      } catch { continue }
    }

    if (!cliVersion) return null

    // CLI exists but OAuth strategies didn't work — the auth file may be missing
    // or the token expired. Read auth file as a last resort to extract plan info
    // from the JWT claims since `codex usage` subcommand doesn't exist.
    const auth = this.loadAuthData()
    if (auth) {
      const accessToken = auth.access_token || auth.accessToken
      if (accessToken) {
        // Try to extract plan info from JWT claims without calling API
        const planInfo = this.parsePlanFromJWT(accessToken)
        if (planInfo) {
          return this.makeSnapshot({
            status: { level: 'ok', message: `Plan: ${planInfo} (CLI: ${cliVersion})` },
          })
        }
      }
    }

    // CLI found but no usable auth data
    return this.makeSnapshot({
      status: { level: 'degraded', message: `Codex CLI detected (${cliVersion}). Run \`codex\` to authenticate.` },
    })
  }

  /** Extract plan type from JWT access token without API call */
  private parsePlanFromJWT(token: string): string | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
      const auth = payload?.['https://api.openai.com/auth']
      if (auth?.chatgpt_plan_type) {
        const planLabels: Record<string, string> = {
          guest: 'Guest', free: 'Free', go: 'Go', plus: 'Plus', pro: 'Pro',
          team: 'Team', business: 'Business', enterprise: 'Enterprise',
        }
        return planLabels[auth.chatgpt_plan_type] || auth.chatgpt_plan_type
      }
    } catch { /* JWT parsing failed */ }
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
