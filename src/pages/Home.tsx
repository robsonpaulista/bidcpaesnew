import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  Target,
  Users,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import {
  homeKPIs,
  receitaMensal,
  perdasPorArea,
  volumePorCategoria,
  formatCurrency,
  formatNumber
} from '../services/mockData'

const COLORS = ['#ed751c', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6']

const Home = () => {
  const kpiIcons = [
    DollarSign,
    Package,
    TrendingUp,
    AlertTriangle,
    Truck,
    BarChart3,
    Target,
    Users
  ]

  const kpiColors = [
    'text-emerald-500',
    'text-blue-500',
    'text-primary-500',
    'text-rose-500',
    'text-purple-500',
    'text-amber-500',
    'text-teal-500',
    'text-indigo-500'
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Visão Geral"
        subtitle="Acompanhe os principais indicadores da operação"
        icon={LayoutDashboard}
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {homeKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            variant={index === 0 ? 'highlight' : 'default'}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Receita Mensal Chart */}
        <ChartCard
          title="Receita Mensal"
          subtitle="Comparativo com meta"
          icon={BarChart3}
          iconColor="text-emerald-500"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={receitaMensal}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ed751c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ed751c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ fontWeight: 600, marginBottom: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ed751c"
                  strokeWidth={2.5}
                  fill="url(#colorReceita)"
                  name="Receita"
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#colorMeta)"
                  name="Meta"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Perdas por Área */}
        <ChartCard
          title="Perdas por Área"
          subtitle="Distribuição percentual"
          icon={PieChart}
          iconColor="text-rose-500"
        >
          <div className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={perdasPorArea}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {perdasPorArea.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {perdasPorArea.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-xs text-secondary-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Volume por Categoria */}
        <ChartCard
          title="Volume por Categoria"
          subtitle="Produção em kg"
          icon={Activity}
          iconColor="text-blue-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumePorCategoria} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`${formatNumber(value)} kg`, '']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#ed751c" 
                  radius={[0, 6, 6, 0]}
                  name="Volume"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Indicadores Rápidos */}
        <ChartCard
          title="Performance Geral"
          subtitle="Indicadores principais do período"
          icon={Target}
          iconColor="text-teal-500"
        >
          <div className="space-y-4">
            {[
              { label: 'OEE Produção', desc: '(eficiência dos equipamentos)', value: 78.5, target: 85, color: 'primary' as const },
              { label: 'OTIF Logística', desc: '(entregas no prazo e completas)', value: 94.7, target: 95, color: 'success' as const },
              { label: 'Acurácia Estoque', desc: '(precisão do inventário)', value: 98.5, target: 99, color: 'info' as const },
              { label: 'Fill Rate Compras', desc: '(% do pedido atendido)', value: 96.8, target: 98, color: 'warning' as const },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm text-secondary-700 font-medium">{item.label}</span>
                    <span className="text-xs text-secondary-400">{item.desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dark-900 tabular-nums">
                      {item.value}%
                    </span>
                    <span className="text-xs text-secondary-400">
                      / {item.target}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.color === 'primary' ? 'bg-primary-500' :
                      item.color === 'success' ? 'bg-emerald-500' :
                      item.color === 'info' ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(item.value / item.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4">
              <p className="text-xs text-emerald-600 font-medium">Melhor Indicador</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">Acurácia</p>
              <p className="text-xs text-emerald-500 mt-0.5">98.5% do target</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-medium">Atenção</p>
              <p className="text-lg font-bold text-amber-700 mt-1">OEE</p>
              <p className="text-xs text-amber-500 mt-0.5">6.5% abaixo do target</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ciclo MP→Cliente', value: '5 dias', icon: Activity, color: 'bg-blue-500' },
          { label: 'Fornecedores Ativos', value: '24', icon: Users, color: 'bg-purple-500' },
          { label: 'Rotas de Entrega', value: '12', icon: Truck, color: 'bg-teal-500' },
          { label: 'Produtos Ativos', value: '48', icon: Package, color: 'bg-amber-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-card flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl ${stat.color}`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">{stat.label}</p>
              <p className="text-lg font-bold text-dark-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home

