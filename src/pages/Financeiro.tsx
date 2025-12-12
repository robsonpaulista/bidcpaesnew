import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PiggyBank,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import {
  financeiroKPIs,
  fluxoCaixa,
  despesasPorCentroCusto,
  dreResumo,
  contasReceberVencer,
  formatCurrency
} from '../services/mockData'

const Financeiro = () => {
  const kpiIcons = [
    DollarSign,
    TrendingUp,
    Target,
    PiggyBank,
    CreditCard,
    Calendar,
    Calendar,
    ArrowDownCircle
  ]

  const kpiColors = [
    'text-emerald-500',
    'text-blue-500',
    'text-teal-500',
    'text-purple-500',
    'text-rose-500',
    'text-amber-500',
    'text-indigo-500',
    'text-orange-500'
  ]

  const dreColumns = [
    {
      key: 'name',
      label: 'Descrição',
      render: (value: unknown, row: Record<string, unknown>) => {
        const isSubtotal = String(value).includes('Líquida') || String(value).includes('Bruto') || String(value).includes('EBITDA') || String(value).includes('Operacional')
        return (
          <span className={`${isSubtotal ? 'font-semibold text-dark-900' : 'text-secondary-700'} ${String(value).startsWith('(-)') ? 'pl-4' : ''}`}>
            {String(value)}
          </span>
        )
      }
    },
    {
      key: 'valor',
      label: 'Valor',
      align: 'right' as const,
      render: (value: unknown) => {
        const numValue = Number(value)
        return (
          <span className={`font-semibold tabular-nums ${numValue < 0 ? 'text-rose-600' : 'text-dark-900'}`}>
            {formatCurrency(Math.abs(numValue))}
          </span>
        )
      }
    },
    {
      key: 'percent',
      label: 'AV%',
      align: 'right' as const,
      render: (value: unknown) => {
        const numValue = Number(value)
        return (
          <span className={`tabular-nums ${numValue < 0 ? 'text-rose-500' : 'text-secondary-500'}`}>
            {numValue > 0 ? '' : ''}{numValue.toFixed(1)}%
          </span>
        )
      }
    }
  ]

  const contasColumns = [
    {
      key: 'name',
      label: 'Situação',
      render: (value: unknown) => {
        const strValue = String(value)
        const isVencido = strValue.includes('Vencido')
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isVencido ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className={`font-medium ${isVencido ? 'text-rose-700' : 'text-dark-900'}`}>
              {strValue}
            </span>
          </div>
        )
      }
    },
    {
      key: 'clientes',
      label: 'Clientes',
      align: 'center' as const,
      render: (value: unknown) => (
        <span className="tabular-nums">{Number(value)}</span>
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
      key: 'percent',
      label: '%',
      align: 'right' as const,
      render: (value: unknown) => (
        <Badge variant={Number(value) > 10 ? 'danger' : Number(value) > 5 ? 'warning' : 'success'}>
          {Number(value)}%
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Financeiro"
        subtitle="Resultados, fluxo de caixa e análise financeira"
        icon={DollarSign}
        iconColor="from-emerald-500 to-teal-600"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financeiroKPIs.map((kpi, index) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpiIcons[index]}
            iconColor={kpiColors[index]}
            variant={kpi.id === 'receita_liquida' ? 'highlight' : 'default'}
          />
        ))}
      </div>

      {/* Resultado Destaque */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium mb-1">Receita Bruta</p>
              <p className="text-2xl font-bold text-blue-700">R$ 2.85M</p>
              <p className="text-xs text-blue-500 mt-1">+12.5% vs mês ant.</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-600 font-medium mb-1">Lucro Bruto</p>
              <p className="text-2xl font-bold text-emerald-700">R$ 832k</p>
              <p className="text-xs text-emerald-500 mt-1">Margem: 32.4%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-600 font-medium mb-1">Lucro Líquido</p>
              <p className="text-2xl font-bold text-purple-700">R$ 328k</p>
              <p className="text-xs text-purple-500 mt-1">Margem: 12.8%</p>
            </div>
          </div>
          <div className="lg:w-72 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white">
            <p className="text-emerald-100 text-sm font-medium">EBITDA</p>
            <p className="text-4xl font-display font-bold mt-2">R$ 398.250</p>
            <p className="text-emerald-200 text-sm mt-2">Margem: 14.0%</p>
            <div className="flex items-center gap-1 mt-2 text-emerald-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+15.2% vs mês anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* Fluxo de Caixa */}
        <ChartCard
          title="Fluxo de Caixa"
          subtitle="Entradas, saídas e saldo mensal"
          icon={Wallet}
          iconColor="text-blue-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fluxoCaixa}>
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
                <Legend />
                <Bar dataKey="entradas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Saldo"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Despesas por Centro de Custo */}
        <ChartCard
          title="Despesas por Centro de Custo"
          subtitle="Composição dos gastos (valor e %)"
          icon={BarChart3}
          iconColor="text-rose-500"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={despesasPorCentroCusto} 
                layout="vertical"
                margin={{ left: 10, right: 20 }}
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
                  tick={{ fill: '#68788e', fontSize: 10 }}
                  width={95}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    'Valor'
                  ]}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#ef4444" 
                  radius={[0, 4, 4, 0]} 
                  name="Despesa"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* DRE e Contas a Receber */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* DRE Resumido */}
        <ChartCard
          title="DRE Resumido"
          subtitle="Demonstração do resultado"
          icon={BarChart3}
          iconColor="text-emerald-500"
          noPadding
        >
          <DataTable
            columns={dreColumns}
            data={dreResumo as unknown as Record<string, unknown>[]}
            keyField="name"
          />
        </ChartCard>

        {/* Contas a Receber */}
        <ChartCard
          title="Contas a Receber"
          subtitle="Aging de recebíveis"
          icon={CreditCard}
          iconColor="text-amber-500"
          noPadding
        >
          <DataTable
            columns={contasColumns}
            data={contasReceberVencer as unknown as Record<string, unknown>[]}
            keyField="name"
          />
          <div className="p-4 bg-amber-50 border-t border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-amber-700">Inadimplência Total</span>
                <p className="text-xs text-amber-600 mt-0.5">Vencidos &gt; 30 dias</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-amber-800">R$ 135.850</span>
                <p className="text-xs text-amber-600">3.2% da carteira</p>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Ciclo Financeiro */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h3 className="font-display font-semibold text-lg mb-6">Ciclo Financeiro</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-xs">PME</span>
            </div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-slate-400 text-xs mt-1">dias de estoque</p>
          </div>
          <div className="flex items-center justify-center text-slate-500">
            <span className="text-2xl">+</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-xs">PMR</span>
            </div>
            <p className="text-2xl font-bold">28</p>
            <p className="text-slate-400 text-xs mt-1">dias recebimento</p>
          </div>
          <div className="flex items-center justify-center text-slate-500">
            <span className="text-2xl">−</span>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 text-xs">PMP</span>
            </div>
            <p className="text-2xl font-bold">35</p>
            <p className="text-slate-400 text-xs mt-1">dias pagamento</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-slate-300">Ciclo Financeiro =</span>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-2">
              <span className="text-2xl font-bold text-emerald-400">5 dias</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Empresa financia apenas 5 dias da operação com capital próprio
          </p>
        </div>
      </div>

      {/* Ponto de Equilíbrio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <span className="font-medium">Ponto de Equilíbrio</span>
          </div>
          <p className="text-3xl font-bold">R$ 1.85M</p>
          <p className="text-blue-200 text-sm mt-2">Faturamento mínimo mensal</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-medium">Margem de Segurança</span>
          </div>
          <p className="text-3xl font-bold">54%</p>
          <p className="text-emerald-200 text-sm mt-2">Acima do break-even</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="font-medium">Saldo em Caixa</span>
          </div>
          <p className="text-3xl font-bold">R$ 485k</p>
          <p className="text-purple-200 text-sm mt-2">Disponível imediato</p>
        </div>
      </div>
    </div>
  )
}

export default Financeiro

