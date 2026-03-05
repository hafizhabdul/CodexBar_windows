import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'

interface OpenRouterKeyInfo {
  data: {
    label?: string
    usage: number
    limit?: number | null
    is_free_tier: boolean
    rate_limit: {
      requests: number
      interval: string
    }
  }
}

export class OpenRouterAdapter implements ProviderAdapter {
  id = 'openrouter'
  displayName = 'OpenRouter'
  defaultEnabled = false
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'> = ['api']

  async fetch(ctx: FetchContext): Promise<UsageSnapshot> {
    const apiKey = ctx.secrets.get('openrouter-api-key')
    if (!apiKey) {
      return this.makeSnapshot({
        error: { kind: 'auth', message: 'API key not set. Add in Settings → Providers → OpenRouter.' },
      })
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })

      if (!response.ok) {
        return this.makeSnapshot({
          error: { kind: 'auth', message: `OpenRouter API: HTTP ${response.status}` },
        })
      }

      const data: OpenRouterKeyInfo = await response.json()
      const usage = data.data.usage ?? 0
      const limit = data.data.limit
      const isFreeTier = data.data.is_free_tier
      const plan = isFreeTier ? 'Free Tier' : (limit ? 'Credit-based' : 'Unlimited')

      return this.makeSnapshot({
        session: limit ? {
          used: Math.round(usage * 100) / 100,
          limit: limit,
          // No resetAt for credits
        } : undefined,
        credits: {
          used: Math.round(usage * 100),
          remaining: limit ? Math.round((limit - usage) * 100) : undefined,
          currency: 'USD',
        },
        status: {
          level: isFreeTier && limit && usage >= limit * 0.9 ? 'degraded' : 'ok',
          message: `Plan: ${plan}${data.data.label ? ` (${data.data.label})` : ''}`,
        },
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
