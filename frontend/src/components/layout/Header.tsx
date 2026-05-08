import { Bell, Download, LogOut, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { GlobalSearch } from '../search/GlobalSearch'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { canInstall, install } = useInstallPrompt()
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl+K / Cmd+K opens global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login', { replace: true })
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'FM'

  return (
    <header className="border-b border-surface-border bg-surface-card px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-white font-semibold text-base md:text-lg truncate">{title}</h1>
        {subtitle && <p className="hidden sm:block text-gray-500 text-sm truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Global search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search (Ctrl+K)"
          className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-surface-border bg-surface-card text-gray-400 hover:text-white hover:border-brand-700/60 transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="text-gray-500">Search</span>
          <kbd className="ml-1 rounded border border-[#334155] px-1 py-0.5 text-[10px] font-mono text-gray-600" aria-hidden="true">⌃K</kbd>
        </button>

        {/* Mobile search icon only */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          className="sm:hidden h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>

        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {canInstall && (
          <button
            onClick={install}
            aria-label="Install SpaceMind OS as an app"
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-teal-700/60 bg-teal-900/30 text-teal-300 hover:bg-teal-800/40 hover:text-teal-200 transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Install App
          </button>
        )}
        <button
          aria-label="Notifications"
          className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* User avatar + name */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold text-white select-none">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-medium leading-tight">{user.full_name}</p>
              <p className="text-gray-500 text-xs capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-700/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
