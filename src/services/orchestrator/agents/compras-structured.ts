// ==========================================
// AGENTE DE COMPRAS ESTRUTURADO
// ==========================================
// Implementa o agente seguindo o prompt estruturado com catálogo fechado de KPIs

import { getPageContext, PageContext } from '../page-context.js'

// ==========================================
// CATÁLOGO DE KPIs (UNIVERSO FECHADO)
// ==========================================

export interface KPIDefinition {
  id: string
  label: string
  unit: string
  significado: string
  sinonimos: string[]
  naoConfundirCom: string[]
}

export const KPI_CATALOG: Record<string, KPIDefinition> = {
  custo_total_mp: {
    id: 'custo_total_mp',
    label: 'Custo Total MP',
    unit: 'R$',
    significado: 'custo total de matéria-prima no período',
    sinonimos: ['custo mp', 'gasto com matéria-prima', 'custo de compras', 'total gasto em mp'],
    naoConfundirCom: ['preço unitário', 'lead time', 'qualidade', 'otd']
  },
  otd_fornecedores: {
    id: 'otd_fornecedores',
    label: 'OTD Fornecedores',
    unit: '%',
    significado: 'entregas no prazo (pontualidade do fornecedor)',
    sinonimos: ['otd', 'entrega no prazo', 'pontualidade', 'atraso de fornecedor'],
    naoConfundirCom: ['fill rate', 'lead time', 'qualidade']
  },
  fill_rate: {
    id: 'fill_rate',
    label: 'Fill Rate',
    unit: '%',
    significado: '% do pedido atendido integralmente (pedido completo)',
    sinonimos: ['fill rate', 'pedido completo', 'atendido por completo', 'faltou item', 'corte no pedido'],
    naoConfundirCom: ['otd', 'lead time', 'qualidade']
  },
  lead_time_medio: {
    id: 'lead_time_medio',
    label: 'Lead Time Médio',
    unit: 'dias',
    significado: 'tempo entre pedido e entrega',
    sinonimos: ['lead time', 'tempo de entrega', 'prazo médio', 'demora na entrega'],
    naoConfundirCom: ['otd', 'fill rate', 'qualidade']
  },
  cobertura_estoque_mp: {
    id: 'cobertura_estoque_mp',
    label: 'Cobertura Estoque MP',
    unit: 'dias',
    significado: 'dias de estoque disponível de matéria-prima',
    sinonimos: ['cobertura', 'dias de estoque', 'estoque disponível', 'quanto tempo dura o estoque'],
    naoConfundirCom: ['custo', 'qualidade', 'otd', 'fill rate']
  },
  nao_conformidades: {
    id: 'nao_conformidades',
    label: 'Não Conformidades',
    unit: '%',
    significado: 'problemas de qualidade (falhas, devoluções, inconsistências) por fornecedor',
    sinonimos: ['qualidade', 'não conformidade', 'problema de qualidade', 'defeito', 'reclamação'],
    naoConfundirCom: ['otd', 'fill rate', 'lead time']
  }
}

// ==========================================
// MAPEAMENTO DE IDs (backend → frontend)
// ==========================================

const ID_MAPPING: Record<string, string> = {
  'custo_mp': 'custo_total_mp',
  'otd': 'otd_fornecedores',
  'fill_rate': 'fill_rate',
  'lead_time': 'lead_time_medio',
  'cobertura': 'cobertura_estoque_mp',
  'nao_conformidades': 'nao_conformidades'
}

// ==========================================
// TIPOS DE RESPOSTA
// ==========================================

export interface StructuredResponse {
  page: string
  kpi_principal: string
  confidence: number
  interpretation: string
  evidence: Array<{
    metric: string
    value: string
    unit: string
    source: 'card' | 'tabela' | 'grafico' | 'ranking'
  }>
  findings: string[]
  recommendations: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    owner: string
    requiresApproval: boolean
  }>
  needs_clarification: boolean
  clarification_question: string | null
  clarification_options: string[]
}

// ==========================================
// SELEÇÃO DE KPI PRINCIPAL
// ==========================================

function selectMainKPI(question: string): { kpiId: string; confidence: number; needsClarification: boolean } {
  const lowerQuestion = question.toLowerCase()
  
  // Detecção de ambiguidades
  const hasEntrega = lowerQuestion.includes('entrega')
  const hasCompleto = lowerQuestion.includes('completo') || lowerQuestion.includes('faltou') || lowerQuestion.includes('corte')
  const hasPrazo = lowerQuestion.includes('prazo') || lowerQuestion.includes('pontualidade') || lowerQuestion.includes('atraso')
  const hasTempoEntrega = lowerQuestion.includes('tempo') && lowerQuestion.includes('entrega') || lowerQuestion.includes('lead time') || lowerQuestion.includes('demora')
  
  // Regra anti-confusão: entrega + completo = ambíguo
  if (hasEntrega && hasCompleto) {
    return {
      kpiId: 'unknown',
      confidence: 0,
      needsClarification: true
    }
  }
  
  // Regra: prazo + tempo = precisa distinguir
  if (hasPrazo && hasTempoEntrega) {
    if (lowerQuestion.includes('no prazo') || lowerQuestion.includes('pontualidade')) {
      return { kpiId: 'otd_fornecedores', confidence: 0.9, needsClarification: false }
    }
    if (lowerQuestion.includes('quantos dias') || lowerQuestion.includes('tempo entre')) {
      return { kpiId: 'lead_time_medio', confidence: 0.9, needsClarification: false }
    }
    return {
      kpiId: 'unknown',
      confidence: 0,
      needsClarification: true
    }
  }
  
  // Regras de seleção (ordem de prioridade)
  
  // 1. OTD Fornecedores
  if (lowerQuestion.includes('prazo') || lowerQuestion.includes('pontualidade') || 
      lowerQuestion.includes('atraso') || lowerQuestion.includes('otd') ||
      (lowerQuestion.includes('entrega') && lowerQuestion.includes('no prazo'))) {
    return { kpiId: 'otd_fornecedores', confidence: 0.85, needsClarification: false }
  }
  
  // 2. Fill Rate
  if (lowerQuestion.includes('pedido incompleto') || lowerQuestion.includes('faltou') ||
      lowerQuestion.includes('corte') || lowerQuestion.includes('atendido parcialmente') ||
      lowerQuestion.includes('fill rate') || (lowerQuestion.includes('pedido') && hasCompleto)) {
    return { kpiId: 'fill_rate', confidence: 0.85, needsClarification: false }
  }
  
  // 3. Lead Time Médio
  if (lowerQuestion.includes('tempo entre pedido e entrega') || lowerQuestion.includes('demora') ||
      lowerQuestion.includes('lead time') || lowerQuestion.includes('prazo médio') ||
      (lowerQuestion.includes('tempo') && lowerQuestion.includes('entrega') && !lowerQuestion.includes('no prazo'))) {
    return { kpiId: 'lead_time_medio', confidence: 0.85, needsClarification: false }
  }
  
  // 4. Não Conformidades
  if (lowerQuestion.includes('qualidade') || lowerQuestion.includes('não conformidade') ||
      lowerQuestion.includes('problema') || lowerQuestion.includes('defeito') ||
      lowerQuestion.includes('reclamação')) {
    return { kpiId: 'nao_conformidades', confidence: 0.85, needsClarification: false }
  }
  
  // 5. Custo Total MP
  if (lowerQuestion.includes('custo total') || lowerQuestion.includes('gasto total') ||
      lowerQuestion.includes('valor gasto com mp') || lowerQuestion.includes('custo mp') ||
      (lowerQuestion.includes('custo') && lowerQuestion.includes('matéria-prima'))) {
    return { kpiId: 'custo_total_mp', confidence: 0.85, needsClarification: false }
  }
  
  // 6. Cobertura Estoque MP
  if (lowerQuestion.includes('dias de estoque') || lowerQuestion.includes('cobertura') ||
      lowerQuestion.includes('quanto dura') || lowerQuestion.includes('estoque disponível')) {
    return { kpiId: 'cobertura_estoque_mp', confidence: 0.85, needsClarification: false }
  }
  
  // Não identificado
  return {
    kpiId: 'unknown',
    confidence: 0,
    needsClarification: true
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL DO AGENTE
// ==========================================

export function agentComprasStructured(
  question: string,
  periodo: string = 'dezembro',
  filtros?: Record<string, unknown>
): StructuredResponse {
  const context = getPageContext('compras', periodo)
  
  if (!context) {
    return {
      page: 'compras',
      kpi_principal: 'unknown',
      confidence: 0,
      interpretation: 'Erro: contexto da página não disponível',
      evidence: [],
      findings: [],
      recommendations: [],
      needs_clarification: true,
      clarification_question: 'Contexto da página não disponível',
      clarification_options: []
    }
  }
  
  // Seleciona KPI principal
  const selection = selectMainKPI(question)
  
  // Se precisa clarificação
  if (selection.needsClarification) {
    const options: string[] = []
    
    if (question.toLowerCase().includes('entrega') && question.toLowerCase().includes('completo')) {
      options.push('OTD Fornecedores', 'Fill Rate')
    } else if (question.toLowerCase().includes('prazo') && question.toLowerCase().includes('tempo')) {
      options.push('OTD Fornecedores (no prazo)', 'Lead Time Médio (quantos dias)')
    } else {
      // Opções gerais
      options.push('Custo Total MP', 'OTD Fornecedores', 'Fill Rate', 'Lead Time Médio', 'Cobertura Estoque MP', 'Não Conformidades')
    }
    
    return {
      page: 'compras',
      kpi_principal: 'unknown',
      confidence: 0,
      interpretation: question,
      evidence: [],
      findings: [],
      recommendations: [],
      needs_clarification: true,
      clarification_question: selection.kpiId === 'unknown' 
        ? 'Sua pergunta pode se referir a diferentes indicadores. Qual deles você quer consultar?'
        : 'Preciso esclarecer qual indicador você quer consultar.',
      clarification_options: options
    }
  }
  
  // Encontra o KPI nos dados
  const kpiDef = KPI_CATALOG[selection.kpiId]
  const kpiIdBackend = Object.entries(ID_MAPPING).find(([_, v]) => v === selection.kpiId)?.[0] || selection.kpiId
  const kpiData = context.kpis.find(k => k.id === kpiIdBackend || k.id === selection.kpiId)
  
  // Monta resposta
  const evidence: StructuredResponse['evidence'] = []
  const findings: string[] = []
  const recommendations: StructuredResponse['recommendations'] = []
  
  if (kpiData) {
    evidence.push({
      metric: kpiDef.label,
      value: String(kpiData.value),
      unit: kpiDef.unit,
      source: 'card'
    })
    
    findings.push(`${kpiDef.label}: ${kpiData.value}${kpiDef.unit}`)
    if (kpiData.change !== undefined) {
      findings.push(`Variação: ${kpiData.change > 0 ? '+' : ''}${kpiData.change}% vs período anterior`)
    }
  }
  
  // Adiciona dados relacionados se aplicável
  if (selection.kpiId === 'otd_fornecedores' && context.rankingFornecedores.length > 0) {
    const fornecedoresBaixos = context.rankingFornecedores.filter(f => f.otd < 90)
    if (fornecedoresBaixos.length > 0) {
      fornecedoresBaixos.forEach(f => {
        evidence.push({
          metric: `${f.name} - OTD`,
          value: `${f.otd}%`,
          unit: '%',
          source: 'ranking'
        })
      })
      findings.push(`${fornecedoresBaixos.length} fornecedores com OTD abaixo de 90%`)
      recommendations.push({
        action: 'Revisar contratos e penalidades por atraso',
        priority: 'high',
        owner: 'Compras',
        requiresApproval: false
      })
    }
  }
  
  if (selection.kpiId === 'nao_conformidades' && context.rankingFornecedores.length > 0) {
    const fornecedoresBaixos = context.rankingFornecedores.filter(f => f.qualidade < 95)
    if (fornecedoresBaixos.length > 0) {
      fornecedoresBaixos.forEach(f => {
        evidence.push({
          metric: `${f.name} - Qualidade`,
          value: `${f.qualidade}%`,
          unit: '%',
          source: 'ranking'
        })
      })
      recommendations.push({
        action: 'Implementar auditorias de qualidade',
        priority: 'high',
        owner: 'Qualidade',
        requiresApproval: true
      })
    }
  }
  
  const interpretation = `Consulta sobre ${kpiDef.label.toLowerCase()}: ${kpiDef.significado}`
  
  return {
    page: 'compras',
    kpi_principal: selection.kpiId,
    confidence: selection.confidence,
    interpretation,
    evidence,
    findings,
    recommendations,
    needs_clarification: false,
    clarification_question: null,
    clarification_options: []
  }
}

