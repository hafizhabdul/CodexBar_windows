// Brand colors for provider accent theming
// Separated from ProviderLogo.tsx to avoid Vite HMR invalidation
// (React Fast Refresh requires component-only exports per file)

export const providerColors: Record<string, { bg: string; text: string; accent: string; gradient: string }> = {
  claude: { bg: '#D9775720', text: 'text-[#D97757]', accent: '#D97757', gradient: 'from-[#D97757]/30 to-[#D97757]/5' },
  codex: { bg: '#10A37F20', text: 'text-[#10A37F]', accent: '#10A37F', gradient: 'from-[#10A37F]/30 to-[#10A37F]/5' },
  cursor: { bg: '#7C3AED20', text: 'text-[#7C3AED]', accent: '#7C3AED', gradient: 'from-[#7C3AED]/30 to-[#7C3AED]/5' },
  gemini: { bg: '#4285F420', text: 'text-[#4285F4]', accent: '#4285F4', gradient: 'from-[#4285F4]/30 to-[#4285F4]/5' },
  copilot: { bg: '#6E40C920', text: 'text-[#6E40C9]', accent: '#6E40C9', gradient: 'from-[#6E40C9]/30 to-[#6E40C9]/5' },
  openrouter: { bg: '#6366F120', text: 'text-[#6366F1]', accent: '#6366F1', gradient: 'from-[#6366F1]/30 to-[#6366F1]/5' },
  amp: { bg: '#F59E0B20', text: 'text-[#F59E0B]', accent: '#F59E0B', gradient: 'from-[#F59E0B]/30 to-[#F59E0B]/5' },
  augment: { bg: '#06B6D420', text: 'text-[#06B6D4]', accent: '#06B6D4', gradient: 'from-[#06B6D4]/30 to-[#06B6D4]/5' },
  kiro: { bg: '#FF6A0020', text: 'text-[#FF6A00]', accent: '#FF6A00', gradient: 'from-[#FF6A00]/30 to-[#FF6A00]/5' },
  jetbrains: { bg: '#FC368C20', text: 'text-[#FC368C]', accent: '#FC368C', gradient: 'from-[#FC368C]/30 to-[#FC368C]/5' },
  vertexai: { bg: '#4285F420', text: 'text-[#4285F4]', accent: '#4285F4', gradient: 'from-[#4285F4]/30 to-[#4285F4]/5' },
  zai: { bg: '#8B5CF620', text: 'text-[#8B5CF6]', accent: '#8B5CF6', gradient: 'from-[#8B5CF6]/30 to-[#8B5CF6]/5' },
  ollama: { bg: '#E5E5E520', text: 'text-[#E5E5E5]', accent: '#E5E5E5', gradient: 'from-[#E5E5E5]/30 to-[#E5E5E5]/5' },
  warp: { bg: '#01A4FF20', text: 'text-[#01A4FF]', accent: '#01A4FF', gradient: 'from-[#01A4FF]/30 to-[#01A4FF]/5' },
}
