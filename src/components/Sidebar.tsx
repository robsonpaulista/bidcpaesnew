import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Factory, 
  Package, 
  TrendingUp, 
  Truck, 
  DollarSign,
  X,
  Wheat
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Visão Geral', color: 'text-primary-500' },
  { path: '/compras', icon: ShoppingCart, label: 'Compras', color: 'text-yellow-500' },
  { path: '/producao', icon: Factory, label: 'Produção', color: 'text-orange-500' },
  { path: '/estoque', icon: Package, label: 'Estoque', color: 'text-green-500' },
  { path: '/comercial', icon: TrendingUp, label: 'Comercial', color: 'text-blue-500' },
  { path: '/logistica', icon: Truck, label: 'Logística', color: 'text-purple-500' },
  { path: '/financeiro', icon: DollarSign, label: 'Financeiro', color: 'text-emerald-500' },
]

const Sidebar = ({ isOpen, mobileOpen, onMobileClose }: SidebarProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-screen bg-white border-r border-slate-200/60 
          transition-all duration-300 hidden lg:block shadow-soft
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`h-16 flex items-center border-b border-slate-100 ${isOpen ? 'px-6' : 'px-4 justify-center'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
                <Wheat className="w-5 h-5 text-white" />
              </div>
              {isOpen && (
                <div className="animate-slide-in">
                  <h1 className="font-display font-bold text-lg text-dark-950">DC Pães</h1>
                  <p className="text-[10px] text-secondary-400 -mt-0.5 tracking-wider uppercase">Business Intelligence</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-primary-50 text-primary-600 shadow-sm' 
                        : 'text-secondary-600 hover:bg-slate-50 hover:text-secondary-800'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-500' : item.color}`} />
                        {isOpen && (
                          <span className="font-medium text-sm animate-slide-in">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          {isOpen && (
            <div className="p-4 border-t border-slate-100">
              <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl p-4">
                <p className="text-xs text-secondary-500">Última atualização</p>
                <p className="text-sm font-medium text-secondary-700">Hoje às 08:45</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen w-72 bg-white 
          transition-transform duration-300 lg:hidden shadow-xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-dark-950">DC Pães</h1>
                <p className="text-[10px] text-secondary-400 -mt-0.5 tracking-wider uppercase">Business Intelligence</p>
              </div>
            </div>
            <button 
              onClick={onMobileClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-secondary-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onMobileClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-primary-50 text-primary-600 shadow-sm' 
                        : 'text-secondary-600 hover:bg-slate-50 hover:text-secondary-800'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : item.color}`} />
                        <span className="font-medium">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar







