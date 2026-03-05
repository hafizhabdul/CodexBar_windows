import { Switch } from '../../components/ui/switch'
import { Select } from '../../components/ui/select'
import type { AppSettings } from '../../../shared/types'

interface GeneralSettingsProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => void
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  const refreshOptions = [
    { value: '0', label: 'Manual only' },
    { value: '60', label: 'Every 1 minute' },
    { value: '120', label: 'Every 2 minutes' },
    { value: '300', label: 'Every 5 minutes' },
    { value: '900', label: 'Every 15 minutes' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">General</h3>
        <p className="text-sm text-muted-foreground mt-1">App behavior and appearance</p>
      </div>

      <div className="rounded-xl border bg-card divide-y divide-border/50">
        {/* Refresh interval */}
        <SettingsRow
          icon="🔄"
          title="Refresh Interval"
          description="How often to check provider usage"
        >
          <Select
            value={String(settings.refreshInterval)}
            onChange={(v) => onUpdate({ refreshInterval: parseInt(v, 10) })}
            options={refreshOptions}
            className="w-44"
          />
        </SettingsRow>

        {/* Launch at login */}
        <SettingsRow
          icon="🚀"
          title="Launch at Login"
          description="Start CodexBar when Windows starts"
        >
          <Switch
            checked={settings.launchAtLogin}
            onChange={(v) => onUpdate({ launchAtLogin: v })}
          />
        </SettingsRow>

        {/* Merge icons */}
        <SettingsRow
          icon="🔗"
          title="Merge Icons"
          description="Combine all providers into one tray icon"
        >
          <Switch
            checked={settings.mergeIcons}
            onChange={(v) => onUpdate({ mergeIcons: v })}
          />
        </SettingsRow>

        {/* Theme */}
        <SettingsRow
          icon="🎨"
          title="Theme"
          description="Appearance of the popover and settings"
        >
          <Select
            value={settings.theme}
            onChange={(v) => onUpdate({ theme: v as AppSettings['theme'] })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            className="w-32"
          />
        </SettingsRow>
      </div>
    </div>
  )
}

function SettingsRow({ icon, title, description, children }: {
  icon: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
