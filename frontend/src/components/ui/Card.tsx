import { clsx } from 'clsx'
import type { KeyboardEvent } from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  'aria-label'?: string
}

export function Card({ children, className, hover, onClick, 'aria-label': ariaLabel }: CardProps) {
  const interactive = !!onClick

  const handleKeyDown = interactive
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick!()
        }
      }
    : undefined

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      className={clsx(
        'bg-surface-card border border-surface-border rounded-xl p-5',
        hover && 'cursor-pointer transition-all hover:border-brand-700/60 hover:bg-surface-muted',
        interactive && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e293b]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mb-4 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={clsx('font-semibold text-white text-sm', className)}>{children}</h3>
}
