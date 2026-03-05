import { useSnapshots } from '../hooks/useAppState'
import { ProviderCard } from '../components/ProviderCard'
import { Button } from '../components/ui/button'

export function PopoverView() {
  const { snapshots, loading, refresh, refreshProvider } = useSnapshots()

  return (
    <div className="flex flex-col h-screen bg-background dark">
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
            </svg>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">CodexBar</h1>
          <span className="text-[10px] text-muted-foreground bg-muted/80 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
            {snapshots.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg"
            onClick={refresh}
            disabled={loading}
            title="Refresh all"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
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
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-lg"
            onClick={() => window.codexbar.openSettings()}
            title="Settings"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        </div>
      </div>

      {/* ── Provider list ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading && snapshots.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-[12px] text-muted-foreground/70">Loading providers…</p>
          </div>
        )}

        {snapshots.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium">No providers enabled</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1.5 leading-relaxed">
                Enable providers in Settings to start monitoring your AI usage
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 rounded-xl h-8 px-4 text-[11px]"
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
      <div className="px-4 py-2.5 border-t border-border/40">
        <p className="text-[9px] text-muted-foreground/60 text-center tracking-wider uppercase font-semibold">
          CodexBar for Windows
        </p>
      </div>
    </div>
  )
}
