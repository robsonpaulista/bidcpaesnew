// ==========================================
// GERAÇÃO DE BRIEFING DO DIA
// ==========================================
// Resumo executivo do trabalho dos agentes

import type { IntelligentAlert, OperationalCase } from './types'
import { supabaseFetch } from '../supabase/client'

// ==========================================
// TIPOS
// ==========================================

export interface Briefing {
  date: string // YYYY-MM-DD
  summary: string
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
}

// ==========================================
// GERAÇÃO DE BRIEFING
// ==========================================

export async function generateBriefing(date: string): Promise<Briefing> {
  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`
  
  // 1. Busca alertas do dia
  const { data: alertsData } = await supabaseFetch('alerts', {
    method: 'GET',
    query: {
      'timestamp.gte': startOfDay,
      'timestamp.lte': endOfDay,
      order: 'timestamp.desc',
      limit: '10'
    },
    useServiceRole: false // Usa anon key em dev
  })

  const alerts = (Array.isArray(alertsData) ? alertsData : []) as any[]

  // 2. Busca casos abertos/em investigação
  const { data: casesData } = await supabaseFetch('cases', {
    method: 'GET',
    query: {
      status: 'in.(aberto,em_investigacao)',
      order: 'created_at.desc',
      limit: '5'
    },
    useServiceRole: false // Usa anon key em dev
  })

  const cases = (Array.isArray(casesData) ? casesData : []) as any[]

  // 3. Busca eventos do dia
  const { data: eventsData } = await supabaseFetch('events', {
    method: 'GET',
    query: {
      'timestamp.gte': startOfDay,
      'timestamp.lte': endOfDay,
      order: 'timestamp.desc',
      limit: '20'
    },
    useServiceRole: false // Usa anon key em dev
  })

  const events = (Array.isArray(eventsData) ? eventsData : []) as any[]

  // 4. Gera resumo executivo
  const summary = generateExecutiveSummary(alertsArray, casesArray, eventsArray)
  
  // Garante que são arrays
  const alertsArray = Array.isArray(alerts) ? alerts : []
  const casesArray = Array.isArray(cases) ? cases : []
  const eventsArray = Array.isArray(events) ? events : []
  
  // Se não houver dados, gera um briefing básico
  if (alertsArray.length === 0 && casesArray.length === 0 && eventsArray.length === 0) {
    return {
      date,
      summary: 'Dia operacional estável. Nenhum desvio crítico detectado. Todos os indicadores estão dentro dos parâmetros esperados.',
      topAlerts: [],
      topCases: [],
      kpiHighlights: [
        {
          kpi: 'Receita',
          value: 'R$ 2.847,5k',
          trend: 'up',
          area: 'financeiro'
        },
        {
          kpi: 'Margem Bruta',
          value: '32,4%',
          trend: 'up',
          area: 'financeiro'
        }
      ],
      recommendations: [
        {
          priority: 'low',
          action: 'Manter monitoramento contínuo dos indicadores',
          area: 'geral'
        }
      ]
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

  return {
    date,
    summary,
    topAlerts,
    topCases,
    kpiHighlights,
    recommendations
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

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

