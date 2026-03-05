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
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="text-sm">Loading settings…</span>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'providers', label: 'Providers', icon: '🔌' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ]

  return (
    <div className="flex h-screen bg-background dark">
      {/* ── Sidebar ── */}
      <div className="w-52 border-r border-border/60 bg-card/50 flex flex-col">
        <div className="px-4 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎚️</span>
            <h2 className="text-sm font-bold tracking-tight">CodexBar</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Settings</p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-all',
                tab === t.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground text-center">v1.0.0</p>
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
        <h3 className="text-xl font-bold">CodexBar for Windows</h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI Provider Usage Monitor — May your tokens never run out ✨
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Version</p>
            <p className="font-semibold mt-0.5">1.0.0</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Platform</p>
            <p className="font-semibold mt-0.5">Windows (Electron)</p>
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-2.5 text-sm">
          <p>
            <span className="text-muted-foreground">Original: </span>
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

      <p className="text-xs text-muted-foreground">Licensed under MIT</p>
    </div>
  )
}
