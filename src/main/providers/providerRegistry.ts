import type { AppSettings } from '../../shared/types'
import type { UsageSnapshot } from '../../shared/types'
import type { SecretsStore } from '../storage/secretsStore'

export interface FetchContext {
  settings: AppSettings
  secrets: SecretsStore
  providerConfig: Record<string, unknown>
}

export interface ProviderAdapter {
  id: string
  displayName: string
  defaultEnabled: boolean
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'>
  fetch(ctx: FetchContext): Promise<UsageSnapshot>
}

// Provider metadata for UI
export const providerRegistry: Array<{
  id: string
  displayName: string
  defaultEnabled: boolean
  strategies: Array<'api' | 'cli' | 'cookie' | 'local'>
}> = [
  { id: 'claude', displayName: 'Claude', defaultEnabled: true, strategies: ['api', 'cli', 'local'] },
  { id: 'codex', displayName: 'Codex (OpenAI)', defaultEnabled: true, strategies: ['api', 'cli', 'local'] },
  { id: 'cursor', displayName: 'Cursor', defaultEnabled: false, strategies: ['cookie'] },
  { id: 'gemini', displayName: 'Gemini', defaultEnabled: false, strategies: ['api', 'cli'] },
  { id: 'copilot', displayName: 'GitHub Copilot', defaultEnabled: false, strategies: ['api'] },
  { id: 'openrouter', displayName: 'OpenRouter', defaultEnabled: false, strategies: ['api'] },
  { id: 'amp', displayName: 'Amp', defaultEnabled: false, strategies: ['cookie'] },
  { id: 'augment', displayName: 'Augment', defaultEnabled: false, strategies: ['cookie'] },
  { id: 'kiro', displayName: 'Kiro', defaultEnabled: false, strategies: ['cli'] },
  { id: 'jetbrains', displayName: 'JetBrains AI', defaultEnabled: false, strategies: ['local'] },
  { id: 'vertexai', displayName: 'Vertex AI', defaultEnabled: false, strategies: ['api'] },
  { id: 'zai', displayName: 'z.ai', defaultEnabled: false, strategies: ['api'] },
  { id: 'ollama', displayName: 'Ollama', defaultEnabled: false, strategies: ['api'] },
  { id: 'warp', displayName: 'Warp', defaultEnabled: false, strategies: ['api'] },
]

// Adapter implementations
import { ClaudeAdapter } from './adapters/claude'
import { CodexAdapter } from './adapters/codex'
import { OpenRouterAdapter } from './adapters/openrouter'
import { CopilotAdapter } from './adapters/copilot'
import { GeminiAdapter } from './adapters/gemini'
import { GenericAdapter } from './adapters/generic'

const adapterMap: Record<string, () => ProviderAdapter> = {
  claude: () => new ClaudeAdapter(),
  codex: () => new CodexAdapter(),
  openrouter: () => new OpenRouterAdapter(),
  copilot: () => new CopilotAdapter(),
  gemini: () => new GeminiAdapter(),
}

export function createAdapter(id: string): ProviderAdapter | null {
  const factory = adapterMap[id]
  if (factory) return factory()

  // Fallback: generic adapter for providers without specific implementation
  const meta = providerRegistry.find(p => p.id === id)
  if (meta) return new GenericAdapter(meta)

  return null
}
