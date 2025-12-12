import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatCurrency, formatNumber } from '../services/mockData'

interface KPICardProps {
  label: string
  value: number | string
  unit?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  iconColor?: string
  variant?: 'default' | 'highlight' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  description?: string
}

const KPICard = ({
  label,
  value,
  unit = '',
  change,
  changeLabel = 'vs período anterior',
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-primary-500',
  variant = 'default',
  size = 'md',
  description
}: KPICardProps) => {
  const formatValue = (val: number | string, unitType: string): string => {
    if (typeof val === 'string') return val
    if (unitType === 'R$') return formatCurrency(val)
    if (unitType === '%') return `${formatNumber(val, 1)}%`
    if (unitType === 'dias' || unitType === 'h') return `${formatNumber(val, 0)} ${unitType}`
    return formatNumber(val, 0)
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />
    return <Minus className="w-3.5 h-3.5" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-secondary-400'
    // Para métricas onde menor é melhor (perdas, custos, etc)
    const isNegativeBetter = label.toLowerCase().includes('perda') || 
                             label.toLowerCase().includes('custo') ||
                             label.toLowerCase().includes('inadimplência') ||
                             label.toLowerCase().includes('churn') ||
                             label.toLowerCase().includes('devolução') ||
                             label.toLowerCase().includes('avaria')
    
    if (isNegativeBetter) {
      return change < 0 ? 'text-emerald-500' : change > 0 ? 'text-rose-500' : 'text-secondary-400'
    }
    return change > 0 ? 'text-emerald-500' : change < 0 ? 'text-rose-500' : 'text-secondary-400'
  }

  const variantStyles = {
    default: 'bg-white border border-slate-200/60',
    highlight: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white',
    dark: 'bg-gradient-to-br from-dark-900 to-dark-950 text-white'
  }

  const sizeStyles = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  }

  const textColors = {
    label: variant === 'default' ? 'text-secondary-500' : 'text-white/70',
    value: variant === 'default' ? 'text-dark-950' : 'text-white',
    change: variant === 'default' ? getTrendColor() : 'text-white/80'
  }

  return (
    <div className={`
      rounded-2xl shadow-card card-hover
      ${variantStyles[variant]}
      ${sizeStyles[size]}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColors.label} truncate`}>
            {label}
          </p>
          {description && (
            <p className={`text-xs ${variant === 'default' ? 'text-secondary-400' : 'text-white/50'} -mt-0.5`}>
              {description}
            </p>
          )}
          <p className={`text-2xl md:text-3xl font-display font-bold mt-1 ${textColors.value} tabular-nums`}>
            {formatValue(value, unit)}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1.5 mt-2 ${textColors.change}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium tabular-nums">
                {change > 0 ? '+' : ''}{change}{label.toLowerCase().includes('custo') || label.toLowerCase().includes('prazo') ? '' : '%'}
              </span>
              <span className={`text-xs ${variant === 'default' ? 'text-secondary-400' : 'text-white/50'}`}>
                {changeLabel}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`
            p-3 rounded-xl flex-shrink-0
            ${variant === 'default' ? 'bg-slate-50' : 'bg-white/10'}
          `}>
            <Icon className={`w-5 h-5 ${variant === 'default' ? iconColor : 'text-white'}`} />
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard

