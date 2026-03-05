import { useState } from 'react'
import { Switch } from '../../components/ui/switch'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { cn, getProviderIcon, getUsageBarColor, getUsageBarBgColor, getUsageColor } from '../../lib/utils'
import type { AppSettings, ProviderInfo, UsageSnapshot } from '../../../shared/types'

interface ProvidersSettingsProps {
  settings: AppSettings
  providers: ProviderInfo[]
  snapshots: UsageSnapshot[]
  onUpdate: (partial: Partial<AppSettings>) => void
}

export function ProvidersSettings({ settings, providers, snapshots, onUpdate }: ProvidersSettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    providers.length > 0 ? providers[0].id : null
  )

  const toggleProvider = (id: string, enabled: boolean) => {
    const current = settings.enabledProviders || []
    const updated = enabled
      ? [...current, id]
      : current.filter((p) => p !== id)
    onUpdate({ enabledProviders: updated })
  }

  const selectedMeta = providers.find((p) => p.id === selectedProvider)
  const selectedSnapshot = snapshots.find((s) => s.provider === selectedProvider)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold">Providers</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enable and configure your AI providers
        </p>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
        {/* ── Provider list ── */}
        <div className="w-60 border rounded-xl bg-card overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-border/50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {providers.length} providers available
            </p>
          </div>
          {providers.map((provider) => {
            const isEnabled = settings.enabledProviders.includes(provider.id)
            const snapshot = snapshots.find((s) => s.provider === provider.id)
            const hasError = !!snapshot?.error
            const isSelected = selectedProvider === provider.id

            return (
              <div
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-border/30 last:border-b-0 transition-colors',
                  isSelected ? 'bg-primary/10' : 'hover:bg-accent/50'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{getProviderIcon(provider.id)}</span>
                  <div className="min-w-0">
                    <span className={cn(
                      'text-sm block truncate',
                      isSelected ? 'font-semibold text-primary' : 'font-medium'
                    )}>
                      {provider.displayName}
                    </span>
                    {/* Inline mini status */}
                    {isEnabled && snapshot && !hasError && snapshot.status?.message && (
                      <span className="text-[10px] text-emerald-400 block truncate">
                        {snapshot.status.message}
                      </span>
                    )}
                    {isEnabled && hasError && (
                      <span className="text-[10px] text-red-400 block truncate">
                        ⚠ Error
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onChange={(v) => {
                    toggleProvider(provider.id, v)
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* ── Provider detail ── */}
        <div className="flex-1 border rounded-xl bg-card overflow-y-auto">
          {selectedMeta ? (
            <ProviderDetail
              provider={selectedMeta}
              snapshot={selectedSnapshot}
              settings={settings}
              onUpdate={onUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Select a provider</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProviderDetail({
  provider,
  snapshot,
  settings,
  onUpdate,
}: {
  provider: ProviderInfo
  snapshot?: UsageSnapshot
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => void
}) {
  const config = settings.providerConfigs?.[provider.id] ?? {}
  const [apiKey, setApiKey] = useState(config.apiKey ?? '')
  const isEnabled = settings.enabledProviders.includes(provider.id)

  const saveApiKey = async () => {
    if (apiKey) {
      await window.codexbar.setSecret(`${provider.id}-api-key`, apiKey)
    } else {
      await window.codexbar.deleteSecret(`${provider.id}-api-key`)
    }
    onUpdate({
      providerConfigs: {
        ...settings.providerConfigs,
        [provider.id]: { ...config, apiKey: apiKey ? '***' : undefined },
      },
    })
  }

  return (
    <div className="p-5 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getProviderIcon(provider.id)}</span>
          <div>
            <h4 className="text-lg font-bold">{provider.displayName}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              {provider.strategies.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Badge variant={isEnabled ? 'default' : 'outline'} className="text-[10px]">
          {isEnabled ? '✓ Enabled' : 'Disabled'}
        </Badge>
      </div>

      {/* ── Live status ── */}
      {snapshot && (
        <div className="rounded-xl border bg-accent/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Status</h5>
            <span className="text-[10px] text-muted-foreground">
              {new Date(snapshot.fetchedAt).toLocaleString()}
            </span>
          </div>

          {/* Connection status */}
          {snapshot.error ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <span className="text-red-400 text-sm mt-0.5">⚠</span>
              <p className="text-xs text-red-300 leading-relaxed">{snapshot.error.message}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">Connected</span>
              {snapshot.status?.message && (
                <span className="text-xs text-muted-foreground ml-1">— {snapshot.status.message}</span>
              )}
            </div>
          )}

          {/* Usage bars in detail panel */}
          {snapshot.session && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Session (5h)</span>
                <span className={cn('font-bold tabular-nums', getUsageColor(snapshot.session.used, snapshot.session.limit))}>
                  {snapshot.session.limit ? `${Math.round((snapshot.session.used / snapshot.session.limit) * 100)}%` : snapshot.session.used}
                </span>
              </div>
              {snapshot.session.limit && (
                <Progress
                  value={snapshot.session.used}
                  max={snapshot.session.limit}
                  barClassName={getUsageBarColor(snapshot.session.used, snapshot.session.limit)}
                  bgClassName={getUsageBarBgColor(snapshot.session.used, snapshot.session.limit)}
                />
              )}
            </div>
          )}

          {snapshot.weekly && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Weekly</span>
                <span className={cn('font-bold tabular-nums', getUsageColor(snapshot.weekly.used, snapshot.weekly.limit))}>
                  {snapshot.weekly.limit ? `${Math.round((snapshot.weekly.used / snapshot.weekly.limit) * 100)}%` : snapshot.weekly.used}
                </span>
              </div>
              {snapshot.weekly.limit && (
                <Progress
                  value={snapshot.weekly.used}
                  max={snapshot.weekly.limit}
                  barClassName={getUsageBarColor(snapshot.weekly.used, snapshot.weekly.limit)}
                  bgClassName={getUsageBarBgColor(snapshot.weekly.used, snapshot.weekly.limit)}
                />
              )}
            </div>
          )}

          {snapshot.credits && (
            <div className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
              <span className="text-xs font-medium">💰 Credits</span>
              <div className="text-sm font-bold tabular-nums text-emerald-400">
                {snapshot.credits.remaining != null && `$${(snapshot.credits.remaining / 100).toFixed(2)} left`}
                {snapshot.credits.used != null && (
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (${(snapshot.credits.used / 100).toFixed(2)} used)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Configuration ── */}
      <div className="space-y-4">
        {/* API Key input */}
        {provider.strategies.includes('api') && (
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔑</span>
              <h5 className="text-sm font-semibold">API Key</h5>
              <span className="text-[10px] text-muted-foreground">(optional if CLI is available)</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter API key…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-xs"
              />
              <Button size="sm" onClick={saveApiKey} className="rounded-lg px-4">
                Save
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span>🔒</span> Encrypted with Windows DPAPI
            </p>
          </div>
        )}

        {/* CLI integration info */}
        {provider.strategies.includes('cli') && (
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">💻</span>
              <h5 className="text-sm font-semibold">CLI Integration</h5>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatically detects <strong>{provider.displayName}</strong> CLI on your system or via WSL.
              If you&apos;re logged in via the CLI, usage and plan info will be read automatically — no API key needed.
            </p>
          </div>
        )}

        {/* Local credential detection */}
        {provider.strategies.includes('local') && (
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">📁</span>
              <h5 className="text-sm font-semibold">Local Credentials</h5>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reads OAuth tokens from local credential files (e.g. <code className="bg-muted px-1 py-0.5 rounded text-[10px]">~/.claude/.credentials.json</code>).
              Log in via the provider&apos;s CLI and CodexBar will automatically pick up your session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
