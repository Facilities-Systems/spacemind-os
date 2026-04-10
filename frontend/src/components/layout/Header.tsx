import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="border-b border-surface-border bg-surface-card px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all">
          <Search className="h-4 w-4" />
        </button>
        <button className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold text-white">
          FM
        </div>
      </div>
    </header>
  )
}
