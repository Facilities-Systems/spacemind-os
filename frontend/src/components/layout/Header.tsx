import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/login', { replace: true })
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'FM'

  return (
    <header className="border-b border-surface-border bg-surface-card px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-700/60 transition-all">
          <Bell className="h-4 w-4" />
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
          title="Sign out"
          className="h-9 w-9 rounded-lg border border-surface-border flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-700/40 transition-all"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
