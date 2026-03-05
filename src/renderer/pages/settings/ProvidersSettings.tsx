import { useState } from 'react'
import { Switch } from '../../components/ui/switch'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { ProviderLogo } from '../../components/ProviderLogo'
import { providerColors } from '../../lib/providerColors'
import { cn, getUsageBarColor, getUsageBarBgColor, getUsageColor } from '../../lib/utils'
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
        <h3 className="text-xl font-bold tracking-tight">Providers</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enable and configure your AI provider integrations
        </p>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
        {/* ── Provider list ── */}
        <div className="w-64 border border-border/50 rounded-xl bg-card overflow-y-auto flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {providers.length} providers available
            </p>
          </div>
          {providers.map((provider) => {
            const isEnabled = settings.enabledProviders.includes(provider.id)
            const snapshot = snapshots.find((s) => s.provider === provider.id)
            const hasError = !!snapshot?.error
            const isSelected = selectedProvider === provider.id
            const colors = providerColors[provider.id]

            return (
              <div
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  'flex items-center justify-between px-3 py-3 cursor-pointer border-b border-border/30 last:border-b-0 transition-all duration-150',
                  isSelected ? 'bg-primary/10' : 'hover:bg-accent/40'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      isSelected ? 'ring-1 ring-white/20 shadow-sm' : ''
                    )}
                    style={{ backgroundColor: colors?.bg ?? '#64748b30' }}
                  >
                    <ProviderLogo id={provider.id} size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      'text-sm block truncate text-foreground',
                      isSelected ? 'font-bold' : 'font-semibold'
                    )}>
                      {provider.displayName}
                    </span>
                    {isEnabled && snapshot && !hasError && snapshot.status?.message && (
                      <span className="text-[10px] text-emerald-400 block truncate font-medium">
                        {snapshot.status.message}
                      </span>
                    )}
                    {isEnabled && hasError && (
                      <span className="text-[10px] text-red-400 truncate flex items-center gap-0.5 font-medium">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        Error
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
        <div className="flex-1 border border-border/50 rounded-xl bg-card overflow-y-auto">
          {selectedMeta ? (
            <ProviderDetail
              provider={selectedMeta}
              snapshot={selectedSnapshot}
              settings={settings}
              onUpdate={onUpdate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
              </svg>
              <p className="text-sm">Select a provider to configure</p>
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
  const colors = providerColors[provider.id]

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
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: colors?.bg ?? '#64748b30' }}
          >
            <ProviderLogo id={provider.id} size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold tracking-tight text-foreground">{provider.displayName}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              {provider.strategies.map((s) => (
                <Badge key={s} variant="secondary" className="text-[9px] font-semibold uppercase tracking-wider rounded-md px-1.5 py-0">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Badge
          variant={isEnabled ? 'default' : 'outline'}
          className={cn(
            'text-[10px] rounded-lg',
            isEnabled && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
          )}
        >
          {isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {/* ── Live status ── */}
      {snapshot && (
        <div className="rounded-xl border border-border/50 bg-accent/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Live Status</h5>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {new Date(snapshot.fetchedAt).toLocaleString()}
            </span>
          </div>

          {snapshot.error ? (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-2.5">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
              </svg>
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

          {snapshot.session && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Session (5h)</span>
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
                <span className="font-semibold text-foreground">Weekly</span>
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
            <div className="flex items-center justify-between rounded-lg bg-accent/40 px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
                </svg>
                Credits
              </span>
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
        {provider.strategies.includes('api') && (
          <div className="rounded-xl border border-border/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
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
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Encrypted with Windows DPAPI
            </p>
          </div>
        )}

        {provider.strategies.includes('cli') && (
          <div className="rounded-xl border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" />
              </svg>
              <h5 className="text-sm font-semibold">CLI Integration</h5>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatically detects <strong className="text-foreground">{provider.displayName}</strong> CLI on your system.
              If you&apos;re logged in via the CLI, usage and plan info will be read automatically — no API key needed.
            </p>
          </div>
        )}

        {provider.strategies.includes('local') && (
          <div className="rounded-xl border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
              <h5 className="text-sm font-semibold">Local Credentials</h5>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reads OAuth tokens from local credential files (e.g. <code className="bg-muted px-1 py-0.5 rounded text-[10px] text-foreground">~/.claude/.credentials.json</code>).
              Log in via the provider&apos;s CLI and CodexBar will automatically pick up your session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
