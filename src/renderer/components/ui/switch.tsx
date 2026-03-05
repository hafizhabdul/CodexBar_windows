import { cn } from '../../lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onChange, disabled, className }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        )}
      />
    </button>
  )
}
