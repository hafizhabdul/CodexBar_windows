export type UsageProvider =
  | 'codex'
  | 'claude'
  | 'cursor'
  | 'gemini'
  | 'copilot'
  | 'openrouter'
  | 'amp'
  | 'augment'
  | 'kiro'
  | 'jetbrains'
  | 'vertexai'
  | 'zai'
  | 'ollama'
  | 'warp'
  | 'minimax'
  | 'kimi'
  | 'kimik2'
  | 'kilo'
  | 'factory'
  | 'antigravity'
  | 'opencode'
  | 'synthetic'

export interface UsageWindow {
  used: number
  limit?: number
  resetAt?: string
}

export interface UsageCredits {
  used?: number
  remaining?: number
  currency?: string
}

export interface UsageStatus {
  level: 'ok' | 'degraded' | 'down'
  message?: string
  incidentUrl?: string
}

export interface UsageError {
  kind: 'auth' | 'network' | 'parse' | 'unsupported'
  message: string
}

export interface UsageSnapshot {
  provider: string
  fetchedAt: string
  stale: boolean
  session?: UsageWindow
  weekly?: UsageWindow
  credits?: UsageCredits
  status?: UsageStatus
  error?: UsageError
}

export interface ProviderConfig {
  apiKey?: string
  cookieSource?: string
  customEndpoint?: string
  [key: string]: unknown
}

export interface AppSettings {
  refreshInterval: number
  enabledProviders: string[]
  mergeIcons: boolean
  launchAtLogin: boolean
  theme: 'light' | 'dark' | 'system'
  providerConfigs: Record<string, ProviderConfig>
}

export interface ProviderInfo {
  id: string
  displayName: string
  defaultEnabled: boolean
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'>
}

// Window API exposed via preload
export interface CodexBarAPI {
  getSettings(): Promise<AppSettings>
  setSettings(settings: Partial<AppSettings>): Promise<void>
  getSnapshots(): Promise<UsageSnapshot[]>
  refreshProvider(id: string): Promise<UsageSnapshot>
  refreshAll(): Promise<UsageSnapshot[]>
  getSecret(key: string): Promise<string | null>
  setSecret(key: string, value: string): Promise<void>
  deleteSecret(key: string): Promise<void>
  openSettings(): Promise<void>
  getProviderList(): Promise<ProviderInfo[]>
  onSnapshotsUpdated(callback: (snapshots: UsageSnapshot[]) => void): () => void
}

declare global {
  interface Window {
    codexbar: CodexBarAPI
  }
}
