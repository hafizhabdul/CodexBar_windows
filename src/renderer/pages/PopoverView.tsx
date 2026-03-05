import { useSnapshots } from '../hooks/useAppState'
import { ProviderCard } from '../components/ProviderCard'
import { Button } from '../components/ui/button'

export function PopoverView() {
  const { snapshots, loading, refresh, refreshProvider } = useSnapshots()

  return (
    <div className="flex flex-col h-screen bg-background dark">
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/50">
        <div className="flex items-center gap-2">
          <span className="text-base">🎚️</span>
          <h1 className="text-sm font-bold tracking-tight">CodexBar</h1>
          <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-medium">
            {snapshots.length} provider{snapshots.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-lg"
            onClick={refresh}
            disabled={loading}
          >
            <svg
              className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-lg"
            onClick={() => window.codexbar.openSettings()}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </Button>
        </div>
      </div>

      {/* ── Provider list ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && snapshots.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <p className="text-sm text-muted-foreground">Loading providers…</p>
          </div>
        )}

        {snapshots.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <span className="text-4xl">🎚️</span>
            <div>
              <p className="text-sm font-medium">No providers enabled</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enable providers in Settings to start monitoring your AI usage
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 rounded-lg"
              onClick={() => window.codexbar.openSettings()}
            >
              Open Settings
            </Button>
          </div>
        )}

        {snapshots.map((snapshot) => (
          <ProviderCard
            key={snapshot.provider}
            snapshot={snapshot}
            onRefresh={() => refreshProvider(snapshot.provider)}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2 border-t border-border/40 bg-card/30">
        <p className="text-[10px] text-muted-foreground text-center tracking-wide">
          CodexBar for Windows — May your tokens never run out ✨
        </p>
      </div>
    </div>
  )
}
