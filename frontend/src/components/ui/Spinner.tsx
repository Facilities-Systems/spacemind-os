import { clsx } from 'clsx'

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <svg
      className={clsx('animate-spin text-brand-400', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function LoadingOverlay({ message = 'SpaceMind is thinking...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-surface-border" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-brand-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-brand-300 font-medium">{message}</p>
        <p className="text-gray-500 text-sm mt-1">Applying 30 years of FM expertise...</p>
      </div>
    </div>
  )
}
