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

    // Strategy 3: CLI fallback
    const cliResult = await this.fetchViaCLI()
    if (cliResult && !cliResult.error) return cliResult

    return oauthResult || cliResult || this.makeSnapshot({
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
          const data = JSON.parse(raw)
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
    const commands = [
      'codex --version 2>nul',
      'wsl.exe -e bash -lc "codex --version 2>/dev/null"',
    ]

    let cliAvailable = false
    for (const cmd of commands) {
      try {
        await execAsync(cmd, { timeout: 5000 })
        cliAvailable = true
        break
      } catch { continue }
    }
    if (!cliAvailable) return null

    const usageCommands = [
      'codex usage 2>nul',
      'wsl.exe -e bash -lc "codex usage 2>/dev/null"',
    ]

    for (const cmd of usageCommands) {
      try {
        const { stdout } = await execAsync(cmd, { timeout: 15000 })
        if (stdout.trim()) return this.parseCLIOutput(stdout.trim())
      } catch { continue }
    }
    return null
  }

  private parseCLIOutput(output: string): UsageSnapshot {
    const creditsMatch = output.match(/credits?[:\s]+\$?([\d.]+)/i)
    const sessionMatch = output.match(/(?:5h|session|primary)[:\s]+(\d+)%/i)
    const weeklyMatch = output.match(/(?:weekly|secondary)[:\s]+(\d+)%/i)
    const planMatch = output.match(/plan[:\s]+(\w+)/i)

    return this.makeSnapshot({
      session: sessionMatch ? { used: parseInt(sessionMatch[1], 10), limit: 100 } : undefined,
      weekly: weeklyMatch ? { used: parseInt(weeklyMatch[1], 10), limit: 100 } : undefined,
      credits: creditsMatch ? { remaining: Math.round(parseFloat(creditsMatch[1]) * 100), currency: 'USD' } : undefined,
      status: planMatch ? { level: 'ok', message: `Plan: ${planMatch[1]}` } : undefined,
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
