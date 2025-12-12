import {
  Factory,
  Gauge,
  Timer,
  AlertTriangle,
  Wrench,
  Thermometer,
  Scale,
  Activity
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
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import {
  producaoKPIs,
  produtividadeTurno,
  perdasProducao,
  oeeHistorico,
  rendimentoPorLinha,
  formatNumber
} from '../services/mockData'

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e']

const Producao = () => {
  const kpiIcons = [
    Factory,
    Gauge,
    Activity,
    Timer,
    Scale,
    Activity,
    AlertTriangle,
    Wrench
  ]

  const kpiColors = [
    'text-blue-500',
    'text-primary-500',
    'text-emerald-500',
    'text-purple-500',
    'text-teal-500',
    'text-indigo-500',
    'text-rose-500',
    'text-amber-500'
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Produção"
        subtitle="Eficiência, rendimento e qualidade produtiva"
        icon={Factory}
        iconColor="from-orange-500 to-red-500"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {producaoKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            variant={kpi.id === 'oee' ? 'highlight' : 'default'}
            description={kpi.description}
          />
        ))}
      </div>

      {/* OEE Destaque */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="font-display font-semibold text-lg text-dark-900">
                OEE - Overall Equipment Effectiveness
              </h3>
              <p className="text-sm text-secondary-500 mt-1">
                Eficiência Global dos Equipamentos = Disponibilidade × Performance × Qualidade
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-600 font-medium mb-1">Disponibilidade</p>
                <p className="text-2xl font-bold text-blue-700">92.3%</p>
                <p className="text-[10px] text-blue-500 mt-1">Tempo operando vs planejado</p>
                <div className="mt-2">
                  <ProgressBar value={92.3} color="info" size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-xs text-purple-600 font-medium mb-1">Performance</p>
                <p className="text-2xl font-bold text-purple-700">88.7%</p>
                <p className="text-[10px] text-purple-500 mt-1">Velocidade real vs ideal</p>
                <div className="mt-2">
                  <ProgressBar value={88.7} color="primary" size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium mb-1">Qualidade</p>
                <p className="text-2xl font-bold text-emerald-700">95.8%</p>
                <p className="text-[10px] text-emerald-500 mt-1">Produtos bons vs total</p>
                <div className="mt-2">
                  <ProgressBar value={95.8} color="success" size="sm" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-64 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white">
            <p className="text-primary-100 text-sm font-medium">OEE Total</p>
            <p className="text-5xl font-display font-bold mt-2">78.5%</p>
            <p className="text-primary-200 text-sm mt-2">Meta: 85%</p>
            <p className="text-[10px] text-primary-200/70 mt-1">92.3% × 88.7% × 95.8%</p>
            <div className="w-full mt-3">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '92.4%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* OEE Histórico */}
        <ChartCard
          title="Evolução OEE"
          subtitle="Histórico mensal dos componentes"
          icon={Gauge}
          iconColor="text-primary-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={oeeHistorico}>
                <defs>
                  <linearGradient id="colorOEE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ed751c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ed751c" stopOpacity={0} />
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
                  domain={[70, 100]}
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
                  dataKey="oee"
                  stroke="#ed751c"
                  strokeWidth={2.5}
                  fill="url(#colorOEE)"
                  name="OEE"
                />
                <Line
                  type="monotone"
                  dataKey="disponibilidade"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  name="Disponibilidade"
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  dot={false}
                  name="Performance"
                />
                <Line
                  type="monotone"
                  dataKey="qualidade"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                  name="Qualidade"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Perdas de Produção */}
        <ChartCard
          title="Perdas de Produção"
          subtitle="Distribuição por tipo de defeito"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        >
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={perdasProducao}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {perdasProducao.map((_, index) => (
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
              {perdasProducao.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-secondary-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-dark-900">{item.value}%</span>
                    <span className="text-xs text-secondary-400 ml-2">({item.kg} kg)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Produtividade por Turno */}
        <ChartCard
          title="Produtividade por Turno"
          subtitle="Volume produzido vs meta (kg)"
          icon={Timer}
          iconColor="text-purple-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtividadeTurno} layout="vertical">
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
                  formatter={(value: number) => [`${formatNumber(value)} kg`, '']}
                />
                <Legend />
                <Bar dataKey="valor" fill="#ed751c" radius={[0, 6, 6, 0]} name="Realizado" />
                <Bar dataKey="meta" fill="#e5e7eb" radius={[0, 6, 6, 0]} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Rendimento por Linha */}
        <ChartCard
          title="Rendimento por Linha"
          subtitle="Eficiência das linhas de produção"
          icon={Scale}
          iconColor="text-teal-500"
        >
          <div className="space-y-4">
            {rendimentoPorLinha.map((linha) => (
              <div key={linha.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-900">{linha.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={(linha.rendimento ?? 0) >= (linha.meta ?? 0) ? 'success' : 'warning'}
                    >
                      {linha.rendimento ?? 0}%
                    </Badge>
                    <span className="text-xs text-secondary-400">Meta: {linha.meta ?? 0}%</span>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (linha.rendimento ?? 0) >= (linha.meta ?? 0) ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${linha.rendimento ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* MTBF e MTTR */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">MTBF</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">48h</p>
              <p className="text-xs text-blue-500 mt-1">Tempo médio entre falhas</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">MTTR</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">2.5h</p>
              <p className="text-xs text-amber-500 mt-1">Tempo médio de reparo</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Qualidade Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Thermometer className="w-5 h-5" />
            </div>
            <span className="font-medium">Temperatura Forno</span>
          </div>
          <p className="text-3xl font-bold">180-220°C</p>
          <p className="text-blue-200 text-sm mt-2">Conformidade: 98.5%</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium">pH da Massa</span>
          </div>
          <p className="text-3xl font-bold">5.2 - 5.8</p>
          <p className="text-emerald-200 text-sm mt-2">Dentro do padrão</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Scale className="w-5 h-5" />
            </div>
            <span className="font-medium">Umidade</span>
          </div>
          <p className="text-3xl font-bold">38-42%</p>
          <p className="text-purple-200 text-sm mt-2">Conformidade: 97.2%</p>
        </div>
      </div>
    </div>
  )
}

export default Producao

