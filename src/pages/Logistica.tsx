import {
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Fuel,
  Route,
  Package,
  RotateCcw,
  TrendingUp,
  Users
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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import {
  logisticaKPIs,
  otifHistorico,
  custoLogisticoPorRota,
  motivosDevolucao,
  performanceVeiculos,
  formatCurrency
} from '../services/mockData'

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#8b5cf6', '#22c55e']

const Logistica = () => {
  const kpiIcons = [
    CheckCircle,
    Clock,
    Package,
    Truck,
    Route,
    AlertTriangle,
    RotateCcw,
    RotateCcw
  ]

  const kpiColors = [
    'text-emerald-500',
    'text-blue-500',
    'text-teal-500',
    'text-purple-500',
    'text-indigo-500',
    'text-rose-500',
    'text-amber-500',
    'text-orange-500'
  ]

  const rotasColumns = [
    {
      key: 'name',
      label: 'Rota',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-dark-900">{String(value)}</span>
        </div>
      )
    },
    {
      key: 'entregas',
      label: 'Entregas',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}</span>
      )
    },
    {
      key: 'km',
      label: 'Km',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)} km</span>
      )
    },
    {
      key: 'custo',
      label: 'Custo Total',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold tabular-nums">{formatCurrency(Number(value))}</span>
      )
    },
    {
      key: 'custoEntrega',
      label: 'R$/Entrega',
      align: 'right' as const,
      render: (value: unknown) => {
        const custoVal = Number(value)
        return (
          <Badge variant={custoVal <= 18.5 ? 'success' : custoVal <= 19.5 ? 'warning' : 'danger'}>
            R$ {custoVal.toFixed(2)}
          </Badge>
        )
      }
    }
  ]

  const veiculosColumns = [
    {
      key: 'name',
      label: 'Veículo',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-dark-900">{String(value)}</span>
        </div>
      )
    },
    {
      key: 'entregas',
      label: 'Entregas',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}</span>
      )
    },
    {
      key: 'capacidade',
      label: 'Ocupação',
      align: 'center' as const,
      render: (value: unknown) => {
        const cap = Number(value)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  cap >= 90 ? 'bg-emerald-500' : cap >= 85 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${cap}%` }}
              />
            </div>
            <span className="text-xs tabular-nums">{cap}%</span>
          </div>
        )
      }
    },
    {
      key: 'km',
      label: 'Km Rodados',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value).toLocaleString('pt-BR')} km</span>
      )
    },
    {
      key: 'custo',
      label: 'Custo',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold tabular-nums">{formatCurrency(Number(value))}</span>
      )
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Logística"
        subtitle="Entregas, rotas e distribuição"
        icon={Truck}
        iconColor="from-purple-500 to-violet-600"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {logisticaKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            variant={kpi.id === 'otif' ? 'highlight' : 'default'}
          />
        ))}
      </div>

      {/* OTIF Destaque */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg text-dark-900 mb-4">
              OTIF - On Time In Full
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">On Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">96.2%</p>
                <p className="text-xs text-blue-500 mt-1">Entregas no prazo</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">In Full</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">98.3%</p>
                <p className="text-xs text-emerald-500 mt-1">Pedidos completos</p>
              </div>
            </div>
          </div>
          <div className="lg:w-64 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl text-white">
            <p className="text-purple-200 text-sm font-medium">OTIF Combinado</p>
            <p className="text-5xl font-display font-bold mt-2">94.7%</p>
            <p className="text-purple-200 text-sm mt-2">Meta: 95%</p>
            <div className="w-full mt-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '99.7%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* OTIF Histórico */}
        <ChartCard
          title="Evolução OTIF"
          subtitle="Histórico mensal"
          icon={TrendingUp}
          iconColor="text-emerald-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={otifHistorico}>
                <defs>
                  <linearGradient id="colorOTIF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                  domain={[88, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="otif"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#colorOTIF)"
                  name="OTIF"
                />
                <Line
                  type="monotone"
                  dataKey="prazo"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  name="No Prazo"
                />
                <Line
                  type="monotone"
                  dataKey="completo"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                  name="Completo"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Motivos de Devolução */}
        <ChartCard
          title="Motivos de Devolução"
          subtitle="Análise de ocorrências"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        >
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={motivosDevolucao}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {motivosDevolucao.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {motivosDevolucao.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-secondary-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-dark-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Custo por Rota */}
        <ChartCard
          title="Custo por Rota"
          subtitle="Análise de eficiência"
          icon={Route}
          iconColor="text-indigo-500"
          noPadding
        >
          <DataTable
            columns={rotasColumns}
            data={custoLogisticoPorRota as unknown as Record<string, unknown>[]}
            keyField="name"
          />
          <div className="p-4 bg-indigo-50 border-t border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-700">Custo Médio por Entrega</span>
              <span className="text-lg font-bold text-indigo-800">R$ 19.22</span>
            </div>
          </div>
        </ChartCard>

        {/* Performance de Veículos */}
        <ChartCard
          title="Performance de Veículos"
          subtitle="Indicadores da frota"
          icon={Truck}
          iconColor="text-blue-500"
          noPadding
        >
          <DataTable
            columns={veiculosColumns}
            data={performanceVeiculos as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>
      </div>

      {/* Custo Logístico Breakdown */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h3 className="font-display font-semibold text-lg mb-6">Composição do Custo Logístico</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-xs">Combustível</span>
            </div>
            <p className="text-2xl font-bold">42%</p>
            <p className="text-slate-400 text-xs mt-1">R$ 119.868</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-xs">Manutenção</span>
            </div>
            <p className="text-2xl font-bold">18%</p>
            <p className="text-slate-400 text-xs mt-1">R$ 51.372</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-xs">Mão de Obra</span>
            </div>
            <p className="text-2xl font-bold">28%</p>
            <p className="text-slate-400 text-xs mt-1">R$ 79.912</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-slate-300 text-xs">Avarias</span>
            </div>
            <p className="text-2xl font-bold">5%</p>
            <p className="text-slate-400 text-xs mt-1">R$ 14.270</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 text-xs">Outros</span>
            </div>
            <p className="text-2xl font-bold">7%</p>
            <p className="text-slate-400 text-xs mt-1">R$ 19.978</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-slate-300">Custo Logístico Total</span>
          <div className="text-right">
            <p className="text-3xl font-bold">R$ 285.400</p>
            <p className="text-sm text-emerald-400">10.0% do faturamento</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Logistica

