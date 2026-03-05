import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-muted text-muted-foreground',
    destructive: 'bg-red-500/15 text-red-400 border border-red-500/30',
    outline: 'border border-border bg-transparent text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold leading-none',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
