// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/briefing
// ==========================================
// Retorna briefing do dia (ou data específica)

// Import do helper dentro de api/ (serverless functions não incluem src/)
import { supabaseFetch } from '../lib/supabase'

interface VercelRequest {
  method?: string
  query?: Record<string, string>
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (data: any) => void
  setHeader: (key: string, value: string) => void
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({})
    return
  }

  // Apenas GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Valida variáveis de ambiente
    const hasUrl = !!process.env.SUPABASE_URL
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY
    
    if (!hasUrl || !hasAnonKey) {
      console.error('❌ Supabase não configurado no Vercel', {
        hasUrl,
        hasAnonKey,
        urlPreview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'FALTANDO'
      })
      res.status(500).json({ 
        error: 'Supabase não configurado',
        message: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no Vercel Dashboard',
        details: {
          hasUrl,
          hasAnonKey
        }
      })
      return
    }

    // Pega data da query (ou usa hoje)
    const date = (typeof req.query?.date === 'string' ? req.query.date : null) || new Date().toISOString().split('T')[0]

    // Busca briefing do Supabase (usando import estático)
    let data: any = null
    let error: any = null
    
    try {
      console.log('📋 Buscando briefing para data:', date)
      const result = await supabaseFetch('briefings', {
        method: 'GET',
        query: {
          date: `eq.${date}`,
          limit: '1',
          order: 'date.desc'
        },
        useServiceRole: false
      })
      
      data = result.data
      error = result.error
      
      if (error) {
        console.error('❌ Erro retornado por supabaseFetch:', {
          error,
          errorType: typeof error,
          errorString: String(error)
        })
      }
    } catch (fetchError) {
      console.error('❌ Erro ao chamar supabaseFetch:', fetchError)
      error = fetchError instanceof Error ? {
        message: fetchError.message,
        stack: fetchError.stack,
        name: fetchError.name
      } : { message: String(fetchError) }
    }

    if (error) {
      console.error('❌ Erro ao buscar briefing no Supabase:', error)
      // Se erro, tenta gerar na hora (fallback)
      try {
        const briefingModule = await import('../../src/services/orchestrator/briefing')
        const { generateBriefing } = briefingModule
        const generated = await generateBriefing(date)
        res.status(200).json(generated)
        return
      } catch (genError) {
        console.error('❌ Erro ao gerar briefing (fallback):', genError)
        res.status(200).json({
          date,
          summary: 'Briefing ainda não foi gerado. Configure as variáveis de ambiente do Supabase no Vercel.',
          topAlerts: [],
          topCases: [],
          kpiHighlights: [],
          recommendations: []
        })
        return
      }
    }

    const briefing = Array.isArray(data) ? data[0] : (data || null)

    if (!briefing || (typeof briefing === 'object' && !('date' in briefing))) {
      // Se não existe, gera na hora (fallback)
      try {
        const briefingModule = await import('../../src/services/orchestrator/briefing')
        const { generateBriefing } = briefingModule
        const generated = await generateBriefing(date)
        res.status(200).json(generated)
        return
      } catch (genError) {
        console.error('❌ Erro ao gerar briefing (fallback):', genError)
        res.status(200).json({
          date,
          summary: 'Briefing ainda não foi gerado.',
          topAlerts: [],
          topCases: [],
          kpiHighlights: [],
          recommendations: []
        })
        return
      }
    }

    // Transforma snake_case do Supabase para camelCase esperado pela interface
    // O Supabase retorna: top_alerts, top_cases, kpi_highlights
    // A interface espera: topAlerts, topCases, kpiHighlights
    const transformedBriefing = {
      date: briefing.date,
      summary: briefing.summary || '',
      topAlerts: Array.isArray(briefing.top_alerts) ? briefing.top_alerts : (briefing.topAlerts || []),
      topCases: Array.isArray(briefing.top_cases) ? briefing.top_cases : (briefing.topCases || []),
      kpiHighlights: Array.isArray(briefing.kpi_highlights) ? briefing.kpi_highlights : (briefing.kpiHighlights || []),
      recommendations: Array.isArray(briefing.recommendations) ? briefing.recommendations : []
    }

    console.log('✅ Briefing transformado:', {
      date: transformedBriefing.date,
      hasSummary: !!transformedBriefing.summary,
      alertsCount: transformedBriefing.topAlerts.length,
      casesCount: transformedBriefing.topCases.length,
      highlightsCount: transformedBriefing.kpiHighlights.length,
      recommendationsCount: transformedBriefing.recommendations.length
    })

    res.status(200).json(transformedBriefing)
  } catch (error) {
    console.error('❌ Erro ao buscar briefing:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage,
      hint: 'Verifique as variáveis de ambiente do Supabase no Vercel Dashboard'
    })
  }
}

