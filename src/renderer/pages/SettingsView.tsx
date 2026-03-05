import { useState } from 'react'
import { useSettings, useProviders, useSnapshots } from '../hooks/useAppState'
import { ProvidersSettings } from './settings/ProvidersSettings'
import { GeneralSettings } from './settings/GeneralSettings'
import { cn } from '../lib/utils'

type Tab = 'general' | 'providers' | 'about'

export function SettingsView() {
  const [tab, setTab] = useState<Tab>('providers')
  const { settings, updateSettings } = useSettings()
  const providers = useProviders()
  const { snapshots } = useSnapshots()

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground dark bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground/60">Loading settings…</span>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'providers',
      label: 'Providers',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      ),
    },
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-background dark">
      {/* ── Sidebar ── */}
      <div className="w-52 border-r border-border/50 bg-card/60 flex flex-col">
        <div className="px-4 py-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">CodexBar</h2>
              <p className="text-[10px] text-muted-foreground">Settings</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-150',
                tab === t.id
                  ? 'bg-primary/15 text-primary font-bold'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <span className={cn(
                'transition-colors',
                tab === t.id ? 'text-primary' : 'text-muted-foreground'
              )}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground text-center font-semibold tabular-nums">v1.0.0</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl p-6">
          {tab === 'general' && (
            <GeneralSettings settings={settings} onUpdate={updateSettings} />
          )}
          {tab === 'providers' && (
            <ProvidersSettings
              settings={settings}
              providers={providers}
              snapshots={snapshots}
              onUpdate={updateSettings}
            />
          )}
          {tab === 'about' && <AboutPane />}
        </div>
      </div>
    </div>
  )
}

function AboutPane() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold tracking-tight">About CodexBar</h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI Provider Usage Monitor for Windows
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Version</p>
            <p className="font-bold mt-0.5 tabular-nums text-foreground">1.0.0</p>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Platform</p>
            <p className="font-bold mt-0.5 text-foreground">Windows (Electron)</p>
          </div>
        </div>

        <div className="border-t border-border/30 pt-4 space-y-2.5 text-sm">
          <p>
            <span className="text-muted-foreground">Original project: </span>
            <a href="https://github.com/steipete/CodexBar" className="text-primary hover:underline font-medium" target="_blank" rel="noreferrer">
              CodexBar by Peter Steinberger
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Windows port: </span>
            <a href="https://github.com/hafizhabdul/codexbar_windows" className="text-primary hover:underline font-medium" target="_blank" rel="noreferrer">
              codexbar_windows
            </a>
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">Licensed under MIT</p>
    </div>
  )
}
