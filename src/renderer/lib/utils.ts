import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeUntil(isoDate?: string): string {
  if (!isoDate) return ''
  const target = new Date(isoDate)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) return 'now'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatUsagePercent(used: number, limit?: number): string {
  if (!limit) return `${used}`
  const pct = Math.round((used / limit) * 100)
  return `${pct}%`
}

export function formatUsageLabel(used: number, limit?: number): string {
  if (!limit) return `${used} used`
  const pct = Math.round((used / limit) * 100)
  return `${pct}% used`
}

export function getUsageLevel(used: number, limit?: number): 'safe' | 'moderate' | 'warning' | 'critical' {
  if (!limit) return 'safe'
  const pct = used / limit
  if (pct >= 0.9) return 'critical'
  if (pct >= 0.7) return 'warning'
  if (pct >= 0.4) return 'moderate'
  return 'safe'
}

export function getUsageColor(used: number, limit?: number): string {
  const level = getUsageLevel(used, limit)
  switch (level) {
    case 'critical': return 'text-red-400'
    case 'warning': return 'text-amber-400'
    case 'moderate': return 'text-blue-400'
    case 'safe': return 'text-emerald-400'
  }
}

export function getUsageBarColor(used: number, limit?: number): string {
  const level = getUsageLevel(used, limit)
  switch (level) {
    case 'critical': return 'bg-red-500'
    case 'warning': return 'bg-amber-500'
    case 'moderate': return 'bg-blue-500'
    case 'safe': return 'bg-emerald-500'
  }
}

export function getUsageBarBgColor(used: number, limit?: number): string {
  const level = getUsageLevel(used, limit)
  switch (level) {
    case 'critical': return 'bg-red-500/15'
    case 'warning': return 'bg-amber-500/15'
    case 'moderate': return 'bg-blue-500/15'
    case 'safe': return 'bg-emerald-500/15'
  }
}

/** Map provider id → emoji icon */
export function getProviderIcon(id: string): string {
  const icons: Record<string, string> = {
    claude: '🟠',
    codex: '🟢',
    cursor: '💜',
    gemini: '💎',
    copilot: '🤖',
    openrouter: '🔀',
    amp: '⚡',
    augment: '🧿',
    kiro: '🎯',
    jetbrains: '🧠',
    vertexai: '☁️',
    zai: '✨',
    ollama: '🦙',
    warp: '🚀',
    minimax: '🔲',
    kimi: '🌙',
    kimik2: '🌙',
    kilo: '📊',
    factory: '🏭',
    antigravity: '🌀',
    opencode: '📝',
    synthetic: '🧪',
  }
  return icons[id] ?? '📌'
}
