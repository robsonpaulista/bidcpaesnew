// ==========================================
// INTENÇÕES DE NEGÓCIO
// ==========================================
// Define intenções claras e mapeia para planos de investigação

import { AgentType } from './types'

// ==========================================
// TIPOS DE INTENÇÕES
// ==========================================

export type BusinessIntention = 
  | 'analyze_revenue_trend'
  | 'analyze_margin_decline'
  | 'analyze_losses'
  | 'analyze_supplier_performance'
  | 'analyze_production_efficiency'
  | 'analyze_stock_accuracy'
  | 'analyze_delivery_performance'
  | 'analyze_logistics_cost'
  | 'analyze_sales_mix'
  | 'analyze_financial_health'
  | 'analyze_customer_metrics'
  | 'compare_periods'
  | 'identify_root_cause'
  | 'suggest_improvements'
  | 'general_overview'

// ==========================================
// DEFINIÇÃO DE INTENÇÕES
// ==========================================

export interface IntentionDefinition {
  id: BusinessIntention
  name: string
  description: string
  keywords: string[] // Palavras-chave para detecção inicial
  agents: AgentType[]
  requiredFunctions: string[]
  optionalFunctions: string[]
  expectedOutput: {
    findings: boolean
    evidence: boolean
    recommendations: boolean
    comparisons?: boolean
  }
}

export const intentions: Record<BusinessIntention, IntentionDefinition> = {
  analyze_revenue_trend: {
    id: 'analyze_revenue_trend',
    name: 'Analisar Tendência de Receita',
    description: 'Analisa evolução, oscilação, melhor/pior mês do faturamento, sazonalidade',
    keywords: ['faturamento', 'receita', 'evolução', 'oscilação', 'melhor mês', 'pior mês', 'tendência'],
    agents: ['comercial'],
    requiredFunctions: ['get_revenue_monthly', 'get_kpis_overview'],
    optionalFunctions: ['get_sales_mix'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true,
      comparisons: true
    }
  },
  analyze_margin_decline: {
    id: 'analyze_margin_decline',
    name: 'Analisar Queda de Margem',
    description: 'Investiga causas de redução de margem (custos, preços, mix)',
    keywords: ['margem', 'lucro', 'custo', 'queda', 'redução', 'declínio'],
    agents: ['custos_margem', 'comercial'],
    requiredFunctions: ['get_margin_by_product', 'get_cost_breakdown', 'get_kpis_overview'],
    optionalFunctions: ['get_sales_mix'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true,
      comparisons: true
    }
  },
  analyze_losses: {
    id: 'analyze_losses',
    name: 'Analisar Perdas',
    description: 'Identifica onde e por que ocorrem perdas (produção, estoque, logística)',
    keywords: ['perda', 'perdas', 'refugo', 'avaria', 'desperdício'],
    agents: ['producao', 'estoque_logistica'],
    requiredFunctions: ['get_losses_by_line', 'get_kpis_overview'],
    optionalFunctions: ['get_oee'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_supplier_performance: {
    id: 'analyze_supplier_performance',
    name: 'Analisar Performance de Fornecedores',
    description: 'Avalia OTD, qualidade, variação de preços dos fornecedores, sazonalidade de compras',
    keywords: ['fornecedor', 'otd', 'qualidade', 'preço', 'variação', 'compra', 'matéria-prima', 'materia-prima', 'sazonalidade', 'sazonal'],
    agents: ['compras_fornecedores'],
    requiredFunctions: ['get_supplier_variation', 'get_kpis_overview'],
    optionalFunctions: ['get_raw_material_seasonality'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_production_efficiency: {
    id: 'analyze_production_efficiency',
    name: 'Analisar Eficiência de Produção',
    description: 'Avalia OEE, disponibilidade, performance, qualidade das linhas',
    keywords: ['oee', 'eficiência', 'produção', 'linha', 'disponibilidade', 'performance'],
    agents: ['producao'],
    requiredFunctions: ['get_oee', 'get_kpis_overview'],
    optionalFunctions: ['get_losses_by_line'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_stock_accuracy: {
    id: 'analyze_stock_accuracy',
    name: 'Analisar Acurácia de Estoque',
    description: 'Avalia precisão do inventário, divergências, giro',
    keywords: ['acurácia', 'acuracia', 'estoque', 'inventário', 'inventario', 'giro'],
    agents: ['estoque_logistica'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: ['get_stock_coverage'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_delivery_performance: {
    id: 'analyze_delivery_performance',
    name: 'Analisar Performance de Entrega',
    description: 'Avalia OTIF, atrasos, devoluções',
    keywords: ['otif', 'entrega', 'logística', 'prazo', 'devolução', 'reentrega'],
    agents: ['estoque_logistica'],
    requiredFunctions: ['get_otif', 'get_kpis_overview'],
    optionalFunctions: [],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_logistics_cost: {
    id: 'analyze_logistics_cost',
    name: 'Analisar Custo Logístico',
    description: 'Avalia custo por rota, custo por entrega, eficiência de rotas, performance de veículos, ponto de equilíbrio',
    keywords: ['rota', 'rotas', 'custo por rota', 'custo por entrega', 'eficiência', 'viável', 'veículo', 'veículos', 'frota', 'custo logístico', 'custo km', 'ponto de equilíbrio', 'equilíbrio'],
    agents: ['estoque_logistica'],
    requiredFunctions: ['get_route_cost', 'get_kpis_overview'],
    optionalFunctions: ['get_vehicle_performance'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true,
      comparisons: true
    }
  },
  analyze_sales_mix: {
    id: 'analyze_sales_mix',
    name: 'Analisar Mix de Vendas',
    description: 'Compara mix atual vs ideal, margens por produto',
    keywords: ['mix', 'venda', 'produto', 'ideal', 'atual'],
    agents: ['comercial'],
    requiredFunctions: ['get_sales_mix', 'get_margin_by_product'],
    optionalFunctions: ['get_kpis_overview'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true,
      comparisons: true
    }
  },
  analyze_financial_health: {
    id: 'analyze_financial_health',
    name: 'Analisar Saúde Financeira',
    description: 'Avalia inadimplência, PMR, ciclo financeiro, fluxo de caixa',
    keywords: ['financeiro', 'inadimplência', 'pmr', 'ciclo', 'caixa'],
    agents: ['financeiro'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: [],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  analyze_customer_metrics: {
    id: 'analyze_customer_metrics',
    name: 'Analisar Métricas de Clientes',
    description: 'Avalia churn, novos clientes, ticket médio, recuperados',
    keywords: ['churn', 'clientes', 'ticket médio', 'ticket medio', 'novos clientes', 'recuperados', 'clientes ativos'],
    agents: ['comercial'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: [],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  compare_periods: {
    id: 'compare_periods',
    name: 'Comparar Períodos',
    description: 'Compara indicadores entre períodos diferentes',
    keywords: ['comparar', 'vs', 'versus', 'anterior', 'período', 'mês'],
    agents: ['custos_margem', 'comercial', 'producao'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: ['get_revenue_monthly'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: false,
      comparisons: true
    }
  },
  identify_root_cause: {
    id: 'identify_root_cause',
    name: 'Identificar Causa Raiz',
    description: 'Investiga causas profundas de problemas (usa múltiplos agentes)',
    keywords: ['por que', 'causa', 'motivo', 'raiz', 'problema'],
    agents: ['custos_margem', 'producao', 'comercial', 'estoque_logistica'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: ['get_losses_by_line', 'get_margin_by_product', 'get_oee'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  suggest_improvements: {
    id: 'suggest_improvements',
    name: 'Sugerir Melhorias',
    description: 'Gera recomendações de ações baseadas em indicadores',
    keywords: ['melhorar', 'como', 'sugestão', 'ação', 'recomendação'],
    agents: ['custos_margem', 'producao', 'comercial'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: ['get_oee', 'get_losses_by_line', 'get_margin_by_product'],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: true
    }
  },
  general_overview: {
    id: 'general_overview',
    name: 'Visão Geral',
    description: 'Fornece visão geral dos principais indicadores',
    keywords: ['visão', 'geral', 'resumo', 'overview', 'indicadores'],
    agents: ['custos_margem', 'producao', 'comercial'],
    requiredFunctions: ['get_kpis_overview'],
    optionalFunctions: [],
    expectedOutput: {
      findings: true,
      evidence: true,
      recommendations: false
    }
  }
}

// ==========================================
// MAPEADOR DE PERGUNTAS → INTENÇÕES
// ==========================================
// Usa análise semântica simples (fallback quando LLM não disponível)

export function mapQuestionToIntention(question: string, context?: Record<string, unknown>): BusinessIntention {
  const lowerQuestion = question.toLowerCase()
  
  // Prioridade: intenções mais específicas primeiro
  const intentionScores: Array<{ intention: BusinessIntention; score: number }> = []

  for (const [intentionId, definition] of Object.entries(intentions)) {
    let score = 0
    
    // Conta matches de keywords
    for (const keyword of definition.keywords) {
      if (lowerQuestion.includes(keyword)) {
        score += 1
      }
    }
    
    // Bonus por contexto
    if (context?.area) {
      const areaAgents = definition.agents
      if (context.area === 'compras' && areaAgents.includes('compras_fornecedores')) score += 2
      if (context.area === 'producao' && areaAgents.includes('producao')) score += 2
      if (context.area === 'estoque' && areaAgents.includes('estoque_logistica')) score += 2
      if (context.area === 'comercial' && areaAgents.includes('comercial')) score += 2
      if (context.area === 'financeiro' && areaAgents.includes('financeiro')) score += 2
    }
    
    intentionScores.push({ intention: intentionId as BusinessIntention, score })
  }

  // Ordena por score e retorna a intenção com maior score
  intentionScores.sort((a, b) => b.score - a.score)
  
  // Se nenhuma intenção teve score > 0, retorna visão geral
  if (intentionScores[0].score === 0) {
    return 'general_overview'
  }
  
  return intentionScores[0].intention
}

// ==========================================
// PLANO DE INVESTIGAÇÃO POR INTENÇÃO
// ==========================================

export interface InvestigationStep {
  step: number
  agent: AgentType
  function: string
  parameters: Record<string, unknown>
  description: string
  dependencies?: number[]
}

// ==========================================
// IDENTIFICAÇÃO DE INTENÇÕES GENÉRICAS
// ==========================================

const GENERIC_INTENTIONS: BusinessIntention[] = [
  'identify_root_cause',
  'suggest_improvements',
  'general_overview'
]

export function isGenericIntention(intention: BusinessIntention): boolean {
  return GENERIC_INTENTIONS.includes(intention)
}

// ==========================================
// LIMITES DE PASSOS POR INTENÇÃO
// ==========================================

const MAX_STEPS_GENERIC = 5
const MAX_STEPS_SPECIFIC = 10

export function getInvestigationPlan(intention: BusinessIntention, question: string, context?: Record<string, unknown>): InvestigationStep[] {
  const definition = intentions[intention]
  const steps: InvestigationStep[] = []
  let stepNumber = 1

  // Passo 1: Sempre busca KPIs gerais primeiro
  steps.push({
    step: stepNumber++,
    agent: definition.agents[0],
    function: 'get_kpis_overview',
    parameters: {
      period: 'dezembro',
      unit: context?.unit || undefined
    },
    description: 'Obter visão geral dos KPIs'
  })

  // Adiciona funções requeridas
  for (const func of definition.requiredFunctions) {
    if (func === 'get_kpis_overview') continue // Já adicionado
    
    const agent = definition.agents[0] // Usa primeiro agente da lista
    
    let parameters: Record<string, unknown> = { period: 'dezembro' }
    
    // Parâmetros específicos por função
    if (func === 'get_revenue_monthly') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_margin_by_product') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_losses_by_line') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_oee') {
      parameters = { 
        line: context?.line || 'Linha 1 - Francês',
        period: 'dezembro' 
      }
    } else if (func === 'get_supplier_variation') {
      parameters = {
        input: context?.input || 'Farinha de Trigo',
        period: 'dezembro'
      }
    } else if (func === 'get_stock_coverage') {
      parameters = {
        product: context?.product || 'Pão Francês',
        period: 'dezembro'
      }
    } else if (func === 'get_otif') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_sales_mix') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_cost_breakdown') {
      parameters = {
        product: context?.product || 'Pão Francês',
        period: 'dezembro'
      }
    } else if (func === 'get_route_cost') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_vehicle_performance') {
      parameters = { period: 'dezembro' }
    } else if (func === 'get_raw_material_seasonality') {
      parameters = { period: 'dezembro' }
    }

    steps.push({
      step: stepNumber++,
      agent,
      function: func,
      parameters,
      description: `Executar ${func}`,
      dependencies: [1] // Depende do passo 1
    })
  }

  // Adiciona funções opcionais se contexto indicar necessidade
  for (const func of definition.optionalFunctions) {
    // Para get_raw_material_seasonality, adiciona se pergunta menciona sazonalidade e compras
    if (func === 'get_raw_material_seasonality') {
      const lowerQuestion = question.toLowerCase()
      if (lowerQuestion.includes('sazonalidade') || lowerQuestion.includes('sazonal')) {
        if (lowerQuestion.includes('compra') || lowerQuestion.includes('matéria') || lowerQuestion.includes('materia')) {
          steps.push({
            step: stepNumber++,
            agent: definition.agents[0],
            function: func,
            parameters: { period: 'dezembro' },
            description: `Executar ${func} (opcional)`,
            dependencies: [1]
          })
        }
      }
    } else if (context?.[func.replace('get_', '')]) {
      steps.push({
        step: stepNumber++,
        agent: definition.agents[0],
        function: func,
        parameters: { period: 'dezembro', ...context },
        description: `Executar ${func} (opcional)`,
        dependencies: [1]
      })
    }
  }

  // Aplica limite de passos baseado no tipo de intenção
  if (isGenericIntention(intention)) {
    return steps.slice(0, MAX_STEPS_GENERIC)
  }
  
  return steps.slice(0, MAX_STEPS_SPECIFIC)
}

