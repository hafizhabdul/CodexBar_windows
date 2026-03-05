import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  cn,
  formatTimeUntil,
  getUsageBarColor,
  getUsageBarBgColor,
  getUsageColor,
  getUsageLevel,
  getProviderIcon,
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
  const borderColor = hasError
    ? 'border-red-500/30'
    : statusLevel === 'degraded'
      ? 'border-amber-500/30'
      : 'border-border'

  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-3 transition-colors', borderColor)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">{getProviderIcon(snapshot.provider)}</span>
          <div>
            <h3 className="text-sm font-semibold capitalize leading-tight">{snapshot.provider}</h3>
            {snapshot.status?.message && (
              <span className={cn(
                'text-[11px] font-medium',
                statusLevel === 'ok' ? 'text-emerald-400' : 'text-amber-400'
              )}>
                {snapshot.status.message}
              </span>
            )}
          </div>
          {snapshot.stale && (
            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/40 ml-1">
              Stale
            </Badge>
          )}
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-accent"
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
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <span className="text-red-400 text-sm leading-none mt-0.5">⚠</span>
          <p className="text-xs text-red-300 leading-relaxed">{snapshot.error!.message}</p>
        </div>
      )}

      {/* ── Usage meters ── */}
      {hasData && (
        <div className="space-y-2.5">
          {/* Session (5h) */}
          {hasSession && (
            <UsageMeter
              label="Session (5h)"
              used={snapshot.session!.used}
              limit={snapshot.session!.limit}
              resetAt={snapshot.session!.resetAt}
            />
          )}

          {/* Weekly (7d) */}
          {hasWeekly && (
            <UsageMeter
              label="Weekly"
              used={snapshot.weekly!.used}
              limit={snapshot.weekly!.limit}
              resetAt={snapshot.weekly!.resetAt}
            />
          )}

          {/* Credits */}
          {hasCredits && <CreditsMeter credits={snapshot.credits!} />}
        </div>
      )}

      {/* ── No data state ── */}
      {!hasData && !hasError && (
        <p className="text-xs text-muted-foreground italic">Waiting for data…</p>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">
          Updated {new Date(snapshot.fetchedAt).toLocaleTimeString()}
        </span>
        {hasSession && snapshot.session!.limit && (
          <PercentBadge used={snapshot.session!.used} limit={snapshot.session!.limit} />
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function UsageMeter({ label, used, limit, resetAt }: {
  label: string
  used: number
  limit?: number
  resetAt?: string
}) {
  const pct = limit ? Math.round((used / limit) * 100) : null
  const level = getUsageLevel(used, limit)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          {pct != null && (
            <span className={cn('text-sm font-bold tabular-nums', getUsageColor(used, limit))}>
              {pct}%
            </span>
          )}
          {resetAt && (
            <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
              ↻ {formatTimeUntil(resetAt)}
            </span>
          )}
        </div>
      </div>
      {limit != null && (
        <Progress
          value={used}
          max={limit}
          barClassName={getUsageBarColor(used, limit)}
          bgClassName={getUsageBarBgColor(used, limit)}
          className={level === 'critical' ? 'animate-pulse' : ''}
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
    <div className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">💰</span>
        <span className="text-xs font-medium text-foreground/80">Credits</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {remaining != null && (
          <span className="font-bold text-emerald-400 tabular-nums">
            {currency}{remaining.toFixed(2)}
            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">left</span>
          </span>
        )}
        {used != null && (
          <span className="text-muted-foreground tabular-nums text-xs">
            {currency}{used.toFixed(2)} used
          </span>
        )}
      </div>
    </div>
  )
}

function PercentBadge({ used, limit }: { used: number; limit: number }) {
  const level = getUsageLevel(used, limit)
  const colors = {
    safe: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    moderate: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  const labels = { safe: 'OK', moderate: 'Moderate', warning: 'High', critical: 'Critical' }

  return (
    <span className={cn('text-[10px] font-semibold rounded-full px-2 py-0.5 border', colors[level])}>
      {labels[level]}
    </span>
  )
}
