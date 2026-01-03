// ==========================================
// ROTINAS DE ALERTAS AUTOMÁTICOS
// ==========================================
// Analisa KPIs periodicamente e gera alertas

import { IntelligentAlert, Severity } from './types'
import { DataAdapter } from './adapter'

// ==========================================
// ARMAZENAMENTO DE ALERTAS (EM MEMÓRIA)
// ==========================================
// Em produção, isso seria um banco de dados

interface AlertHistory {
  kpiId: string
  lastAlertTimestamp: number
  recentValues: number[] // Últimos 3 valores para detecção de tendência
}

const alertHistory = new Map<string, AlertHistory>()
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 horas

// ==========================================
// CONFIGURAÇÃO DE LIMIARES
// ==========================================

interface Threshold {
  kpi: string
  area: string
  warning: number
  critical: number
  direction: 'above' | 'below'
}

const thresholds: Threshold[] = [
  { kpi: 'margem', area: 'Financeiro', warning: 30, critical: 28, direction: 'below' },
  { kpi: 'oee', area: 'Produção', warning: 80, critical: 75, direction: 'below' },
  { kpi: 'otif', area: 'Logística', warning: 95, critical: 92, direction: 'below' },
  { kpi: 'perdas', area: 'Produção', warning: 3, critical: 4, direction: 'above' },
  { kpi: 'inadimplencia', area: 'Financeiro', warning: 3, critical: 5, direction: 'above' },
  { kpi: 'otd', area: 'Compras', warning: 90, critical: 85, direction: 'below' }
]

// ==========================================
// DETECÇÃO DE DESVIOS
// ==========================================

// ==========================================
// VALIDAÇÃO DE QUALIDADE DO DADO
// ==========================================

function validateDataQuality(kpi: { id: string; value: number | string; unit?: string }): 'complete' | 'incomplete' | 'suspicious' {
  // Verifica se valor é válido
  if (typeof kpi.value !== 'number' || isNaN(kpi.value) || !isFinite(kpi.value)) {
    return 'incomplete'
  }
  
  // Verifica se valor está em range razoável (ex: percentual entre 0-100)
  if (kpi.unit === '%' && (kpi.value < 0 || kpi.value > 100)) {
    return 'suspicious'
  }
  
  // Verifica se valor é muito extremo (possível erro de digitação)
  if (kpi.value < -1000 || kpi.value > 10000000) {
    return 'suspicious'
  }
  
  return 'complete'
}

// ==========================================
// DETECÇÃO DE TENDÊNCIA (3 PONTOS SEGUIDOS)
// ==========================================

function checkTrend(kpiId: string, value: number, threshold: Threshold): boolean {
  const history = alertHistory.get(kpiId)
  
  if (!history) {
    // Primeira vez - inicializa histórico
    alertHistory.set(kpiId, {
      kpiId,
      lastAlertTimestamp: 0,
      recentValues: [value]
    })
    return false // Não é tendência ainda
  }
  
  // Adiciona valor atual
  history.recentValues.push(value)
  
  // Mantém apenas últimos 3 valores
  if (history.recentValues.length > 3) {
    history.recentValues.shift()
  }
  
  // Precisa de 3 valores para detectar tendência
  if (history.recentValues.length < 3) {
    return false
  }
  
  // Verifica se todos os 3 valores estão abaixo/acima do limiar
  const allBelowThreshold = history.recentValues.every(v => {
    if (threshold.direction === 'below') {
      return v < threshold.critical
    } else {
      return v > threshold.critical
    }
  })
  
  return allBelowThreshold
}

// ==========================================
// VERIFICAÇÃO DE COOLDOWN
// ==========================================

function isInCooldown(kpiId: string): boolean {
  const history = alertHistory.get(kpiId)
  if (!history) return false
  
  const timeSinceLastAlert = Date.now() - history.lastAlertTimestamp
  return timeSinceLastAlert < COOLDOWN_MS
}

// ==========================================
// DETECÇÃO DE DESVIOS COM ANTI-RUÍDO
// ==========================================

export async function detectDeviations(): Promise<IntelligentAlert[]> {
  const alerts: IntelligentAlert[] = []

  // Analisa KPIs gerais
  const kpis = await DataAdapter.get_kpis_overview('dezembro')
  
  for (const threshold of thresholds) {
    const kpi = kpis.kpis.find(k => k.id === threshold.kpi)
    if (!kpi) continue

    const value = typeof kpi.value === 'number' ? kpi.value : 0
    
    // VALIDAÇÃO DE QUALIDADE DO DADO
    const dataQuality = validateDataQuality(kpi)
    if (dataQuality !== 'complete') {
      // Não gera alerta se dado incompleto ou suspeito
      if (import.meta.env.DEV) {
        console.log(`⚠️ Alerta ignorado para ${kpi.id}: qualidade do dado = ${dataQuality}`)
      }
      continue
    }
    
    let severity: Severity | null = null
    let detected = false

    if (threshold.direction === 'below') {
      if (value < threshold.critical) {
        severity = 'P0'
        detected = true
      } else if (value < threshold.warning) {
        severity = 'P1'
        detected = true
      }
    } else {
      if (value > threshold.critical) {
        severity = 'P0'
        detected = true
      } else if (value > threshold.warning) {
        severity = 'P1'
        detected = true
      }
    }

    if (detected && severity) {
      // VERIFICAÇÃO DE COOLDOWN
      if (isInCooldown(kpi.id)) {
        if (import.meta.env.DEV) {
          console.log(`⏸️ Alerta ignorado para ${kpi.id}: em cooldown (24h)`)
        }
        continue
      }
      
      // DETECÇÃO POR TENDÊNCIA (3 pontos seguidos)
      const isTrend = checkTrend(kpi.id, value, threshold)
      if (!isTrend && severity === 'P1') {
        // Para P1, só alerta se for tendência (3 pontos seguidos)
        // Para P0, alerta imediatamente
        if (import.meta.env.DEV) {
          console.log(`📊 Alerta P1 ignorado para ${kpi.id}: não é tendência (precisa 3 pontos seguidos)`)
        }
        continue
      }
      
      // Busca valor anterior (simulado)
      const previousValue = value + (threshold.direction === 'below' ? 2 : -2)
      const change = value - previousValue

      const alert: IntelligentAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        severity,
        indicator: {
          id: kpi.id,
          label: kpi.label,
          area: threshold.area
        },
        variation: {
          current: value,
          previous: previousValue,
          change,
          unit: kpi.unit || ''
        },
        impact: {
          estimated: estimateImpact(kpi.id, change, threshold.area)
        },
        probableCause: generateProbableCause(kpi.id, threshold.area),
        confidence: 75,
        status: 'new',
        dataQuality: 'complete',
        lastAlertTimestamp: new Date().toISOString()
      }
      
      alerts.push(alert)
      
      // Atualiza histórico
      const history = alertHistory.get(kpi.id) || {
        kpiId: kpi.id,
        lastAlertTimestamp: 0,
        recentValues: []
      }
      history.lastAlertTimestamp = Date.now()
      alertHistory.set(kpi.id, history)
    }
  }

  // AGRUPAMENTO DE ALERTAS SIMILARES
  return groupSimilarAlerts(alerts)
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function estimateImpact(kpiId: string, change: number, area: string): string {
  if (kpiId === 'margem') {
    const estimatedFinancial = Math.abs(change) * 28475 // Aproximação baseada na receita
    return `Impacto financeiro estimado de R$ ${estimatedFinancial.toLocaleString('pt-BR')} no período`
  }
  
  if (kpiId === 'oee') {
    return `Redução de eficiência pode impactar capacidade de produção`
  }
  
  if (kpiId === 'otif') {
    return `Possível impacto na satisfação do cliente e retenção`
  }

  return `Impacto operacional na área de ${area}`
}

function generateProbableCause(kpiId: string, area: string): string {
  const causes: Record<string, string> = {
    margem: 'Possível aumento no custo de matéria-prima ou redução no preço de venda',
    oee: 'Aumento de paradas não programadas ou redução de performance',
    otif: 'Problemas na logística ou planejamento de rotas',
    perdas: 'Problemas no processo de produção ou qualidade',
    inadimplencia: 'Aumento de atrasos no recebimento',
    otd: 'Atrasos ou problemas com fornecedores'
  }

  return causes[kpiId] || `Possível problema na área de ${area}`
}

// ==========================================
// AGRUPAMENTO DE ALERTAS SIMILARES
// ==========================================

function groupSimilarAlerts(alerts: IntelligentAlert[]): IntelligentAlert[] {
  // Agrupa alertas do mesmo KPI e severidade
  const grouped = new Map<string, IntelligentAlert[]>()
  
  for (const alert of alerts) {
    const key = `${alert.indicator.id}_${alert.severity}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(alert)
  }
  
  // Se há múltiplos alertas do mesmo tipo, agrupa em um único alerta
  const result: IntelligentAlert[] = []
  
  for (const [key, group] of grouped.entries()) {
    if (group.length === 1) {
      result.push(group[0])
    } else {
      // Agrupa múltiplos alertas similares
      const firstAlert = group[0]
      const count = group.length
      
      result.push({
        ...firstAlert,
        id: `alert_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        probableCause: `${firstAlert.probableCause} (${count} ocorrências similares)`,
        impact: {
          ...firstAlert.impact,
          estimated: `${firstAlert.impact.estimated} (${count} alertas similares detectados)`
        }
      })
    }
  }
  
  return result
}

// ==========================================
// FUNÇÕES DE SNOOZE E ACKNOWLEDGE
// ==========================================

export function snoozeAlert(alertId: string, hours: number): void {
  // Em produção, isso atualizaria no banco de dados
  // Por enquanto, apenas log
  if (import.meta.env.DEV) {
    console.log(`🔕 Alerta ${alertId} snoozed por ${hours} horas`)
  }
}

export function acknowledgeAlert(alertId: string, userId: string): void {
  // Em produção, isso atualizaria no banco de dados
  // Por enquanto, apenas log
  if (import.meta.env.DEV) {
    console.log(`✅ Alerta ${alertId} reconhecido por ${userId}`)
  }
}

// ==========================================
// EXECUÇÃO PERIÓDICA (SIMULADA)
// ==========================================

export async function runAlertRoutine(): Promise<IntelligentAlert[]> {
  // Em produção, esta função seria chamada por um cron job ou scheduler
  return detectDeviations()
}




