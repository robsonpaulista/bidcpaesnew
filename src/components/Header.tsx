import { Menu, Search, User, Calendar } from 'lucide-react'
import { lazy, Suspense } from 'react'

// Lazy load para evitar quebrar se houver erro
const EventsFeed = lazy(() => import('./EventsFeed').catch(() => ({ default: () => <div /> })))

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-secondary-600" />
          </button>

          {/* Search - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 w-80 border border-transparent focus-within:border-primary-200 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm text-secondary-700 placeholder:text-secondary-400 w-full"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Date - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2 text-secondary-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm capitalize">{today}</span>
          </div>

          {/* Feed de Eventos (Atividades dos Agentes) */}
          <Suspense fallback={null}>
            <EventsFeed />
          </Suspense>

          {/* User */}
          <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-secondary-800">Administrador</p>
              <p className="text-xs text-secondary-400">admin@dcpaes.com</p>
            </div>
            <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header








