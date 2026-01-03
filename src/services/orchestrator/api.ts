// ==========================================
// SERVIÇO DE API - ORQUESTRADOR
// ==========================================
// Simula chamadas ao backend (serverless functions)
// Na produção, estas chamadas serão feitas para a Vercel Functions

import type {
  AskRequest,
  OrchestratorResponse,
  IntelligentAlert,
  OperationalCase,
  ValidateCaseRequest
} from './types'
import { orchestrate } from './maestro'

// ==========================================
// SIMULAÇÃO DE DELAY DE REDE
// ==========================================

const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 500))

// ==========================================
// ENDPOINTS
// ==========================================

export async function askOrchestrator(request: AskRequest): Promise<OrchestratorResponse> {
  // CORREÇÃO CRÍTICA: Sempre chama a API do backend (Vercel Serverless Function)
  // A API key do Groq fica segura no backend
  try {
    const response = await fetch('/api/orchestrator/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    // Fallback: se a API não estiver disponível (desenvolvimento local sem Vercel)
    if (import.meta.env.DEV) {
      console.warn('⚠️ API /api/orchestrator/ask não disponível, usando fallback local')
      console.warn('💡 Em produção, configure as Vercel Serverless Functions')
      console.warn('💡 Erro original:', error)
      
      try {
        return await orchestrate(request)
      } catch (fallbackError) {
        console.error('❌ Erro no fallback local:', fallbackError)
        throw new Error(
          `Erro na orquestração: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
        )
      }
    }
    
    // Em produção, sempre deve ter a API
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Erro na API: ${errorMessage}`)
  }
}

export async function getAlerts(): Promise<IntelligentAlert[]> {
  await simulateNetworkDelay()
  
  // Em produção: fetch('/api/orchestrator/alerts')
  // Por enquanto, retorna mock
  return generateMockAlerts()
}

export async function getCases(): Promise<OperationalCase[]> {
  await simulateNetworkDelay()
  
  // Em produção: fetch('/api/orchestrator/cases')
  return generateMockCases()
}

export async function getCase(caseId: string): Promise<OperationalCase | null> {
  await simulateNetworkDelay()
  
  // Em produção: fetch(`/api/orchestrator/cases/${caseId}`)
  const cases = generateMockCases()
  return cases.find(c => c.id === caseId) || null
}

export async function validateCase(request: ValidateCaseRequest): Promise<OperationalCase> {
  await simulateNetworkDelay()
  
  // Em produção: POST /api/orchestrator/cases/validate
  const mockCase = generateMockCases().find(c => c.id === request.caseId)
  if (!mockCase) {
    throw new Error('Caso não encontrado')
  }
  
  return {
    ...mockCase,
    status: request.validated ? 'validado' : 'rejeitado',
    validationHistory: [
      ...(mockCase.validationHistory || []),
      {
        hypothesisId: request.hypothesisId,
        validated: request.validated,
        comment: request.comment,
        validatedBy: 'Usuário',
        validatedAt: new Date().toISOString()
      }
    ]
  }
}

// ==========================================
// BRIEFING
// ==========================================

export async function getBriefing(date?: string): Promise<any> {
  try {
    const url = date 
      ? `/api/orchestrator/briefing?date=${date}`
      : '/api/orchestrator/briefing'
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    // Fallback em desenvolvimento
    if (import.meta.env.DEV) {
      console.warn('⚠️ API /api/orchestrator/briefing não disponível, usando fallback local')
      
      // Tenta buscar do Supabase diretamente
      try {
        const supabaseModule = await import('../supabase/client').catch(() => null)
        if (!supabaseModule) {
          console.warn('⚠️ Módulo Supabase não disponível')
          return null
        }
        
        const { supabaseFetch } = supabaseModule
        const targetDate = date || new Date().toISOString().split('T')[0]
        
        // Supabase PostgREST usa formato: ?coluna=operador.valor
        // Para date=eq.2026-01-03, precisamos passar como query string correta
        const { data, error: fetchError } = await supabaseFetch('briefings', {
          method: 'GET',
          query: {
            date: `eq.${targetDate}`,
            limit: '1',
            order: 'date.desc'
          },
          useServiceRole: false // Usa anon key em dev
        })

        console.log('📋 Busca de briefing no Supabase:', { data, error: fetchError })

        if (!fetchError && data) {
          const briefing = Array.isArray(data) ? data[0] : data
          if (briefing && briefing.date) {
            console.log('✅ Briefing encontrado no Supabase:', briefing.date)
            return briefing
          }
        }

        console.log('⚠️ Briefing não encontrado no Supabase para a data:', targetDate)
        // Se não encontrou, retorna null (componente trata)
        return null
      } catch (fallbackError) {
        console.warn('⚠️ Erro no fallback:', fallbackError)
        // Retorna null em vez de mock para não quebrar
        return null
      }
    }
    throw error
  }
}

// ==========================================
// EVENTOS
// ==========================================

export async function getEvents(limit: number = 20): Promise<any[]> {
  try {
    const response = await fetch(`/api/orchestrator/events?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    // Fallback em desenvolvimento
    if (import.meta.env.DEV) {
      console.warn('⚠️ API /api/orchestrator/events não disponível, usando fallback local')
      
      // Tenta buscar do Supabase diretamente
      try {
        const supabaseModule = await import('../supabase/client').catch(() => null)
        if (!supabaseModule) {
          console.warn('⚠️ Módulo Supabase não disponível')
          return []
        }
        
        const { supabaseFetch } = supabaseModule
        
        const { data, error: fetchError } = await supabaseFetch('events', {
          method: 'GET',
          query: {
            order: 'timestamp.desc',
            limit: String(limit)
          },
          useServiceRole: false // Usa anon key em dev
        })

        if (!fetchError && data) {
          return Array.isArray(data) ? data : []
        }

        return []
      } catch (fallbackError) {
        console.warn('⚠️ Erro no fallback, retornando array vazio:', fallbackError)
        return []
      }
    }
    throw error
  }
}

export async function markEventAsRead(eventId: string): Promise<void> {
  try {
    await fetch(`/api/orchestrator/events/${eventId}/read`, {
      method: 'PATCH'
    })
  } catch (error) {
      // Fallback em desenvolvimento
      if (import.meta.env.DEV) {
        console.warn('⚠️ API não disponível, tentando atualizar diretamente no Supabase')
        
        try {
          const supabaseModule = await import('../supabase/client').catch(() => null)
          if (supabaseModule) {
            const { supabaseFetch } = supabaseModule
            
            await supabaseFetch('events', {
              method: 'PATCH',
              body: { read: true },
              query: { id: `eq.${eventId}` },
              useServiceRole: false
            })
          }
        } catch (fallbackError) {
          console.error('Erro ao marcar evento como lido:', fallbackError)
        }
      } else {
        console.error('Erro ao marcar evento como lido:', error)
      }
  }
}

// ==========================================
// MOCKS (para desenvolvimento)
// ==========================================

function generateMockAlerts(): IntelligentAlert[] {
  return [
    {
      id: 'alert_1',
      timestamp: new Date().toISOString(),
      severity: 'P1',
      indicator: {
        id: 'margem_bruta',
        label: 'Margem Bruta',
        area: 'financeiro'
      },
      variation: {
        current: 28.5,
        previous: 32.1,
        change: -3.6,
        unit: '%'
      },
      impact: {
        estimated: 'Redução de R$ 45k no lucro mensal',
        financial: 45000,
        operational: 'Possível aumento de custos de matéria-prima'
      },
      probableCause: 'Aumento de custos de matéria-prima não repassado',
      confidence: 85,
      status: 'new',
      investigationId: undefined,
      snoozedUntil: undefined,
      acknowledgedBy: undefined,
      acknowledgedAt: undefined,
      dataQuality: 'complete',
      lastAlertTimestamp: undefined
    }
  ]
}

function generateMockCases(): OperationalCase[] {
  return [
    {
      id: 'case_1',
      title: 'Queda de Margem Bruta',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
      status: 'em_investigacao',
      source: 'alert',
      hypotheses: [
        {
          id: 'hyp_1',
          hypothesis: 'Aumento de custos de matéria-prima',
          confidence: 85,
          status: 'pending',
          evidence: ['Custo MP aumentou 8%', 'Preço de venda manteve-se estável']
        }
      ],
      dataConsulted: [
        {
          function: 'get_kpis_overview',
          parameters: { period: 'dezembro' },
          timestamp: new Date().toISOString(),
          result: { margem_bruta: 28.5 }
        }
      ],
      evidence: [
        {
          id: 'ev_1',
          type: 'metric',
          description: 'Margem bruta',
          value: '28.5%',
          source: 'Sistema BI'
        },
        {
          id: 'ev_2',
          type: 'trend',
          description: 'Tendência de queda',
          value: '-3.6%',
          source: 'Análise automática'
        }
      ],
      validationChecklist: [
        {
          id: 'check_1',
          item: 'Verificar contratos com fornecedores',
          checked: false
        },
        {
          id: 'check_2',
          item: 'Analisar variação de preços de MP',
          checked: false
        }
      ]
    }
  ]
}

function generateMockBriefing(date: string): any {
  return {
    date,
    summary: 'Dia operacional estável. Nenhum desvio crítico detectado.',
    topAlerts: [],
    topCases: [],
    kpiHighlights: [],
    recommendations: []
  }
}
