import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ShoppingBag,
  UserPlus,
  UserMinus,
  BarChart3,
  PieChart,
  MapPin
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Line
} from 'recharts'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import ProgressBar from '../components/ProgressBar'
import {
  comercialKPIs,
  vendaPorRegiao,
  mixProdutos,
  topVendedores,
  clientesFaixaFaturamento,
  receitaMensal,
  formatCurrency
} from '../services/mockData'

const Comercial = () => {
  const kpiIcons = [
    DollarSign,
    ShoppingBag,
    Target,
    TrendingUp,
    Users,
    UserMinus,
    UserPlus,
    Users
  ]

  const kpiColors = [
    'text-emerald-500',
    'text-blue-500',
    'text-primary-500',
    'text-teal-500',
    'text-purple-500',
    'text-rose-500',
    'text-indigo-500',
    'text-amber-500'
  ]

  const vendedoresColumns = [
    {
      key: 'name',
      label: 'Vendedor',
      render: (value: unknown) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-xs font-bold">
            {String(value).split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-medium text-dark-900">{String(value)}</span>
        </div>
      )
    },
    {
      key: 'valor',
      label: 'Faturamento',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold text-dark-900 tabular-nums">{formatCurrency(Number(value))}</span>
      )
    },
    {
      key: 'meta',
      label: 'Meta',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="text-secondary-500 tabular-nums">{formatCurrency(Number(value))}</span>
      )
    },
    {
      key: 'atingimento',
      label: 'Atingimento',
      align: 'center' as const,
      render: (value: unknown) => (
        <Badge variant={Number(value) >= 100 ? 'success' : Number(value) >= 95 ? 'warning' : 'danger'}>
          {Number(value)}%
        </Badge>
      )
    }
  ]

  const clientesFaixaColumns = [
    {
      key: 'name',
      label: 'Faixa de Faturamento',
      render: (value: unknown) => (
        <span className="font-medium text-dark-900">{String(value)}</span>
      )
    },
    {
      key: 'quantidade',
      label: 'Clientes',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value).toLocaleString('pt-BR')}</span>
      )
    },
    {
      key: 'percent',
      label: '% Base',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}%</span>
      )
    },
    {
      key: 'valor',
      label: 'Faturamento',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold tabular-nums">{formatCurrency(Number(value))}</span>
      )
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Comercial"
        subtitle="Vendas, clientes e performance comercial"
        icon={TrendingUp}
        iconColor="from-blue-500 to-indigo-600"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {comercialKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            variant={kpi.id === 'faturamento' ? 'highlight' : 'default'}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Faturamento Mensal */}
        <ChartCard
          title="Faturamento Mensal"
          subtitle="Evolução anual"
          icon={BarChart3}
          iconColor="text-emerald-500"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={receitaMensal}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorFaturamento)"
                  name="Faturamento"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Vendas por Região */}
        <ChartCard
          title="Vendas por Região"
          subtitle="Faturamento e número de clientes"
          icon={MapPin}
          iconColor="text-purple-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={vendaPorRegiao} 
                layout="vertical"
                margin={{ left: 0, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'valor' ? formatCurrency(value) : `${value} clientes`,
                    name === 'valor' ? 'Faturamento' : 'Clientes'
                  ]}
                />
                <Legend />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Faturamento (R$)" barSize={12} />
                <Bar dataKey="clientes" fill="#22c55e" radius={[0, 4, 4, 0]} name="Clientes" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Mix de Produtos */}
        <ChartCard
          title="Mix de Produtos"
          subtitle="Atual vs Ideal e Margem"
          icon={PieChart}
          iconColor="text-primary-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mixProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  domain={[0, 50]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="atual" fill="#3b82f6" radius={[0, 4, 4, 0]} name="% Atual" barSize={12} />
                <Bar dataKey="ideal" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="% Ideal" barSize={12} />
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  name="Margem %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Vendedores */}
        <ChartCard
          title="Ranking de Vendedores"
          subtitle="Top performers do mês"
          icon={Users}
          iconColor="text-indigo-500"
          noPadding
        >
          <DataTable
            columns={vendedoresColumns}
            data={topVendedores as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>
      </div>

      {/* Clientes por Faixa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <ChartCard
          title="Clientes por Faixa de Faturamento"
          subtitle="Segmentação da base"
          icon={Target}
          iconColor="text-amber-500"
          noPadding
        >
          <DataTable
            columns={clientesFaixaColumns}
            data={clientesFaixaFaturamento as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>

        {/* Funil de Clientes */}
        <ChartCard
          title="Funil de Clientes"
          subtitle="Evolução da base ativa"
          icon={Users}
          iconColor="text-teal-500"
        >
          <div className="space-y-4">
            {[
              { label: 'Base Total Cadastrada', value: 1520, percent: 100, color: 'bg-slate-500' },
              { label: 'Clientes Ativos (30d)', value: 1247, percent: 82, color: 'bg-blue-500' },
              { label: 'Compraram esta Semana', value: 892, percent: 58.7, color: 'bg-emerald-500' },
              { label: 'Ticket acima da Média', value: 412, percent: 27.1, color: 'bg-primary-500' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dark-900 tabular-nums">
                      {item.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-secondary-400">
                      ({item.percent}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Novos</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700">78</p>
              <p className="text-xs text-emerald-500">+12 vs mês anterior</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserMinus className="w-4 h-4 text-rose-500" />
                <span className="text-xs text-rose-600 font-medium">Inativos</span>
              </div>
              <p className="text-2xl font-bold text-rose-700">35</p>
              <p className="text-xs text-rose-500">Churn: 2.8%</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Performance Highlight */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 font-medium">Meta Mensal de Faturamento</p>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-4xl font-display font-bold">R$ 2.900.000</p>
              <Badge variant="success" size="sm">
                98.2% atingido
              </Badge>
            </div>
            <div className="mt-4 max-w-md">
              <ProgressBar value={98.2} color="success" size="lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-blue-200 text-xs">Faltam</p>
              <p className="text-2xl font-bold">R$ 52.500</p>
              <p className="text-blue-200 text-xs mt-1">para bater a meta</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-blue-200 text-xs">Dias Restantes</p>
              <p className="text-2xl font-bold">20</p>
              <p className="text-blue-200 text-xs mt-1">até fim do mês</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Comercial

