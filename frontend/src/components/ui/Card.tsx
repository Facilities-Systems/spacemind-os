import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-card border border-surface-border rounded-xl p-5',
        hover && 'cursor-pointer transition-all hover:border-brand-700/60 hover:bg-surface-muted',
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
