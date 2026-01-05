// ==========================================
// GERAÇÃO DE BRIEFING PARA SERVERLESS FUNCTIONS
// ==========================================
// Versão simplificada que gera briefing usando dados mockados diretamente
// Evita problemas de imports de src/ no Vercel

// Dados mockados inline (mesmos da aplicação)
const AREAS = [
  { id: 'comercial', label: 'Comercial' },
  { id: 'compras', label: 'Compras' },
  { id: 'producao', label: 'Produção' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'logistica', label: 'Logística' },
  { id: 'financeiro', label: 'Financeiro' }
]

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// KPIs mockados por área (valores simplificados dos dados reais)
const MOCK_KPIS: Record<string, Array<{ id: string; label: string; value: number; unit: string; trend: 'up' | 'down' | 'neutral' }>> = {
  comercial: [
    { id: 'faturamento', label: 'Faturamento', value: 2847500, unit: 'R$', trend: 'up' },
    { id: 'volume_vendas', label: 'Volume Vendas', value: 142350, unit: 'kg', trend: 'up' },
    { id: 'ticket_medio', label: 'Ticket Médio', value: 2284, unit: 'R$', trend: 'up' },
    { id: 'margem', label: 'Margem Contribuição', value: 28.7, unit: '%', trend: 'up' }
  ],
  compras: [
    { id: 'custo_mp', label: 'Custo Total MP', value: 892450, unit: 'R$', trend: 'up' },
    { id: 'otd', label: 'OTD Fornecedores', value: 91.3, unit: '%', trend: 'up' },
    { id: 'fill_rate', label: 'Fill Rate', value: 96.8, unit: '%', trend: 'up' },
    { id: 'lead_time', label: 'Lead Time Médio', value: 3.2, unit: 'dias', trend: 'up' }
  ],
  producao: [
    { id: 'producao_total', label: 'Produção Total', value: 145820, unit: 'kg', trend: 'up' },
    { id: 'oee', label: 'OEE', value: 78.5, unit: '%', trend: 'up' },
    { id: 'disponibilidade', label: 'Disponibilidade', value: 92.3, unit: '%', trend: 'up' },
    { id: 'qualidade', label: 'Qualidade', value: 95.8, unit: '%', trend: 'up' }
  ],
  estoque: [
    { id: 'valor_estoque', label: 'Valor em Estoque', value: 485620, unit: 'R$', trend: 'up' },
    { id: 'giro_estoque', label: 'Giro de Estoque', value: 12, unit: 'dias', trend: 'up' },
    { id: 'acuracia', label: 'Acurácia', value: 98.5, unit: '%', trend: 'up' },
    { id: 'cobertura', label: 'Cobertura Média', value: 8.5, unit: 'dias', trend: 'neutral' }
  ],
  logistica: [
    { id: 'otif', label: 'OTIF', value: 94.7, unit: '%', trend: 'up' },
    { id: 'entrega_prazo', label: 'Entrega no Prazo', value: 96.2, unit: '%', trend: 'up' },
    { id: 'pedidos_completos', label: 'Pedidos Completos', value: 98.3, unit: '%', trend: 'up' },
    { id: 'custo_entrega', label: 'Custo por Entrega', value: 18.50, unit: 'R$', trend: 'up' }
  ],
  financeiro: [
    { id: 'receita_liquida', label: 'Receita Líquida', value: 2562750, unit: 'R$', trend: 'up' },
    { id: 'margem_bruta', label: 'Margem Bruta', value: 32.4, unit: '%', trend: 'up' },
    { id: 'margem_liquida', label: 'Margem Líquida', value: 12.8, unit: '%', trend: 'up' },
    { id: 'ebitda', label: 'EBITDA', value: 398250, unit: 'R$', trend: 'up' }
  ]
}

// Receita mensal mockada (dezembro)
const MOCK_RECEITA_MENSAL = {
  value: 2847500,
  meta: 2900000
}

interface AreaSummary {
  area: string
  areaLabel: string
  status: 'ok' | 'attention' | 'critical'
  monthAccumulated: number
  monthGoal: number | null
  goalProgress: number | null
  mainKPI: {
    label: string
    value: number | string
    unit: string
    trend: 'up' | 'down' | 'stable'
  }
  kpis: Array<{
    id: string
    label: string
    value: number | string
    unit: string
    trend: 'up' | 'down' | 'stable'
  }>
  agentAnalysis: string | null
  alerts: Array<{
    id: string
    severity: string
    title: string
  }>
  casesCount: number
}

interface Briefing {
  date: string
  summary: string
  areaSummaries: AreaSummary[]
  topAlerts: Array<{ id: string; severity: string; title: string; area: string }>
  topCases: Array<{ id: string; title: string; status: string; area: string }>
  kpiHighlights: Array<{ kpi: string; value: number | string; trend: 'up' | 'down' | 'stable'; area: string }>
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; area: string }>
}

export async function generateBriefing(date: string): Promise<Briefing> {
  // Extrai mês atual da data
  const dateObj = new Date(date + 'T00:00:00')
  const monthIndex = dateObj.getMonth()
  const currentMonthName = MONTH_NAMES[monthIndex]
  
  // Gera resumos por área
  const areaSummaries: AreaSummary[] = []
  
  for (const area of AREAS) {
    const kpis = MOCK_KPIS[area.id] || []
    if (kpis.length === 0) continue
    
    const mainKPI = kpis[0]
    
    // Calcula acumulado do mês e meta
    let monthAccumulated = 0
    let monthGoal: number | null = null
    let goalProgress: number | null = null
    
    if (area.id === 'comercial' || area.id === 'financeiro') {
      monthAccumulated = MOCK_RECEITA_MENSAL.value
      monthGoal = MOCK_RECEITA_MENSAL.meta
      if (monthGoal && monthGoal > 0) {
        goalProgress = (monthAccumulated / monthGoal) * 100
      }
    } else {
      monthAccumulated = typeof mainKPI.value === 'number' ? mainKPI.value : 0
    }
    
    // Status da área (simulado - todas OK por enquanto)
    let status: 'ok' | 'attention' | 'critical' = 'ok'
    if (goalProgress !== null && goalProgress < 95) {
      status = 'attention'
    }
    
    // Gera análise do agente
    let agentAnalysis: string | null = null
    const positiveTrends = kpis.filter(k => k.trend === 'up').length
    const negativeTrends = kpis.filter(k => k.trend === 'down').length
    
    if (goalProgress !== null) {
      if (goalProgress >= 100) {
        agentAnalysis = `Meta do mês superada (${goalProgress.toFixed(1)}%). Performance excelente.`
      } else if (goalProgress >= 95) {
        agentAnalysis = `Meta do mês em ${goalProgress.toFixed(1)}% de execução. No caminho para atingir o objetivo.`
      } else {
        agentAnalysis = `Meta do mês em ${goalProgress.toFixed(1)}% de execução. Requer atenção para atingir o objetivo.`
        status = 'attention'
      }
    } else if (positiveTrends > negativeTrends) {
      agentAnalysis = `Tendência positiva em ${positiveTrends} indicador(es). Performance acima do esperado.`
    } else {
      agentAnalysis = `Operação estável. Indicadores dentro dos parâmetros normais.`
    }
    
    areaSummaries.push({
      area: area.id,
      areaLabel: area.label,
      status,
      monthAccumulated,
      monthGoal,
      goalProgress,
      mainKPI: {
        label: mainKPI.label,
        value: mainKPI.value,
        unit: mainKPI.unit || '',
        trend: mainKPI.trend === 'neutral' ? 'stable' : mainKPI.trend
      },
      kpis: kpis.slice(0, 4).map(k => ({
        id: k.id,
        label: k.label,
        value: k.value,
        unit: k.unit || '',
        trend: k.trend === 'neutral' ? 'stable' : k.trend
      })),
      agentAnalysis,
      alerts: [],
      casesCount: 0
    })
  }
  
  // Gera resumo executivo
  const areasWithGoals = areaSummaries.filter(a => a.goalProgress !== null)
  const areasAboveGoal = areasWithGoals.filter(a => (a.goalProgress || 0) >= 100)
  const areasBelowGoal = areasWithGoals.filter(a => (a.goalProgress || 0) < 95)
  const areasOnTrack = areasWithGoals.filter(a => {
    const progress = a.goalProgress || 0
    return progress >= 95 && progress < 100
  })
  
  const parts: string[] = []
  if (areasAboveGoal.length > 0) {
    const areasList = areasAboveGoal.map(a => a.areaLabel).join(', ')
    parts.push(`${areasAboveGoal.length} área(s) com meta superada: ${areasList}`)
  }
  if (areasOnTrack.length > 0 && areasAboveGoal.length === 0) {
    parts.push(`${areasOnTrack.length} área(s) no caminho para atingir a meta`)
  }
  if (areasBelowGoal.length > 0) {
    const areasList = areasBelowGoal.map(a => a.areaLabel).join(', ')
    parts.push(`${areasBelowGoal.length} área(s) abaixo da meta: ${areasList}`)
  }
  
  const summary = parts.length > 0
    ? `Resumo executivo: ${parts.join('; ')}. Todas as áreas operando normalmente.`
    : `Operação estável em todas as áreas. Todas as ${areaSummaries.length} áreas operando dentro dos parâmetros esperados.`
  
  return {
    date,
    summary,
    areaSummaries,
    topAlerts: [],
    topCases: [],
    kpiHighlights: [],
    recommendations: []
  }
}



