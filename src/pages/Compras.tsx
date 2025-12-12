import {
  ShoppingCart,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle,
  Package,
  Users,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import {
  comprasKPIs,
  custoMateriasPrimas,
  performanceFornecedores,
  evolucaoPrecos,
  formatCurrency
} from '../services/mockData'

const Compras = () => {
  const kpiIcons = [
    ShoppingCart,
    Clock,
    CheckCircle,
    Clock,
    Package,
    AlertCircle
  ]

  const kpiColors = [
    'text-emerald-500',
    'text-blue-500',
    'text-teal-500',
    'text-purple-500',
    'text-amber-500',
    'text-rose-500'
  ]

  const materiasColumns = [
    {
      key: 'name',
      label: 'Matéria-Prima',
      render: (value: unknown) => (
        <span className="font-medium text-dark-900">{String(value)}</span>
      )
    },
    {
      key: 'value',
      label: 'Preço',
      align: 'right' as const,
      render: (value: unknown, row: Record<string, unknown>) => (
        <span className="font-semibold text-dark-900 tabular-nums">
          {formatCurrency(Number(value))}/{String(row.unidade)}
        </span>
      )
    },
    {
      key: 'variacao',
      label: 'Variação',
      align: 'right' as const,
      render: (value: unknown) => {
        const numValue = Number(value)
        return (
          <Badge variant={numValue > 0 ? 'danger' : numValue < 0 ? 'success' : 'neutral'}>
            {numValue > 0 ? '+' : ''}{numValue}%
          </Badge>
        )
      }
    }
  ]

  const fornecedoresColumns = [
    {
      key: 'name',
      label: 'Fornecedor',
      render: (value: unknown) => (
        <span className="font-medium text-dark-900">{String(value)}</span>
      )
    },
    {
      key: 'otd',
      label: 'OTD',
      align: 'center' as const,
      render: (value: unknown) => (
        <Badge variant={Number(value) >= 95 ? 'success' : Number(value) >= 90 ? 'warning' : 'danger'}>
          {Number(value)}%
        </Badge>
      )
    },
    {
      key: 'fillRate',
      label: 'Fill Rate',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}%</span>
      )
    },
    {
      key: 'qualidade',
      label: 'Qualidade',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}%</span>
      )
    },
    {
      key: 'dependencia',
      label: 'Dependência',
      align: 'center' as const,
      render: (value: unknown) => {
        const numValue = Number(value)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  numValue > 30 ? 'bg-rose-500' : numValue > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${numValue}%` }}
              />
            </div>
            <span className="text-xs tabular-nums">{numValue}%</span>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Compras"
        subtitle="Gestão de matéria-prima e fornecedores"
        icon={ShoppingCart}
        iconColor="from-yellow-500 to-amber-600"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {comprasKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Evolução de Preços */}
        <ChartCard
          title="Evolução de Preços"
          subtitle="Principais matérias-primas (R$/kg)"
          icon={TrendingDown}
          iconColor="text-blue-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoPrecos}>
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
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="farinha"
                  stroke="#ed751c"
                  strokeWidth={2}
                  dot={false}
                  name="Farinha"
                />
                <Line
                  type="monotone"
                  dataKey="margarina"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="Margarina"
                />
                <Line
                  type="monotone"
                  dataKey="fermento"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Fermento"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Performance Fornecedores - Barras Horizontais */}
        <ChartCard
          title="Performance Fornecedores"
          subtitle="Comparativo por indicador (OTD = entrega no prazo)"
          icon={Users}
          iconColor="text-purple-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={performanceFornecedores} 
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[80, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="otd" fill="#ed751c" radius={[0, 4, 4, 0]} name="OTD (entrega)" barSize={8} />
                <Bar dataKey="fillRate" fill="#22c55e" radius={[0, 4, 4, 0]} name="Fill Rate (completude)" barSize={8} />
                <Bar dataKey="qualidade" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Qualidade" barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Custo Matérias-Primas */}
        <ChartCard
          title="Custo por Matéria-Prima"
          subtitle="Preços atualizados"
          icon={BarChart3}
          iconColor="text-emerald-500"
          noPadding
        >
          <DataTable
            columns={materiasColumns}
            data={custoMateriasPrimas as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>

        {/* Fornecedores */}
        <ChartCard
          title="Performance de Fornecedores"
          subtitle="Indicadores de qualidade"
          icon={Users}
          iconColor="text-blue-500"
          noPadding
        >
          <DataTable
            columns={fornecedoresColumns}
            data={performanceFornecedores as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>
      </div>

      {/* Savings Highlight */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Economia gerada este mês</p>
            <p className="text-4xl font-display font-bold mt-1">R$ 28.560</p>
            <p className="text-emerald-100 mt-2">
              Resultado de negociações e otimização de pedidos
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-emerald-100 text-xs">Negociação</p>
              <p className="text-2xl font-bold">R$ 18.200</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-emerald-100 text-xs">Consolidação</p>
              <p className="text-2xl font-bold">R$ 10.360</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Compras

