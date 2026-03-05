import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'
import { shell } from 'electron'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface CopilotUserResponse {
  copilot_plan: string
  quota_snapshots: {
    premium_interactions?: {
      percent_remaining: number
      is_placeholder?: boolean
    }
    chat?: {
      percent_remaining: number
      is_placeholder?: boolean
    }
  }
}

export class CopilotAdapter implements ProviderAdapter {
  id = 'copilot'
  displayName = 'GitHub Copilot'
  defaultEnabled = false
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'> = ['api']

  private readonly clientId = 'Iv1.b507a08c87ecfe98' // VS Code's Client ID

  async fetch(ctx: FetchContext): Promise<UsageSnapshot> {
    const token = ctx.secrets.get('copilot-token')
    if (!token) {
      return this.makeSnapshot({
        error: {
          kind: 'auth',
          message: 'Not authenticated. Use "Sign in with GitHub" in Settings → Providers → Copilot.',
        },
      })
    }

    return this.fetchUsage(token)
  }

  /** Start the GitHub Device Flow — returns device code info for the UI */
  async startDeviceFlow(): Promise<DeviceCodeResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      scope: 'read:user',
    })

    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) throw new Error(`Device flow failed: ${response.status}`)
    const data: DeviceCodeResponse = await response.json()

    // Open browser for user to authorize
    shell.openExternal(data.verification_uri)

    return data
  }

  /** Poll for token after device flow started */
  async pollForToken(deviceCode: string, interval: number): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    })

    while (true) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000))

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      const data = await response.json()

      if (data.error === 'authorization_pending') continue
      if (data.error === 'slow_down') {
        await new Promise(resolve => setTimeout(resolve, 5000))
        continue
      }
      if (data.error === 'expired_token') throw new Error('Authorization timed out')
      if (data.error) throw new Error(`OAuth error: ${data.error}`)

      if (data.access_token) return data.access_token
    }
  }

  private async fetchUsage(token: string): Promise<UsageSnapshot> {
    try {
      const response = await fetch('https://api.github.com/copilot_internal/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/json',
          'Editor-Version': 'vscode/1.96.2',
          'Editor-Plugin-Version': 'copilot-chat/0.26.7',
          'User-Agent': 'GitHubCopilotChat/0.26.7',
          'X-Github-Api-Version': '2025-04-01',
        },
      })

      if (response.status === 401 || response.status === 403) {
        return this.makeSnapshot({
          error: { kind: 'auth', message: 'GitHub token expired. Re-authenticate in Settings → Providers → Copilot.' },
        })
      }

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'network', message: `GitHub API: HTTP ${response.status}` },
        })
      }

      const data: CopilotUserResponse = await response.json()
      const plan = data.copilot_plan || 'Unknown'

      const premium = data.quota_snapshots?.premium_interactions
      const chat = data.quota_snapshots?.chat

      const premiumUsed = premium && !premium.is_placeholder
        ? Math.max(0, 100 - premium.percent_remaining)
        : undefined
      const chatUsed = chat && !chat.is_placeholder
        ? Math.max(0, 100 - chat.percent_remaining)
        : undefined

      return this.makeSnapshot({
        session: premiumUsed != null ? {
          used: Math.round(premiumUsed),
          limit: 100,
        } : undefined,
        weekly: chatUsed != null ? {
          used: Math.round(chatUsed),
          limit: 100,
        } : undefined,
        status: { level: 'ok', message: `Plan: ${plan}` },
      })
    } catch (err) {
      return this.makeSnapshot({
        error: { kind: 'network', message: err instanceof Error ? err.message : String(err) },
      })
    }
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
