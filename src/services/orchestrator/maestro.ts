// ==========================================
// MAESTRO - ORQUESTRADOR PRINCIPAL
// ==========================================

import {
  OrchestratorResponse,
  InvestigationPlan,
  AskRequest,
  AgentType
} from './types'
import { agents } from './agents'
import {
  mapQuestionToIntention,
  getInvestigationPlan,
  intentions,
  isGenericIntention,
  type BusinessIntention
} from './intentions'
import { mapQuestionToIntentionWithLLM, llmConfig as config } from './llm-mapper'

// ==========================================
// ANÁLISE DE INTENÇÃO
// ==========================================

function analyzeIntent(question: string): {
  intent: string
  agents: AgentType[]
  context: Record<string, unknown>
} {
  const lowerQuestion = question.toLowerCase()
  const selectedAgents: AgentType[] = []
  const context: Record<string, unknown> = {}

  // Detecção de palavras-chave por área
  if (
    lowerQuestion.includes('margem') ||
    lowerQuestion.includes('custo') ||
    lowerQuestion.includes('lucro') ||
    lowerQuestion.includes('preço')
  ) {
    selectedAgents.push('custos_margem')
  }

  if (
    lowerQuestion.includes('fornecedor') ||
    lowerQuestion.includes('compra') ||
    lowerQuestion.includes('matéria-prima') ||
    lowerQuestion.includes('mp')
  ) {
    selectedAgents.push('compras_fornecedores')
    if (lowerQuestion.includes('farinha')) context.input = 'Farinha de Trigo'
    if (lowerQuestion.includes('fermento')) context.input = 'Fermento'
    if (lowerQuestion.includes('margarina')) context.input = 'Margarina'
  }

  if (
    lowerQuestion.includes('produção') ||
    lowerQuestion.includes('oee') ||
    lowerQuestion.includes('perda') ||
    lowerQuestion.includes('linha')
  ) {
    selectedAgents.push('producao')
    if (lowerQuestion.includes('linha 1')) context.line = 'Linha 1 - Francês'
    if (lowerQuestion.includes('linha 2')) context.line = 'Linha 2 - Forma'
    if (lowerQuestion.includes('linha 3')) context.line = 'Linha 3 - Doces'
  }

  if (
    lowerQuestion.includes('estoque') ||
    lowerQuestion.includes('giro') ||
    lowerQuestion.includes('cobertura') ||
    lowerQuestion.includes('acurácia') ||
    lowerQuestion.includes('acuracia') ||
    lowerQuestion.includes('inventário') ||
    lowerQuestion.includes('inventario')
  ) {
    selectedAgents.push('estoque_logistica')
    context.unit = 'estoque'
  }

  if (
    lowerQuestion.includes('entrega') ||
    lowerQuestion.includes('otif') ||
    lowerQuestion.includes('logística')
  ) {
    selectedAgents.push('estoque_logistica')
  }

  if (
    lowerQuestion.includes('faturamento') ||
    lowerQuestion.includes('receita') ||
    lowerQuestion.includes('evolução') ||
    lowerQuestion.includes('evolucao') ||
    lowerQuestion.includes('oscilação') ||
    lowerQuestion.includes('oscilacao') ||
    lowerQuestion.includes('melhor mês') ||
    lowerQuestion.includes('pior mês') ||
    lowerQuestion.includes('melhor mes') ||
    lowerQuestion.includes('pior mes')
  ) {
    selectedAgents.push('comercial')
    context.analyzeRevenue = true
  }

  if (
    lowerQuestion.includes('venda') ||
    lowerQuestion.includes('comercial') ||
    lowerQuestion.includes('cliente') ||
    lowerQuestion.includes('mix')
  ) {
    selectedAgents.push('comercial')
  }

  if (
    lowerQuestion.includes('financeiro') ||
    lowerQuestion.includes('recebimento') ||
    lowerQuestion.includes('inadimplência') ||
    lowerQuestion.includes('pmr')
  ) {
    selectedAgents.push('financeiro')
  }

  // Se nenhum agente específico, usa visão geral
  if (selectedAgents.length === 0) {
    selectedAgents.push('custos_margem', 'producao', 'comercial')
  }

  // Remove duplicatas
  const uniqueAgents = Array.from(new Set(selectedAgents))

  return {
    intent: extractIntent(question),
    agents: uniqueAgents,
    context
  }
}

function extractIntent(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('por que') || lowerQuestion.includes('motivo')) {
    return 'investigar_causa'
  }
  if (lowerQuestion.includes('onde') || lowerQuestion.includes('local')) {
    return 'localizar_problema'
  }
  if (lowerQuestion.includes('como') || lowerQuestion.includes('melhorar')) {
    return 'sugerir_acao'
  }
  if (lowerQuestion.includes('quanto') || lowerQuestion.includes('valor')) {
    return 'quantificar'
  }

  return 'analisar'
}

// ==========================================
// CRIAÇÃO DE PLANO DE INVESTIGAÇÃO
// ==========================================

function createInvestigationPlan(
  question: string,
  intent: string,
  agents: AgentType[]
): InvestigationPlan {
  const steps = agents.map((agent, index) => ({
    step: index + 1,
    agent,
    action: getAgentAction(agent, question),
    dependencies: index > 0 ? [index] : undefined
  }))

  return {
    question,
    intent,
    agents,
    steps,
    estimatedTime: agents.length * 2 // 2 segundos por agente
  }
}

function getAgentAction(agent: AgentType, question: string): string {
  const actions: Record<AgentType, string> = {
    custos_margem: 'Analisar margens e custos por produto',
    compras_fornecedores: 'Verificar performance de fornecedores e variações de preço',
    producao: 'Avaliar OEE, perdas e eficiência de produção',
    qualidade: 'Analisar indicadores de qualidade',
    estoque_logistica: 'Verificar OTIF, cobertura de estoque e logística',
    comercial: 'Analisar mix de vendas e performance comercial',
    financeiro: 'Avaliar indicadores financeiros e inadimplência',
    auditor: 'Validar dados e processos'
  }

  return actions[agent] || 'Analisar dados da área'
}

// ==========================================
// CONSOLIDAÇÃO DE RESPOSTAS
// ==========================================

function consolidateResponses(
  question: string,
  plan: InvestigationPlan,
  agentResponses: Array<Awaited<ReturnType<typeof agents[AgentType]>>>,
  intentionDef?: typeof intentions[BusinessIntention],
  llmConfidence?: number,
  fullContext?: Record<string, unknown>
): OrchestratorResponse['synthesis'] {
  // Função para verificar relevância de um finding/evidence para a intenção
  const isRelevantForIntention = (text: string, intentionId?: string): boolean => {
    if (!intentionId) return true
    
    const lowerText = text.toLowerCase()
    
    // Filtros específicos por intenção
    if (intentionId === 'analyze_revenue_trend') {
      // Para análise de receita, prioriza termos relacionados a receita/faturamento
      const revenueKeywords = ['receita', 'faturamento', 'mês', 'mes', 'melhor', 'pior', 'oscilação', 'oscilacao', 'evolução', 'evolucao', 'tendência', 'tendencia', 'média', 'media', 'variação', 'variacao']
      const irrelevantKeywords = ['margem', 'custo', 'lucro', 'preço', 'preco', 'compra', 'matéria', 'materia', 'fornecedor']
      
      // Se contém termos de compras/matérias-primas, não é receita
      if (lowerText.includes('compra') || lowerText.includes('matéria') || lowerText.includes('materia') || lowerText.includes('fornecedor')) return false
      
      // Se contém termos irrelevantes E não contém termos relevantes, é irrelevante
      const hasIrrelevant = irrelevantKeywords.some(kw => lowerText.includes(kw))
      const hasRelevant = revenueKeywords.some(kw => lowerText.includes(kw))
      
      // Se tem termos irrelevantes mas não tem relevantes, filtra
      if (hasIrrelevant && !hasRelevant) return false
      
      // Prioriza se tem termos relevantes
      return true
    }
    
    if (intentionId === 'analyze_margin_decline') {
      const marginKeywords = ['margem', 'custo', 'lucro', 'preço', 'preco']
      return marginKeywords.some(kw => lowerText.includes(kw))
    }
    
    if (intentionId === 'analyze_logistics_cost') {
      const routeKeywords = ['rota', 'rotas', 'entrega', 'custo', 'eficiência', 'eficiencia', 'viável', 'viavel', 'veículo', 'veiculos']
      const irrelevantKeywords = ['margem', 'produto', 'cliente']
      
      const hasIrrelevant = irrelevantKeywords.some(kw => lowerText.includes(kw))
      const hasRelevant = routeKeywords.some(kw => lowerText.includes(kw))
      
      if (hasIrrelevant && !hasRelevant) return false
      return true
    }
    
    if (intentionId === 'analyze_supplier_performance') {
      const purchaseKeywords = ['compra', 'matéria', 'materia', 'fornecedor', 'preço', 'preco', 'variação', 'variacao', 'sazonalidade', 'sazonal']
      const irrelevantKeywords = ['faturamento', 'receita', 'venda']
      
      const hasIrrelevant = irrelevantKeywords.some(kw => lowerText.includes(kw))
      const hasRelevant = purchaseKeywords.some(kw => lowerText.includes(kw))
      
      if (hasIrrelevant && !hasRelevant) return false
      return true
    }
    
    // Para outras intenções, aceita tudo
    return true
  }

  // Extrai causas, filtrando por relevância à intenção
  const allCauses = agentResponses.flatMap(ar => ar.findings)
    .filter(finding => isRelevantForIntention(finding, intentionDef?.id))
  
  // Se não há causas relevantes, usa todas (fallback)
  const relevantCauses = allCauses.length > 0 ? allCauses : agentResponses.flatMap(ar => ar.findings)
  
  let topCauses = relevantCauses
    .slice(0, 3)
    .map((cause, idx) => ({
      cause,
      confidence: 85 - idx * 10,
      evidence: agentResponses
        .flatMap(ar => ar.evidence)
        .filter(e => {
          const eText = `${e.metric} ${e.value}`.toLowerCase()
          return eText.includes(cause.toLowerCase().substring(0, 5)) && 
                 isRelevantForIntention(eText, intentionDef?.id)
        })
        .map(e => `${e.metric}: ${e.value}`)
    }))

  // Extrai evidências numéricas, priorizando as relevantes à intenção
  const allEvidence = agentResponses.flatMap(ar => ar.evidence)
  const relevantEvidence = allEvidence.filter(e => {
    const eText = `${e.metric} ${e.value}`.toLowerCase()
    return isRelevantForIntention(eText, intentionDef?.id)
  })
  
  // Prioriza evidências relevantes, depois adiciona outras se necessário
  const prioritizedEvidence = [
    ...relevantEvidence,
    ...allEvidence.filter(e => !relevantEvidence.includes(e))
  ].slice(0, 5)
    .map(e => ({
      metric: e.metric,
      value: e.value,
      unit: typeof e.value === 'number' && e.value < 100 ? '%' : undefined,
      context: e.comparison || 'Dados do período'
    }))

  // VALIDAÇÃO DE EVIDÊNCIA MÍNIMA: Não retorna causas se não houver evidências suficientes
  const MIN_EVIDENCE_REQUIRED = 2
  const hasMinimumEvidence = prioritizedEvidence.length >= MIN_EVIDENCE_REQUIRED
  
  // Se intenção genérica e não há evidências suficientes, ajusta resposta
  if (intentionDef && isGenericIntention(intentionDef.id) && !hasMinimumEvidence) {
    // Limita causas e adiciona limitação
    if (topCauses.length > 0 && prioritizedEvidence.length < MIN_EVIDENCE_REQUIRED) {
      topCauses = [] // Não inventa causas sem evidência
    }
  }

  // Extrai ações sugeridas (filtradas por relevância)
  const allActions = agentResponses.flatMap(ar => ar.recommendations)
  const relevantActions = allActions.filter(action => 
    isRelevantForIntention(action, intentionDef?.id)
  )
  const prioritizedActions: OrchestratorResponse['synthesis']['suggestedActions'] = [
    ...relevantActions,
    ...allActions.filter(a => !relevantActions.includes(a))
  ].slice(0, 5)
    .map((action, idx) => {
      // Mapeia ação para owner sugerido baseado em palavras-chave
      const owner = inferOwnerFromAction(action, intentionDef)
      const priority: 'high' | 'medium' | 'low' = idx < 2 ? 'high' : idx < 4 ? 'medium' : 'low'
      
      return {
        action,
        priority,
        estimatedImpact: inferImpactFromAction(action),
        owner,
        requiresApproval: true // Sempre requer aprovação humana
      }
    })

  // Gera links de validação baseado na intenção (com deep links)
  // Usa fullContext para gerar query parameters
  const validationLinks = generateValidationLinks(intentionDef, fullContext)

  // Limitações
  const dataLimitations = agentResponses
    .flatMap(ar => ar.limitations || [])
    .filter((v, i, a) => a.indexOf(v) === i)

  // Adiciona limitação se não há evidências suficientes
  if (!hasMinimumEvidence) {
    dataLimitations.push('Evidências numéricas insuficientes para conclusão definitiva')
  }

  // Se intenção genérica e confiança baixa, adiciona limitação
  if (intentionDef && isGenericIntention(intentionDef.id) && llmConfidence && llmConfidence < 0.6) {
    dataLimitations.push('Confiança baixa no mapeamento da intenção. Considere ser mais específico na pergunta.')
  }

  // Se intenção genérica e confiança baixa, adiciona limitação
  if (intentionDef && isGenericIntention(intentionDef.id) && llmConfidence && llmConfidence < 0.6) {
    dataLimitations.push('Confiança baixa no mapeamento da intenção. Considere ser mais específico na pergunta.')
  }

  // Síntese executiva
  const executive = generateExecutiveSummary(question, topCauses, prioritizedEvidence, intentionDef, hasMinimumEvidence)

  return {
    executive,
    topCauses,
    numericalEvidence: prioritizedEvidence,
    suggestedActions: prioritizedActions,
    validationLinks,
    dataLimitations
  }
}

// ==========================================
// FUNÇÕES AUXILIARES DE CONFIANÇA
// ==========================================

function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 80) return 'high'
  if (confidence >= 60) return 'medium'
  return 'low'
}

function formatConfidenceMessage(confidence: number): string {
  const level = getConfidenceLevel(confidence)
  if (level === 'high') {
    return 'Análise com alta confiança'
  } else if (level === 'medium') {
    return 'Análise com confiança moderada'
  } else {
    return 'Análise preliminar - dados limitados'
  }
}

// ==========================================
// EXPORT DE FUNÇÕES AUXILIARES
// ==========================================

export { getConfidenceLevel, formatConfidenceMessage }

function generateExecutiveSummary(
  question: string,
  topCauses: OrchestratorResponse['synthesis']['topCauses'],
  evidence: OrchestratorResponse['synthesis']['numericalEvidence'],
  intentionDef?: typeof intentions[BusinessIntention],
  hasMinimumEvidence: boolean = true
): string {
  // Se não há evidências suficientes, retorna mensagem apropriada
  if (!hasMinimumEvidence) {
    return `Análise preliminar da questão "${question}" não identificou evidências numéricas suficientes para determinar causas. Considere ser mais específico na pergunta ou fornecer mais contexto.`
  }

  if (topCauses.length === 0) {
    return `Análise da questão "${question}" não identificou desvios significativos nos indicadores analisados.`
  }

  const mainCause = topCauses[0]
  const mainEvidence = evidence[0]
  
  // Resumo específico para análise de receita/faturamento
  if (intentionDef?.id === 'analyze_revenue_trend') {
    // Busca evidências específicas de receita
    const bestMonth = evidence.find(e => e.metric.toLowerCase().includes('melhor') && e.metric.toLowerCase().includes('mês'))
    const worstMonth = evidence.find(e => e.metric.toLowerCase().includes('pior') && e.metric.toLowerCase().includes('mês'))
    const oscillation = evidence.find(e => e.metric.toLowerCase().includes('oscilação') || e.metric.toLowerCase().includes('oscilacao'))
    const average = evidence.find(e => e.metric.toLowerCase().includes('média') || e.metric.toLowerCase().includes('media'))
    
    if (bestMonth || worstMonth || oscillation) {
      const parts: string[] = []
      if (bestMonth) parts.push(`Melhor mês: ${bestMonth.metric} ${bestMonth.value}`)
      if (worstMonth) parts.push(`Pior mês: ${worstMonth.metric} ${worstMonth.value}`)
      if (oscillation) parts.push(`Oscilação: ${oscillation.value}`)
      if (average) parts.push(`Média mensal: ${average.value}`)
      
      return `Análise do faturamento mensal (evolução anual): ${parts.join('. ')}.`
    }
    
    // Fallback: usa primeira evidência relevante
    const revenueEvidence = evidence.find(e => {
      const m = e.metric.toLowerCase()
      return m.includes('mês') || m.includes('mes') || m.includes('oscilação') || 
             m.includes('oscilacao') || m.includes('receita') || m.includes('faturamento')
    })
    
    if (revenueEvidence) {
      return `Análise do faturamento mensal: ${revenueEvidence.metric} ${revenueEvidence.value}${revenueEvidence.unit || ''}. ${mainCause.cause}.`
    }
  }
  
  // Resumo específico para análise de custo logístico/rotas
  if (intentionDef?.id === 'analyze_logistics_cost') {
    const equilibriumPoint = topCauses.find(c => c.cause.toLowerCase().includes('equilíbrio') || c.cause.toLowerCase().includes('equilibrio') || c.cause.toLowerCase().includes('ponto'))
    const avgCost = evidence.find(e => e.metric.toLowerCase().includes('custo médio') || e.metric.toLowerCase().includes('custo medio') || e.metric.toLowerCase().includes('equilíbrio') || e.metric.toLowerCase().includes('equilibrio'))
    const bestRoute = evidence.find(e => e.metric.toLowerCase().includes('melhor rota') || e.metric.toLowerCase().includes('rota 1'))
    const worstRoute = evidence.find(e => e.metric.toLowerCase().includes('pior rota') || e.metric.toLowerCase().includes('rota 2'))
    
    // Se é pergunta sobre ponto de equilíbrio, prioriza essa informação
    if (equilibriumPoint || (question.toLowerCase().includes('equilíbrio') || question.toLowerCase().includes('equilibrio'))) {
      if (avgCost) {
        return `Ponto de equilíbrio entre rotas: ${avgCost.value} por entrega. ${topCauses.length > 0 ? topCauses[0].cause : ''}`
      }
      if (equilibriumPoint) {
        return `Análise de ponto de equilíbrio: ${equilibriumPoint.cause}. Custo médio de todas as rotas.`
      }
    }
    
    if (bestRoute || worstRoute || avgCost) {
      const parts: string[] = []
      if (bestRoute) parts.push(`Melhor rota: ${bestRoute.metric.split(':')[0]} com ${bestRoute.value}`)
      if (worstRoute) parts.push(`Pior rota: ${worstRoute.metric.split(':')[0]} com ${worstRoute.value}`)
      if (avgCost) parts.push(`Custo médio: ${avgCost.value}`)
      
      return `Análise de custo logístico por rota: ${parts.join('. ')}.`
    }
  }

  // Resumo genérico para outras intenções
  return `Análise identificou ${topCauses.length} ${topCauses.length === 1 ? 'causa principal' : 'causas principais'}. ${mainCause.cause}. ${mainEvidence ? `Evidência: ${mainEvidence.metric} ${mainEvidence.value}${mainEvidence.unit || ''}.` : ''}`
}

function generateValidationLinks(
  intentionDef?: typeof intentions[BusinessIntention],
  context?: Record<string, unknown>
): Array<{ label: string; path: string; kpi?: string }> {
  if (!intentionDef) {
    return [
      generateDeepLink('Visão Geral', '/', 'margem', context),
      generateDeepLink('Comercial', '/comercial', 'faturamento', context)
    ]
  }

  const links: Array<{ label: string; path: string; kpi?: string }> = []
  
  if (intentionDef.agents.includes('comercial')) {
    links.push(generateDeepLink('Comercial', '/comercial', 'faturamento', context))
  }
  if (intentionDef.agents.includes('producao')) {
    links.push(generateDeepLink('Produção', '/producao', 'oee', context))
  }
  if (intentionDef.agents.includes('custos_margem')) {
    links.push(generateDeepLink('Financeiro', '/financeiro', 'margem_bruta', context))
  }
  if (intentionDef.agents.includes('estoque_logistica')) {
    if (intentionDef.id === 'analyze_logistics_cost') {
      links.push(generateDeepLink('Logística', '/logistica', 'custo_entrega', context))
    } else if (intentionDef.id === 'analyze_delivery_performance') {
      links.push(generateDeepLink('Logística', '/logistica', 'otif', context))
    } else {
      links.push(generateDeepLink('Estoque', '/estoque', 'acuracia', context))
    }
  }
  if (intentionDef.agents.includes('compras_fornecedores')) {
    links.push(generateDeepLink('Compras', '/compras', 'otd', context))
  }

  return links.length > 0 ? links : [generateDeepLink('Visão Geral', '/', 'margem', context)]
}

// ==========================================
// GERAÇÃO DE DEEP LINKS COM QUERY PARAMETERS
// ==========================================

function generateDeepLink(
  label: string,
  path: string,
  kpi?: string,
  context?: Record<string, unknown>
): { label: string; path: string; kpi?: string } {
  const params = new URLSearchParams()
  
  if (kpi) {
    params.set('focus', kpi)
  }
  
  // Adiciona parâmetros do contexto
  if (context?.periodo) {
    params.set('period', String(context.periodo))
  } else if (context?.period) {
    params.set('period', String(context.period))
  }
  
  if (context?.produto) {
    params.set('produto', String(context.produto))
  }
  
  if (context?.line || context?.linha) {
    params.set('line', String(context.line || context.linha))
  }
  
  if (context?.fornecedor) {
    params.set('fornecedor', String(context.fornecedor))
  }
  
  // Constrói path com query params
  const queryString = params.toString()
  const fullPath = queryString ? `${path}?${queryString}` : path
  
  return {
    label,
    path: fullPath,
    kpi
  }
}

// ==========================================
// FUNÇÕES AUXILIARES PARA AÇÕES
// ==========================================

function inferOwnerFromAction(action: string, intentionDef?: typeof intentions[BusinessIntention]): string | undefined {
  const lowerAction = action.toLowerCase()
  
  // Mapeia por palavras-chave na ação
  if (lowerAction.includes('fornecedor') || lowerAction.includes('compra') || lowerAction.includes('matéria-prima') || lowerAction.includes('materia-prima')) {
    return 'Compras'
  }
  if (lowerAction.includes('venda') || lowerAction.includes('mix') || lowerAction.includes('cliente') || lowerAction.includes('comercial')) {
    return 'Comercial'
  }
  if (lowerAction.includes('produção') || lowerAction.includes('producao') || lowerAction.includes('linha') || lowerAction.includes('oee') || lowerAction.includes('perda')) {
    return 'Produção'
  }
  if (lowerAction.includes('estoque') || lowerAction.includes('logística') || lowerAction.includes('logistica') || lowerAction.includes('entrega') || lowerAction.includes('otif')) {
    return 'Logística'
  }
  if (lowerAction.includes('financeiro') || lowerAction.includes('margem') || lowerAction.includes('custo') || lowerAction.includes('recebimento')) {
    return 'Financeiro'
  }
  
  // Se não encontrou, tenta inferir pela intenção
  if (intentionDef) {
    if (intentionDef.agents.includes('compras_fornecedores')) return 'Compras'
    if (intentionDef.agents.includes('comercial')) return 'Comercial'
    if (intentionDef.agents.includes('producao')) return 'Produção'
    if (intentionDef.agents.includes('estoque_logistica')) return 'Logística'
    if (intentionDef.agents.includes('financeiro')) return 'Financeiro'
  }
  
  return undefined
}

function inferImpactFromAction(action: string): string | undefined {
  const lowerAction = action.toLowerCase()
  
  // Tenta inferir impacto baseado em palavras-chave
  if (lowerAction.includes('redução') || lowerAction.includes('reducao') || lowerAction.includes('reduzir')) {
    if (lowerAction.includes('custo')) {
      return 'Redução potencial de custos'
    }
    if (lowerAction.includes('perda')) {
      return 'Redução potencial de perdas'
    }
  }
  if (lowerAction.includes('aumento') || lowerAction.includes('melhorar') || lowerAction.includes('otimizar')) {
    if (lowerAction.includes('margem')) {
      return 'Aumento potencial de margem'
    }
    if (lowerAction.includes('eficiência') || lowerAction.includes('eficiencia')) {
      return 'Melhoria potencial de eficiência'
    }
  }
  
  return undefined
}

// ==========================================
// FUNÇÃO PRINCIPAL: ORQUESTRAR
// ==========================================

// ==========================================
// BUDGET POR REQUEST (PROTEÇÃO DE CUSTO/LATÊNCIA)
// ==========================================

const MAX_AGENTS_PER_REQUEST = 3
const MAX_FUNCTIONS_TOTAL = 8
const GLOBAL_TIMEOUT_MS = 4000 // 4 segundos
const FUNCTION_TIMEOUT_MS = 800 // 800ms por função

export async function orchestrate(request: AskRequest): Promise<OrchestratorResponse> {
  const startTime = Date.now()
  const id = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Timeout global
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), GLOBAL_TIMEOUT_MS)

  try {
    // 1. MAPEAR PERGUNTA → INTENÇÃO + ENTIDADES (LLM apenas mapeia, não decide)
    const context = request.context || {}
    const mappingResult = await mapQuestionToIntentionWithLLM(request.question, context)
    
    // Log de debug (apenas em desenvolvimento)
    const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development'
    if (isDev) {
      console.log('🎯 Intenção mapeada:', {
        intent: mappingResult.intent,
        confidence: mappingResult.confidence,
        entities: mappingResult.entities,
        question: request.question.substring(0, 80)
      })
    }
    
    // 1.1. NORMALIZAÇÃO E SANITIZAÇÃO DE ENTIDADES (CRÍTICO)
    const { normalizeEntities } = await import('./entity-normalizer')
    const normalizationResult = normalizeEntities(mappingResult.entities)
    
    // Aplica penalidade de confiança se entidades inválidas
    let adjustedConfidence = mappingResult.confidence - normalizationResult.confidencePenalty
    adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence))
    
    if (normalizationResult.warnings.length > 0 && isDev) {
      console.warn('⚠️ Entidades normalizadas:', normalizationResult.warnings)
    }
    
    // 2. ORQUESTRADOR DECIDE: Usa intenção + entidades para criar plano
    const businessIntention = mappingResult.intent
    const intentionDef = intentions[businessIntention]
    
    // 2.1. REGRA DE CONFIANÇA BAIXA: Se intenção genérica e confiança < 60%, pede esclarecimento
    if (isGenericIntention(businessIntention) && adjustedConfidence < 0.6) {
      if (isDev) {
        console.warn('⚠️ Confiança baixa para intenção genérica:', {
          intent: businessIntention,
          confidence: adjustedConfidence
        })
      }
    }
    
    // Merge entidades normalizadas com contexto
    const fullContext = { ...context, ...normalizationResult.entities }

    // 3. ORQUESTRADOR DECIDE: Cria plano baseado na intenção (não o LLM)
    const investigationSteps = getInvestigationPlan(businessIntention, request.question, fullContext)
    
    // 3.1. BUDGET: Limita número de funções
    if (investigationSteps.length > MAX_FUNCTIONS_TOTAL) {
      const error = new Error(
        `Plano excede limite de funções. Máximo: ${MAX_FUNCTIONS_TOTAL}, encontrado: ${investigationSteps.length}`
      )
      console.error('🚫 Violação de budget:', error.message)
      throw error
    }
    
    // 3.2. VALIDAÇÃO DE ALLOWLIST: Verifica se todas as funções são permitidas
    const allowedFunctions = [
      ...intentionDef.requiredFunctions,
      ...intentionDef.optionalFunctions
    ]
    
    for (const step of investigationSteps) {
      if (!allowedFunctions.includes(step.function)) {
        const error = new Error(
          `Função ${step.function} não permitida para intenção ${businessIntention}. ` +
          `Funções permitidas: ${allowedFunctions.join(', ')}`
        )
        console.error('🚫 Violação de allowlist:', error.message)
        throw error
      }
    }
    
    // Extrai agentes únicos do plano
    const selectedAgents = Array.from(new Set(investigationSteps.map(s => s.agent))) as AgentType[]
    
    // 3.3. BUDGET: Limita número de agentes
    if (selectedAgents.length > MAX_AGENTS_PER_REQUEST) {
      const error = new Error(
        `Plano excede limite de agentes. Máximo: ${MAX_AGENTS_PER_REQUEST}, encontrado: ${selectedAgents.length}`
      )
      console.error('🚫 Violação de budget (agentes):', error.message)
      throw error
    }
  
    // 4. ORQUESTRADOR DECIDE: Executa plano pré-definido (agentes não decidem)
    // Com timeout por função
    const agentPromises = selectedAgents.map(agentType => {
      return Promise.race([
        agents[agentType](request.question, { ...fullContext, intention: businessIntention }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: agente ${agentType} excedeu ${FUNCTION_TIMEOUT_MS}ms`)), FUNCTION_TIMEOUT_MS)
        )
      ])
    })
    
    const agentResponses = await Promise.all(agentPromises) as Array<Awaited<ReturnType<typeof agents[AgentType]>>>

    // 5. ORQUESTRADOR DECIDE: Cria plano estruturado para resposta
    const plan: InvestigationPlan = {
      question: request.question,
      intent: businessIntention,
      agents: selectedAgents,
      steps: investigationSteps.map(s => ({
        step: s.step,
        agent: s.agent,
        action: s.description,
        dependencies: s.dependencies
      })),
      estimatedTime: investigationSteps.length * 2
    }

    // 6. ORQUESTRADOR DECIDE: Consolida respostas (respeitando estrutura da intenção)
    // Adiciona warnings de normalização às limitações
    const synthesis = consolidateResponses(
      request.question, 
      plan, 
      agentResponses, 
      intentionDef, 
      adjustedConfidence, 
      fullContext
    )
    
    // Adiciona warnings de normalização
    if (normalizationResult.warnings.length > 0) {
      synthesis.dataLimitations.push(...normalizationResult.warnings)
    }

    // 7. ORQUESTRADOR DECIDE: Calcula confiança (usa confiança ajustada + qualidade das respostas)
    const confidence = calculateConfidence(agentResponses, businessIntention, intentionDef, adjustedConfidence)

    // 8. REGISTRAR AUDITORIA (todas as decisões e funções chamadas)
    const duration = Date.now() - startTime
    clearTimeout(timeoutId)
    
    const audit = {
      functionsCalled: investigationSteps.map(s => ({
        function: s.function,
        parameters: s.parameters,
        timestamp: new Date().toISOString()
      })),
      duration,
      cost: investigationSteps.length * 0.001,
      mapping: {
        intent: businessIntention,
        confidence: adjustedConfidence,
        entities: normalizationResult.entities,
        provider: 'groq', // Provider do LLM (pode vir de config se necessário)
        normalizationWarnings: normalizationResult.warnings.length
      },
      budget: {
        agentsUsed: selectedAgents.length,
        maxAgents: MAX_AGENTS_PER_REQUEST,
        functionsUsed: investigationSteps.length,
        maxFunctions: MAX_FUNCTIONS_TOTAL
      }
    }

    return {
      id,
      timestamp: new Date().toISOString(),
      question: request.question,
      plan,
      synthesis,
      agentResponses,
      confidence,
      audit
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout global: orquestração excedeu ${GLOBAL_TIMEOUT_MS}ms`)
    }
    
    throw error
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function calculateConfidence(
  agentResponses: Array<Awaited<ReturnType<typeof agents[AgentType]>>>,
  intention: BusinessIntention,
  intentionDef: typeof intentions[BusinessIntention],
  llmConfidence?: number
): number {
  // ORQUESTRADOR DECIDE: Calcula confiança combinando:
  // 1. Confiança do mapeamento LLM (se disponível)
  // 2. Qualidade das respostas dos agentes
  // 3. Se todas as funções requeridas foram executadas
  
  const avgAgentConfidence = agentResponses.reduce((sum, ar) => sum + ar.confidence, 0) / agentResponses.length
  
  // Peso: 40% LLM mapping, 60% qualidade dos agentes
  const llmWeight = llmConfidence ? 0.4 : 0
  const agentWeight = 1 - llmWeight
  
  let baseConfidence = avgAgentConfidence * agentWeight
  if (llmConfidence) {
    baseConfidence += (llmConfidence * 100) * llmWeight
  }
  
  // Bonus se intenção específica (não genérica)
  const intentionBonus = isGenericIntention(intention) ? 0 : 10
  
  // Penalidade se faltam evidências
  const totalEvidence = agentResponses.reduce((sum, ar) => sum + ar.evidence.length, 0)
  const evidencePenalty = totalEvidence < 2 ? -15 : (totalEvidence < 4 ? -5 : 0)
  
  // Penaliza intenções genéricas (reduz 10%)
  const genericPenalty = isGenericIntention(intention) ? -10 : 0
  
  return Math.min(100, Math.max(0, Math.round(baseConfidence + intentionBonus + evidencePenalty + genericPenalty)))
}

