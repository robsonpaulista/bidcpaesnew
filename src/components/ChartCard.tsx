import { ReactNode } from 'react'
import { LucideIcon, MoreHorizontal } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  noPadding?: boolean
}

const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary-500',
  children,
  actions,
  className = '',
  noPadding = false
}: ChartCardProps) => {
  return (
    <div className={`
      bg-white rounded-2xl border border-slate-200/60 shadow-card
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-slate-50">
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          )}
          <div>
            <h3 className="font-display font-semibold text-dark-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-secondary-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-secondary-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  )
}

export default ChartCard








