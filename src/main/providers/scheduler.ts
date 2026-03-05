import type { AppSettings, UsageSnapshot } from '../../shared/types'
import type { SecretsStore } from '../storage/secretsStore'
import { createAdapter, type ProviderAdapter } from './providerRegistry'

export class ProviderScheduler {
  private settings: AppSettings
  private secrets: SecretsStore
  private onUpdate: (snapshots: UsageSnapshot[]) => void
  private snapshots: Map<string, UsageSnapshot> = new Map()
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    settings: AppSettings,
    secrets: SecretsStore,
    onUpdate: (snapshots: UsageSnapshot[]) => void
  ) {
    this.settings = settings
    this.secrets = secrets
    this.onUpdate = onUpdate
  }

  start() {
    this.refreshAll()
    const intervalMs = (this.settings.refreshInterval || 120) * 1000
    this.timer = setInterval(() => this.refreshAll(), intervalMs)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  updateSettings(settings: AppSettings) {
    this.settings = settings
    this.stop()
    this.start()
  }

  getSnapshots(): UsageSnapshot[] {
    return Array.from(this.snapshots.values())
  }

  async refreshAll(): Promise<UsageSnapshot[]> {
    const providers = this.settings.enabledProviders || []
    const promises = providers.map(id => this.refreshProvider(id))
    const results = await Promise.allSettled(promises)

    const snapshots = results
      .filter((r): r is PromiseFulfilledResult<UsageSnapshot> => r.status === 'fulfilled')
      .map(r => r.value)

    this.onUpdate(this.getSnapshots())
    return snapshots
  }

  async refreshProvider(providerId: string): Promise<UsageSnapshot> {
    const adapter = createAdapter(providerId)
    if (!adapter) {
      const errorSnapshot: UsageSnapshot = {
        provider: providerId,
        fetchedAt: new Date().toISOString(),
        stale: false,
        error: { kind: 'unsupported', message: `Unknown provider: ${providerId}` },
      }
      this.snapshots.set(providerId, errorSnapshot)
      return errorSnapshot
    }

    try {
      const snapshot = await adapter.fetch({
        settings: this.settings,
        secrets: this.secrets,
        providerConfig: this.settings.providerConfigs?.[providerId] ?? {},
      })
      this.snapshots.set(providerId, snapshot)
      return snapshot
    } catch (err) {
      const errorSnapshot: UsageSnapshot = {
        provider: providerId,
        fetchedAt: new Date().toISOString(),
        stale: false,
        error: {
          kind: 'network',
          message: err instanceof Error ? err.message : String(err),
        },
      }
      this.snapshots.set(providerId, errorSnapshot)
      return errorSnapshot
    }
  }
}
