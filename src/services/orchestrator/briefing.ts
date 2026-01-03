// ==========================================
// GERAÇÃO DE BRIEFING DO DIA
// ==========================================
// Resumo executivo do trabalho dos agentes - Formato CEO/Executivo

import type { IntelligentAlert, OperationalCase } from './types'
import { supabaseFetch } from '../supabase/client'
import { DataAdapter } from './adapter'
import { receitaMensal } from '../mockData'

// Áreas do negócio
const AREAS = [
  { id: 'comercial', label: 'Comercial' },
  { id: 'compras', label: 'Compras' },
  { id: 'producao', label: 'Produção' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'logistica', label: 'Logística' },
  { id: 'financeiro', label: 'Financeiro' }
]

// Mapeamento de meses para formato usado em receitaMensal
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ==========================================
// TIPOS
// ==========================================

export interface AreaSummary {
  area: string
  areaLabel: string
  status: 'ok' | 'attention' | 'critical'
  monthAccumulated: number
  monthGoal: number | null
  goalProgress: number | null // porcentagem 0-100+
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

export interface Briefing {
  date: string // YYYY-MM-DD
  summary: string
  areaSummaries: AreaSummary[]
  topAlerts: Array<{
    id: string
    severity: string
    title: string
    area: string
  }>
  topCases: Array<{
    id: string
    title: string
    status: string
    area: string
  }>
  kpiHighlights: Array<{
    kpi: string
    value: number | string
    trend: 'up' | 'down' | 'stable'
    area: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    area: string
  }>
  // Mantém compatibilidade com estrutura antiga
  topAlerts?: Array<{
    id: string
    severity: string
    title: string
    area: string
  }>
  topCases?: Array<{
    id: string
    title: string
    status: string
    area: string
  }>
  kpiHighlights?: Array<{
    kpi: string
    value: number | string
    trend: 'up' | 'down' | 'stable'
    area: string
  }>
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    area: string
  }>
}

// ==========================================
// GERAÇÃO DE BRIEFING
// ==========================================

export async function generateBriefing(date: string): Promise<Briefing> {
  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`
  
  // Extrai mês atual da data (formato YYYY-MM-DD)
  const dateObj = new Date(date + 'T00:00:00')
  const monthIndex = dateObj.getMonth()
  const currentMonthName = MONTH_NAMES[monthIndex]
  
  // 1. Busca alertas do dia
  const { data: alertsData, error: alertsError } = await supabaseFetch('alerts', {
    method: 'GET',
    query: {
      'timestamp.gte': startOfDay,
      'timestamp.lte': endOfDay,
      order: 'timestamp.desc',
      limit: '50'
    },
    useServiceRole: false
  })

  if (alertsError) {
    console.warn('⚠️ Erro ao buscar alertas:', alertsError)
  }

  const alerts = (Array.isArray(alertsData) ? alertsData : []) as any[]

  // 2. Busca casos abertos/em investigação
  const { data: casesData, error: casesError } = await supabaseFetch('cases', {
    method: 'GET',
    query: {
      status: 'in.(aberto,em_investigacao)',
      order: 'created_at.desc',
      limit: '20'
    },
    useServiceRole: false
  })

  if (casesError) {
    console.warn('⚠️ Erro ao buscar casos:', casesError)
  }

  const cases = (Array.isArray(casesData) ? casesData : []) as any[]

  // 3. Busca eventos do dia
  const { data: eventsData, error: eventsError } = await supabaseFetch('events', {
    method: 'GET',
    query: {
      'timestamp.gte': startOfDay,
      'timestamp.lte': endOfDay,
      order: 'timestamp.desc',
      limit: '20'
    },
    useServiceRole: false
  })

  if (eventsError) {
    console.warn('⚠️ Erro ao buscar eventos:', eventsError)
  }

  const events = (Array.isArray(eventsData) ? eventsData : []) as any[]

  // Garante que são arrays
  const alertsArray = Array.isArray(alerts) ? alerts : []
  const casesArray = Array.isArray(cases) ? cases : []
  const eventsArray = Array.isArray(events) ? events : []
  
  // 4. Gera resumos por área
  const areaSummaries: AreaSummary[] = []
  const revenueData = await DataAdapter.get_revenue_monthly('dezembro')
  const currentMonthRevenue = revenueData.months.find(m => m.month === currentMonthName)
  
  for (const area of AREAS) {
    try {
      // Busca KPIs da área
      const kpisData = await DataAdapter.get_kpis_overview('dezembro', area.id)
      const kpis = kpisData.kpis || []
      
      if (kpis.length === 0) continue
      
      // Filtra alertas e casos da área
      const areaAlerts = alertsArray.filter(a => {
        const alertArea = a.indicator_area || a.area || 'geral'
        return alertArea === area.id
      })
      const areaCases = casesArray.filter(c => {
        const caseArea = c.area || 'geral'
        return caseArea === area.id
      })
      
      // Define KPI principal (primeiro da lista)
      const mainKPI = kpis[0]
      
      // Calcula acumulado do mês e meta
      let monthAccumulated = 0
      let monthGoal: number | null = null
      let goalProgress: number | null = null
      
      if (area.id === 'comercial' || area.id === 'financeiro') {
        if (currentMonthRevenue) {
          monthAccumulated = currentMonthRevenue.value
          monthGoal = currentMonthRevenue.meta || null
          if (monthGoal && monthGoal > 0) {
            goalProgress = (monthAccumulated / monthGoal) * 100
          }
        }
      } else {
        // Para outras áreas, usa o KPI principal como acumulado
        monthAccumulated = typeof mainKPI.value === 'number' ? mainKPI.value : 0
      }
      
      // Determina status da área
      const criticalAlerts = areaAlerts.filter(a => a.severity === 'P0').length
      const highAlerts = areaAlerts.filter(a => a.severity === 'P1').length
      let status: 'ok' | 'attention' | 'critical' = 'ok'
      if (criticalAlerts > 0) {
        status = 'critical'
      } else if (highAlerts > 0 || areaCases.length > 2 || (goalProgress !== null && goalProgress < 95)) {
        status = 'attention'
      }
      
      // Gera análise do agente
      let agentAnalysis: string | null = null
      if (kpis.length > 0) {
        const positiveTrends = kpis.filter(k => k.trend === 'up').length
        const negativeTrends = kpis.filter(k => k.trend === 'down').length
        
        if (criticalAlerts > 0) {
          agentAnalysis = `${criticalAlerts} alerta(s) crítico(s) detectado(s) requerendo atenção imediata.`
        } else if (negativeTrends > positiveTrends) {
          agentAnalysis = `Tendência de declínio observada em ${negativeTrends} indicador(es). Recomenda-se revisão operacional.`
        } else if (positiveTrends > negativeTrends) {
          agentAnalysis = `Tendência positiva em ${positiveTrends} indicador(es). Performance acima do esperado.`
        } else if (goalProgress !== null) {
          if (goalProgress >= 100) {
            agentAnalysis = `Meta do mês superada (${goalProgress.toFixed(1)}%). Performance excelente.`
          } else if (goalProgress >= 95) {
            agentAnalysis = `Meta do mês em ${goalProgress.toFixed(1)}% de execução. No caminho para atingir o objetivo.`
          } else {
            agentAnalysis = `Meta do mês em ${goalProgress.toFixed(1)}% de execução. Requer atenção para atingir o objetivo.`
          }
        } else {
          agentAnalysis = `Operação estável. Indicadores dentro dos parâmetros normais.`
        }
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
          trend: mainKPI.trend || 'stable'
        },
        kpis: kpis.slice(0, 4).map(k => ({
          id: k.id,
          label: k.label,
          value: k.value,
          unit: k.unit || '',
          trend: k.trend || 'stable'
        })),
        agentAnalysis,
        alerts: areaAlerts.slice(0, 3).map(a => ({
          id: a.id || a.indicator_id || '',
          severity: a.severity || 'P2',
          title: `${a.indicator_label || a.indicator_id} - ${a.probable_cause || 'Desvio detectado'}`
        })),
        casesCount: areaCases.length
      })
    } catch (error) {
      console.error(`⚠️ Erro ao gerar resumo para área ${area.id}:`, error)
    }
  }

  // 5. Top alertas (por severidade)
  const topAlerts = alertsArray
    .slice(0, 5)
    .map((a: any) => ({
      id: a.id || a.indicator_id || `alert_${Date.now()}`,
      severity: a.severity || 'P2',
      title: `${a.indicator_label || a.indicator_id} - ${a.probable_cause || 'Desvio detectado'}`,
      area: a.indicator_area || 'geral'
    }))

  // 6. Top casos
  const topCases = casesArray
    .slice(0, 5)
    .map((c: any) => ({
      id: c.id || `case_${Date.now()}`,
      title: c.title || 'Caso sem título',
      status: c.status || 'aberto',
      area: c.area || 'geral'
    }))

  // 7. Destaques de KPIs (extrai dos alertas)
  const kpiHighlights = extractKPIHighlights(alertsArray)

  // 8. Recomendações (baseadas nos alertas)
  const recommendations = extractRecommendations(alertsArray, casesArray)

  // 9. Gera resumo executivo melhorado
  const summary = generateExecutiveSummaryEnhanced(areaSummaries, alertsArray, casesArray, eventsArray)

  return {
    date,
    summary,
    areaSummaries,
    topAlerts,
    topCases,
    kpiHighlights,
    recommendations
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function generateExecutiveSummaryEnhanced(
  areaSummaries: AreaSummary[],
  alerts: any[],
  cases: any[],
  events: any[]
): string {
  const criticalAlerts = alerts.filter(a => a.severity === 'P0').length
  const highAlerts = alerts.filter(a => a.severity === 'P1').length
  const openCases = cases.length
  const totalEvents = events.length
  
  // Análise por área
  const criticalAreas = areaSummaries.filter(a => a.status === 'critical')
  const attentionAreas = areaSummaries.filter(a => a.status === 'attention')
  
  // Análise de metas
  const areasWithGoals = areaSummaries.filter(a => a.goalProgress !== null)
  const areasAboveGoal = areasWithGoals.filter(a => (a.goalProgress || 0) >= 100)
  const areasBelowGoal = areasWithGoals.filter(a => (a.goalProgress || 0) < 95)
  
  const parts: string[] = []
  
  // Resumo operacional
  if (criticalAlerts > 0) {
    parts.push(`${criticalAlerts} alerta${criticalAlerts > 1 ? 's' : ''} crítico${criticalAlerts > 1 ? 's' : ''} (P0)`)
  }
  
  if (highAlerts > 0) {
    parts.push(`${highAlerts} alerta${highAlerts > 1 ? 's' : ''} de alta prioridade (P1)`)
  }
  
  if (openCases > 0) {
    parts.push(`${openCases} caso${openCases > 1 ? 's' : ''} em investigação`)
  }
  
  // Resumo por área
  if (criticalAreas.length > 0) {
    const areasList = criticalAreas.map(a => a.areaLabel).join(', ')
    parts.push(`${criticalAreas.length} área${criticalAreas.length > 1 ? 's' : ''} crítica${criticalAreas.length > 1 ? 's' : ''}: ${areasList}`)
  }
  
  if (attentionAreas.length > 0 && criticalAreas.length === 0) {
    parts.push(`${attentionAreas.length} área${attentionAreas.length > 1 ? 's' : ''} requerendo atenção`)
  }
  
  // Resumo de metas
  if (areasAboveGoal.length > 0) {
    parts.push(`${areasAboveGoal.length} área${areasAboveGoal.length > 1 ? 's' : ''} com meta superada`)
  }
  
  if (areasBelowGoal.length > 0) {
    parts.push(`${areasBelowGoal.length} área${areasBelowGoal.length > 1 ? 's' : ''} abaixo da meta`)
  }
  
  if (parts.length === 0) {
    return 'Dia operacional estável. Todas as áreas operando dentro dos parâmetros esperados. Nenhum desvio crítico detectado.'
  }

  return `Resumo executivo: ${parts.join('; ')}. ${totalEvents > 0 ? `${totalEvents} evento${totalEvents > 1 ? 's' : ''} registrado${totalEvents > 1 ? 's' : ''} no dia.` : ''}`
}

function generateExecutiveSummary(
  alerts: any[],
  cases: any[],
  events: any[]
): string {
  const criticalAlerts = alerts.filter(a => a.severity === 'P0').length
  const highAlerts = alerts.filter(a => a.severity === 'P1').length
  const openCases = cases.length
  const totalEvents = events.length

  const parts: string[] = []

  if (criticalAlerts > 0) {
    parts.push(`${criticalAlerts} alerta${criticalAlerts > 1 ? 's' : ''} crítico${criticalAlerts > 1 ? 's' : ''} (P0)`)
  }

  if (highAlerts > 0) {
    parts.push(`${highAlerts} alerta${highAlerts > 1 ? 's' : ''} de alta prioridade (P1)`)
  }

  if (openCases > 0) {
    parts.push(`${openCases} caso${openCases > 1 ? 's' : ''} em investigação`)
  }

  if (totalEvents > 0) {
    parts.push(`${totalEvents} evento${totalEvents > 1 ? 's' : ''} registrado${totalEvents > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    return 'Dia operacional estável. Nenhum desvio crítico detectado.'
  }

  return `Resumo do dia: ${parts.join(', ')}.`
}

function extractKPIHighlights(alerts: any[]): Briefing['kpiHighlights'] {
  const kpiMap = new Map<string, { value: number; trend: 'up' | 'down' | 'stable'; area: string }>()

  for (const alert of alerts) {
    const kpi = alert.indicator_id
    if (!kpiMap.has(kpi)) {
      kpiMap.set(kpi, {
        value: alert.current_value,
        trend: alert.change_value > 0 ? 'up' : alert.change_value < 0 ? 'down' : 'stable',
        area: alert.indicator_area
      })
    }
  }

  return Array.from(kpiMap.entries())
    .slice(0, 5)
    .map(([kpi, data]) => ({
      kpi,
      ...data
    }))
}

function extractRecommendations(
  alerts: any[],
  cases: any[]
): Briefing['recommendations'] {
  const recommendations: Briefing['recommendations'] = []
  const alertsArray = Array.isArray(alerts) ? alerts : []
  const casesArray = Array.isArray(cases) ? cases : []

  // Recomendações baseadas em alertas críticos
  const criticalAlerts = alertsArray.filter((a: any) => a?.severity === 'P0')
  for (const alert of criticalAlerts.slice(0, 3)) {
    recommendations.push({
      priority: 'high' as const,
      action: `Investigar ${alert.indicator_label || alert.indicator_id}: ${alert.probable_cause || 'Desvio detectado'}`,
      area: alert.indicator_area || alert.area || 'geral'
    })
  }

  // Recomendações baseadas em casos abertos
  if (casesArray.length > 0) {
    recommendations.push({
      priority: 'medium' as const,
      action: `Revisar ${casesArray.length} caso${casesArray.length > 1 ? 's' : ''} em investigação`,
      area: casesArray[0]?.area || 'geral'
    })
  }

  return recommendations.slice(0, 5)
}

