// ==========================================
// TIPOS E CONTRATOS - ORQUESTRA DE AGENTES
// ==========================================

// Tipos de Agentes
export type AgentType = 
  | 'custos_margem'
  | 'compras_fornecedores'
  | 'producao'
  | 'qualidade'
  | 'estoque_logistica'
  | 'comercial'
  | 'financeiro'
  | 'auditor'

// Severidade de Alertas
export type Severity = 'P0' | 'P1' | 'P2'

// Status de Caso
export type CaseStatus = 'aberto' | 'em_investigacao' | 'validado' | 'resolvido'

// Trend
export type Trend = 'up' | 'down' | 'neutral'

// ==========================================
// CONTRATOS DE DADOS (Funções Semânticas)
// ==========================================

export interface KPIsOverview {
  period: string
  unit?: string
  line?: string
  kpis: Array<{
    id: string
    label: string
    value: number
    unit: string
    change?: number
    trend: Trend
  }>
}

export interface MarginByProduct {
  period: string
  products: Array<{
    name: string
    margin: number
    revenue: number
    cost: number
    change?: number
  }>
}

export interface CostBreakdown {
  product: string
  period: string
  breakdown: Array<{
    category: string
    value: number
    percent: number
  }>
  total: number
}

export interface LossesByLine {
  period: string
  lines: Array<{
    line: string
    losses: number
    percent: number
    causes: Array<{
      cause: string
      value: number
    }>
  }>
}

export interface OEE {
  line: string
  period: string
  oee: number
  availability: number
  performance: number
  quality: number
  trend: Trend
}

export interface SupplierVariation {
  input: string
  period: string
  suppliers: Array<{
    name: string
    price: number
    variation: number
    otd: number
    quality: number
  }>
}

export interface StockCoverage {
  product: string
  period: string
  coverage: number // dias
  stock: number
  value: number
  trend: Trend
}

export interface OTIF {
  period: string
  otif: number
  onTime: number
  inFull: number
  trend: Trend
}

export interface SalesMix {
  period: string
  channel?: string
  mix: Array<{
    product: string
    actual: number
    ideal: number
    margin: number
  }>
}

export interface RouteCost {
  period: string
  routes: Array<{
    name: string
    cost: number
    deliveries: number
    costPerDelivery: number
    km: number
    costPerKm: number
  }>
  summary: {
    totalCost: number
    totalDeliveries: number
    averageCostPerDelivery: number
    averageCostPerKm: number
    bestRoute: { name: string; costPerDelivery: number }
    worstRoute: { name: string; costPerDelivery: number }
  }
}

export interface VehiclePerformance {
  period: string
  vehicles: Array<{
    name: string
    deliveries: number
    capacity: number
    cost: number
    km: number
    efficiency: number // entregas/km ou similar
  }>
  summary: {
    totalVehicles: number
    averageEfficiency: number
    bestVehicle: { name: string; efficiency: number }
    worstVehicle: { name: string; efficiency: number }
  }
}

// ==========================================
// RESPOSTAS DE AGENTES
// ==========================================

export interface AgentResponse {
  agent: AgentType
  confidence: number // 0-100
  findings: string[]
  evidence: Array<{
    metric: string
    value: number | string
    comparison?: string
    source: string
  }>
  recommendations: string[]
  limitations?: string[]
  // Informações de pensamento (para UI)
  thoughtProcess?: {
    kpiPrincipal?: string // ID do KPI principal selecionado
    area?: string // Área/página analisada
    dataSource?: 'card' | 'tabela' | 'grafico' | 'ranking' | 'page_context'
    kpiConfidence?: number // Confiança do KPI selection (0-100)
  }
}

// ==========================================
// PLANO DE INVESTIGAÇÃO
// ==========================================

export interface InvestigationPlan {
  question: string
  intent: string
  agents: AgentType[]
  steps: Array<{
    step: number
    agent: AgentType
    action: string
    dependencies?: number[]
  }>
  estimatedTime: number // segundos
}

// ==========================================
// RESPOSTA DO MAESTRO
// ==========================================

export interface OrchestratorResponse {
  id: string
  timestamp: string
  question: string
  plan: InvestigationPlan
  synthesis: {
    executive: string
    topCauses: Array<{
      cause: string
      confidence: number
      evidence: string[]
    }>
    numericalEvidence: Array<{
      metric: string
      value: number | string
      unit?: string
      context: string
    }>
    suggestedActions: Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      estimatedImpact?: string
      owner?: string // Responsável sugerido (ex: "Compras", "Comercial")
      requiresApproval: boolean // Sempre true - nunca executar automaticamente
    }>
    validationLinks: Array<{
      label: string
      path: string
      kpi?: string
    }>
    dataLimitations: string[]
    // Informações de pensamento (para UI)
    thoughtProcess?: {
      kpiPrincipal?: string // ID do KPI principal
      area?: string // Área analisada
      dataSource?: string
      kpiConfidence?: number // Confiança do KPI selection (para banner)
    }
  }
  agentResponses: AgentResponse[]
  confidence: number
  audit: {
    functionsCalled: Array<{
      function: string
      parameters: Record<string, unknown>
      timestamp: string
    }>
    duration: number
    cost: number
  }
}

// ==========================================
// ALERTA INTELIGENTE
// ==========================================

export interface IntelligentAlert {
  id: string
  timestamp: string
  severity: Severity
  indicator: {
    id: string
    label: string
    area: string
  }
  variation: {
    current: number
    previous: number
    change: number
    unit: string
  }
  impact: {
    estimated: string
    financial?: number
    operational?: string
  }
  probableCause: string
  confidence: number
  status: 'new' | 'investigating' | 'acknowledged' | 'resolved'
  investigationId?: string
  // Anti-ruído
  snoozedUntil?: string // Usuário silenciou até esta data
  acknowledgedBy?: string // Usuário que reconheceu
  acknowledgedAt?: string
  dataQuality?: 'complete' | 'incomplete' | 'suspicious' // Qualidade do dado
  lastAlertTimestamp?: string // Timestamp do último alerta similar (para cooldown)
}

// ==========================================
// CASO OPERACIONAL
// ==========================================

export interface OperationalCase {
  id: string
  title: string
  timestamp: string
  status: CaseStatus
  source: 'alert' | 'manual' | 'routine'
  hypotheses: Array<{
    id: string
    hypothesis: string
    confidence: number
    status: 'pending' | 'confirmed' | 'rejected'
    evidence: string[]
  }>
  dataConsulted: Array<{
    function: string
    parameters: Record<string, unknown>
    timestamp: string
    result: unknown
  }>
  evidence: Array<{
    id: string
    type: 'metric' | 'trend' | 'comparison'
    description: string
    value: number | string
    source: string
  }>
  validationChecklist: Array<{
    id: string
    item: string
    checked: boolean
    checkedBy?: string
    checkedAt?: string
  }>
  orchestratorResponse?: OrchestratorResponse
}

// ==========================================
// REQUISIÇÕES
// ==========================================

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface AskRequest {
  question: string
  context?: {
    area?: string
    period?: string
    kpi?: string
  }
  conversationHistory?: ConversationMessage[]
}

export interface ValidateCaseRequest {
  caseId: string
  hypothesisId?: string
  validated: boolean
  notes?: string
}

