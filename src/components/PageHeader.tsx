import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  actions?: React.ReactNode
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'from-primary-500 to-primary-600',
  actions
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${iconColor} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark-950">
            {title}
          </h1>
          {subtitle && (
            <p className="text-secondary-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader







