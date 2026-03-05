import type { FetchContext, ProviderAdapter } from '../providerRegistry'
import type { UsageSnapshot } from '../../../shared/types'

export class GenericAdapter implements ProviderAdapter {
  id: string
  displayName: string
  defaultEnabled: boolean
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'>

  constructor(meta: { id: string; displayName: string; defaultEnabled: boolean; strategies: Array<'api' | 'cli' | 'cookie' | 'local'> }) {
    this.id = meta.id
    this.displayName = meta.displayName
    this.defaultEnabled = meta.defaultEnabled
    this.strategies = meta.strategies
  }

  async fetch(_ctx: FetchContext): Promise<UsageSnapshot> {
    return {
      provider: this.id,
      fetchedAt: new Date().toISOString(),
      stale: false,
      error: {
        kind: 'unsupported',
        message: `${this.displayName} adapter not yet implemented for Windows. Coming soon!`,
      },
    }
  }
}
