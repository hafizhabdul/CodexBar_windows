import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ProviderLogo, providerColors } from './ProviderLogo'
import {
  cn,
  formatTimeUntil,
  getUsageBarColor,
  getUsageBarBgColor,
  getUsageColor,
  getUsageLevel,
} from '../lib/utils'
import type { UsageSnapshot } from '../../shared/types'

interface ProviderCardProps {
  snapshot: UsageSnapshot
  onRefresh?: () => void
}

export function ProviderCard({ snapshot, onRefresh }: ProviderCardProps) {
  const hasError = !!snapshot.error
  const hasSession = !!snapshot.session
  const hasWeekly = !!snapshot.weekly
  const hasCredits = !!snapshot.credits
  const hasData = hasSession || hasWeekly || hasCredits

  const statusLevel = snapshot.status?.level ?? (hasError ? 'down' : 'ok')
  const colors = providerColors[snapshot.provider]

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:shadow-black/10 hover:border-border/80',
        hasError
          ? 'border-red-500/25'
          : statusLevel === 'degraded'
            ? 'border-amber-500/25'
            : 'border-border/50'
      )}
    >
      {/* Accent gradient at top */}
      {colors && (
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}80)` }}
        />
      )}

      <div className="p-4 space-y-3">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderLogo id={snapshot.provider} size={32} />
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight capitalize truncate text-foreground">
                {snapshot.provider}
              </h3>
              {snapshot.status?.message && (
                <span className={cn(
                  'text-[11px] font-semibold block truncate mt-0.5',
                  statusLevel === 'ok' ? 'text-emerald-400' :
                  statusLevel === 'degraded' ? 'text-amber-400' : 'text-red-400'
                )}>
                  {snapshot.status.message}
                </span>
              )}
            </div>
            {snapshot.stale && (
              <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-400/30 px-1.5">
                STALE
              </Badge>
            )}
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRefresh}
              title="Refresh"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </Button>
          )}
        </div>

        {/* ── Error ── */}
        {hasError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/15 px-3 py-2.5">
            <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] text-red-300/90 leading-relaxed">{snapshot.error!.message}</p>
          </div>
        )}

        {/* ── Usage meters ── */}
        {hasData && (
          <div className="space-y-2.5">
            {hasSession && (
              <UsageMeter
                label="Session (5h)"
                used={snapshot.session!.used}
                limit={snapshot.session!.limit}
                resetAt={snapshot.session!.resetAt}
                accentColor={colors?.accent}
              />
            )}
            {hasWeekly && (
              <UsageMeter
                label="Weekly"
                used={snapshot.weekly!.used}
                limit={snapshot.weekly!.limit}
                resetAt={snapshot.weekly!.resetAt}
                accentColor={colors?.accent}
              />
            )}
            {hasCredits && <CreditsMeter credits={snapshot.credits!} />}
          </div>
        )}

        {/* ── No data state ── */}
        {!hasData && !hasError && (
          <div className="flex items-center gap-2 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
            <p className="text-[11px] text-muted-foreground/70">Waiting for data…</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {hasSession && snapshot.session!.limit && (
            <PercentBadge used={snapshot.session!.used} limit={snapshot.session!.limit} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function UsageMeter({ label, used, limit, resetAt, accentColor }: {
  label: string
  used: number
  limit?: number
  resetAt?: string
  accentColor?: string
}) {
  const pct = limit ? Math.round((used / limit) * 100) : null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/90">{label}</span>
        <div className="flex items-center gap-2">
          {pct != null && (
            <span className={cn('text-[13px] font-bold tabular-nums', getUsageColor(used, limit))}>
              {pct}%
            </span>
          )}
          {resetAt && (
            <span className="text-[9px] text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5 tabular-nums">
              ↻ {formatTimeUntil(resetAt)}
            </span>
          )}
        </div>
      </div>
      {limit != null && (
        <Progress
          value={used}
          max={limit}
          barClassName={accentColor ? '' : getUsageBarColor(used, limit)}
          barStyle={accentColor ? { backgroundColor: accentColor, opacity: 0.85 } : undefined}
          bgClassName={getUsageBarBgColor(used, limit)}
          className="h-2"
        />
      )}
    </div>
  )
}

function CreditsMeter({ credits }: { credits: NonNullable<UsageSnapshot['credits']> }) {
  const remaining = credits.remaining != null ? credits.remaining / 100 : null
  const used = credits.used != null ? credits.used / 100 : null
  const currency = credits.currency === 'USD' ? '$' : credits.currency ?? ''

  return (
    <div className="flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 0 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
        <span className="text-[11px] font-semibold text-foreground/90">Credits</span>
      </div>
      <div className="flex items-center gap-3 text-[13px]">
        {remaining != null && (
          <span className="font-bold text-emerald-400 tabular-nums">
            {currency}{remaining.toFixed(2)}
          </span>
        )}
        {used != null && (
          <span className="text-muted-foreground tabular-nums text-[11px]">
            -{currency}{used.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  )
}

function PercentBadge({ used, limit }: { used: number; limit: number }) {
  const level = getUsageLevel(used, limit)
  const styles = {
    safe: 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/20',
    moderate: 'bg-blue-500/10 text-blue-400/90 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-400/90 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-400/90 border-red-500/20',
  }
  const labels = { safe: 'OK', moderate: 'Moderate', warning: 'High', critical: 'Critical' }

  return (
    <span className={cn('text-[9px] font-semibold rounded-full px-2 py-0.5 border', styles[level])}>
      {labels[level]}
    </span>
  )
}
