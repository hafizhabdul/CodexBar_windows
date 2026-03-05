import { cn } from '../lib/utils'

interface ProviderLogoProps {
  id: string
  size?: number
  className?: string
}

export function ProviderLogo({ id, size = 24, className }: ProviderLogoProps) {
  const logo = logos[id]
  if (!logo) {
    return (
      <div
        className={cn('rounded-lg flex items-center justify-center font-bold text-white', className)}
        style={{ width: size, height: size, fontSize: size * 0.45, background: '#64748b' }}
      >
        {id.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <div
      className={cn('rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {logo(size)}
    </div>
  )
}

const logos: Record<string, (size: number) => React.ReactNode> = {
  // Anthropic Claude — terracotta "A" mark
  claude: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#D97757" />
      <path d="M14.2 5.8L18.4 18.2H15.5L14.6 15.3H9.4L8.5 18.2H5.6L9.8 5.8H14.2ZM12 8.7L10.2 13.5H13.8L12 8.7Z" fill="white" />
    </svg>
  ),

  // OpenAI Codex — green hexagon mark
  codex: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#10A37F" />
      <path d="M12 4.5C11.1 4.5 10.3 5.0 9.9 5.7L6.1 12.3C5.7 13.0 5.7 13.9 6.1 14.6L7.0 16.2C7.4 16.9 8.2 17.3 9.0 17.3H10.8L12 19.5L13.2 17.3H15.0C15.8 17.3 16.6 16.9 17.0 16.2L17.9 14.6C18.3 13.9 18.3 13.0 17.9 12.3L14.1 5.7C13.7 5.0 12.9 4.5 12 4.5ZM12 8.5C13.4 8.5 14.5 9.6 14.5 11.0C14.5 12.4 13.4 13.5 12 13.5C10.6 13.5 9.5 12.4 9.5 11.0C9.5 9.6 10.6 8.5 12 8.5Z" fill="white" />
    </svg>
  ),

  // Cursor — purple cursor icon
  cursor: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#7C3AED" />
      <path d="M7 5L17 12L12.5 13L15 19L13 20L10.5 14L7 17V5Z" fill="white" />
    </svg>
  ),

  // Google Gemini — blue sparkle
  gemini: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#1A73E8" />
      <path d="M12 3C12 8 8 12 3 12C8 12 12 16 12 21C12 16 16 12 21 12C16 12 12 8 12 3Z" fill="white" />
    </svg>
  ),

  // GitHub Copilot — purple-blue octicon
  copilot: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#6E40C9" />
      <path d="M12 4C8.5 4 5.6 6.3 5 9.5C4.8 10.4 5 11.3 5.5 12L7.8 15.5C8.3 16.3 9.2 16.8 10.1 16.8H10.5V19L12 17L13.5 19V16.8H13.9C14.8 16.8 15.7 16.3 16.2 15.5L18.5 12C19 11.3 19.2 10.4 19 9.5C18.4 6.3 15.5 4 12 4ZM9.5 12.5C8.9 12.5 8.5 12.1 8.5 11.5C8.5 10.9 8.9 10.5 9.5 10.5C10.1 10.5 10.5 10.9 10.5 11.5C10.5 12.1 10.1 12.5 9.5 12.5ZM14.5 12.5C13.9 12.5 13.5 12.1 13.5 11.5C13.5 10.9 13.9 10.5 14.5 10.5C15.1 10.5 15.5 10.9 15.5 11.5C15.5 12.1 15.1 12.5 14.5 12.5Z" fill="white" />
    </svg>
  ),

  // OpenRouter — indigo routing icon
  openrouter: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#6366F1" />
      <circle cx="7" cy="8" r="2" fill="white" />
      <circle cx="7" cy="16" r="2" fill="white" />
      <circle cx="17" cy="12" r="2.5" fill="white" />
      <line x1="9" y1="8" x2="14.5" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="16" x2="14.5" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Amp — yellow lightning bolt
  amp: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#F59E0B" />
      <path d="M13.5 4L7 13H11L10.5 20L17 11H13L13.5 4Z" fill="white" />
    </svg>
  ),

  // Augment — cyan shield/circle
  augment: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#06B6D4" />
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="2" fill="white" />
      <line x1="12" y1="4" x2="12" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="12" x2="7" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Kiro — orange target
  kiro: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FF6A00" />
      <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="1" fill="white" />
    </svg>
  ),

  // JetBrains — pink gradient square
  jetbrains: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#FC368C" />
      <rect x="5" y="5" width="14" height="14" rx="2" fill="#1A1A1A" />
      <text x="7.5" y="15.5" fontSize="8" fontWeight="bold" fill="white" fontFamily="Arial">JB</text>
    </svg>
  ),

  // Vertex AI — Google Cloud blue
  vertexai: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#4285F4" />
      <path d="M12 5L18 17H6L12 5Z" fill="white" fillOpacity="0.9" />
      <path d="M12 10L15 16H9L12 10Z" fill="#4285F4" />
    </svg>
  ),

  // z.ai — purple crystal
  zai: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#8B5CF6" />
      <text x="5.5" y="17" fontSize="14" fontWeight="bold" fill="white" fontFamily="Arial">z</text>
      <circle cx="18" cy="7" r="2" fill="white" fillOpacity="0.7" />
    </svg>
  ),

  // Ollama — white llama silhouette
  ollama: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#1A1A1A" />
      <path d="M8 18V13C8 10.8 9.8 9 12 9C14.2 9 16 10.8 16 13V18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="7" r="1.5" fill="white" />
      <circle cx="14" cy="7" r="1.5" fill="white" />
      <path d="M10 7C10 5.5 10.5 4.5 12 4.5C13.5 4.5 14 5.5 14 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),

  // Warp — blue terminal
  warp: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#01A4FF" />
      <path d="M7 8L11 12L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="16" x2="17" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}
