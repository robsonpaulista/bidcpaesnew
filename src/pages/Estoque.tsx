import {
  Package,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Target,
  TrendingDown
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts'
import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import { useDeepLinkFilters, useHighlightKPI } from '../hooks/useDeepLinkFilters'
import {
  estoqueKPIs,
  giroEstoqueCategoria,
  produtosVencimento,
  avariasEstoque,
  formatCurrency
} from '../services/mockData'

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e']
const AVARIA_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#8b5cf6']

const Estoque = () => {
  // Aplica filtros de deep links
  const filters = useDeepLinkFilters()
  const highlightedKpi = useHighlightKPI(filters.focusKpi)
  const kpiIcons = [
    Package,
    RotateCw,
    CheckCircle,
    Calendar,
    AlertTriangle,
    TrendingDown
  ]

  const kpiColors = [
    'text-blue-500',
    'text-primary-500',
    'text-emerald-500',
    'text-purple-500',
    'text-rose-500',
    'text-amber-500'
  ]

  const vencimentoColumns = [
    {
      key: 'name',
      label: 'Prazo',
      render: (value: unknown) => (
        <span className="font-medium text-dark-900">{String(value)}</span>
      )
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value).toLocaleString('pt-BR')} un</span>
      )
    },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold tabular-nums">{formatCurrency(Number(value))}</span>
      )
    },
    {
      key: 'criticidade',
      label: 'Criticidade',
      align: 'center' as const,
      render: (value: unknown) => {
        const criticidade = String(value)
        const variant = criticidade === 'alta' ? 'danger' : criticidade === 'media' ? 'warning' : criticidade === 'baixa' ? 'info' : 'success'
        return <Badge variant={variant}>{criticidade.charAt(0).toUpperCase() + criticidade.slice(1)}</Badge>
      }
    }
  ]

  const giroColumns = [
    {
      key: 'name',
      label: 'Categoria',
      render: (value: unknown) => (
        <span className="font-medium text-dark-900">{String(value)}</span>
      )
    },
    {
      key: 'giro',
      label: 'Giro (dias)',
      align: 'center' as const,
      render: (value: unknown) => (
        <Badge variant={Number(value) <= 10 ? 'success' : Number(value) <= 14 ? 'warning' : 'danger'}>
          {Number(value)} dias
        </Badge>
      )
    },
    {
      key: 'valor',
      label: 'Valor em Estoque',
      align: 'right' as const,
      render: (value: unknown) => (
        <span className="font-semibold tabular-nums">{formatCurrency(Number(value))}</span>
      )
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Estoque"
        subtitle="Giro, cobertura e gestão de inventário"
        icon={Package}
        iconColor="from-green-500 to-emerald-600"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {estoqueKPIs.map((kpi, index) => {
          const isHighlighted = highlightedKpi === kpi.id || highlightedKpi === kpi.id.replace('_', '-')
          return (
            <div
              key={kpi.id}
              id={`kpi-${kpi.id}`}
              className={isHighlighted ? 'transition-all duration-300' : ''}
            >
              <KPICard
                label={kpi.label}
                value={kpi.value}
                unit={kpi.unit}
                change={kpi.change}
                trend={kpi.trend}
                icon={kpiIcons[index]}
                iconColor={kpiColors[index]}
                variant={isHighlighted || index === 0 ? 'highlight' : 'default'}
                description={kpi.description}
              />
            </div>
          )
        })}
      </div>

      {/* Acurácia Destaque */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg text-dark-900 mb-2">
              Acurácia de Estoque
            </h3>
            <p className="text-secondary-500 text-sm mb-4">
              Conformidade entre estoque físico e sistema
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: '98.5%' }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-emerald-600 tabular-nums">98.5%</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-secondary-500">Itens Contados</p>
                <p className="text-lg font-bold text-dark-900">2.847</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600">Conformes</p>
                <p className="text-lg font-bold text-emerald-700">2.804</p>
              </div>
              <div className="text-center p-3 bg-rose-50 rounded-lg">
                <p className="text-xs text-rose-600">Divergentes</p>
                <p className="text-lg font-bold text-rose-700">43</p>
              </div>
            </div>
          </div>
          <div className="lg:w-72 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <Target className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="text-emerald-600 font-medium">Meta de Acurácia</p>
            <p className="text-4xl font-display font-bold text-emerald-700 mt-1">99%</p>
            <p className="text-emerald-500 text-sm mt-2">Faltam 0.5% para atingir</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Giro por Categoria */}
        <ChartCard
          title="Giro e Valor por Categoria"
          subtitle="Dias de cobertura e valor em estoque"
          icon={RotateCw}
          iconColor="text-blue-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={giroEstoqueCategoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  tickFormatter={(value) => `${value}d`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#68788e', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
                <Bar
                  yAxisId="left"
                  dataKey="giro"
                  fill="#ed751c"
                  radius={[4, 4, 0, 0]}
                  name="Giro (dias)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="valor"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', strokeWidth: 2 }}
                  name="Valor (R$)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Avarias */}
        <ChartCard
          title="Avarias por Tipo"
          subtitle="Distribuição das perdas em estoque"
          icon={AlertTriangle}
          iconColor="text-rose-500"
        >
          <div className="h-72 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={avariasEstoque}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {avariasEstoque.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={AVARIA_COLORS[index]} />
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
              {avariasEstoque.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: AVARIA_COLORS[index] }}
                    />
                    <span className="text-sm text-secondary-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-dark-900">{item.value}%</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-slate-100">
                <p className="text-xs text-secondary-500">Causa principal:</p>
                <p className="text-sm font-medium text-dark-900">Manuseio inadequado</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Produtos Vencimento */}
        <ChartCard
          title="Produtos por Vencimento"
          subtitle="Atenção aos prazos de validade"
          icon={Calendar}
          iconColor="text-amber-500"
          noPadding
        >
          <DataTable
            columns={vencimentoColumns}
            data={produtosVencimento as unknown as Record<string, unknown>[]}
            keyField="name"
          />
          <div className="p-4 bg-amber-50 border-t border-amber-100">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                6.860 unidades vencem nos próximos 3 dias
              </span>
            </div>
          </div>
        </ChartCard>

        {/* Giro por Categoria Table */}
        <ChartCard
          title="Giro por Categoria"
          subtitle="Detalhamento do inventário"
          icon={BarChart3}
          iconColor="text-emerald-500"
          noPadding
        >
          <DataTable
            columns={giroColumns}
            data={giroEstoqueCategoria as unknown as Record<string, unknown>[]}
            keyField="name"
          />
          <div className="p-4 bg-emerald-50 border-t border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">Valor Total em Estoque</span>
              <span className="text-lg font-bold text-emerald-800">R$ 485.620</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Inventory Health */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h3 className="font-display font-semibold text-lg mb-4">Saúde do Inventário</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-slate-300 text-xs">SKUs Ativos</p>
            <p className="text-2xl font-bold mt-1">248</p>
            <p className="text-emerald-400 text-xs mt-1">+12 este mês</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-slate-300 text-xs">Sem Movimento (30d)</p>
            <p className="text-2xl font-bold mt-1">15</p>
            <p className="text-amber-400 text-xs mt-1">Analisar obsolescência</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-slate-300 text-xs">Abaixo Mín.</p>
            <p className="text-2xl font-bold mt-1">8</p>
            <p className="text-rose-400 text-xs mt-1">Reabastecer urgente</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-slate-300 text-xs">Acima Máx.</p>
            <p className="text-2xl font-bold mt-1">3</p>
            <p className="text-blue-400 text-xs mt-1">Ajustar compras</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Estoque

