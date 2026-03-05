import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  barStyle?: React.CSSProperties
  bgClassName?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, barClassName, barStyle, bgClassName, showLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('relative w-full', className)}>
      <div className={cn('h-2 w-full overflow-hidden rounded-full', bgClassName || 'bg-secondary')}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barClassName || 'bg-primary',
          )}
          style={{ width: `${pct}%`, ...barStyle }}
        />
      </div>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
