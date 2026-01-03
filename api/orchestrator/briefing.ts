// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/briefing
// ==========================================
// Retorna briefing do dia (ou data específica)

// Import do helper dentro de api/ (serverless functions não incluem src/)
// Em módulos ES, precisa da extensão .js (mesmo que o arquivo seja .ts)
import { supabaseFetch } from '../lib/supabase.js'

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

    // SEMPRE gera briefing na hora usando dados mockados
    // Isso garante que os resumos por área sempre apareçam, mesmo sem dados reais no Supabase
    console.log('📋 Gerando briefing para data:', date)
    try {
      const { generateBriefing } = await import('../lib/briefing.js')
      const generated = await generateBriefing(date)
      
      console.log('✅ Briefing gerado:', {
        date: generated.date,
        hasSummary: !!generated.summary,
        areasCount: generated.areaSummaries?.length || 0,
        alertsCount: generated.topAlerts?.length || 0,
        casesCount: generated.topCases?.length || 0,
        highlightsCount: generated.kpiHighlights?.length || 0,
        recommendationsCount: generated.recommendations?.length || 0
      })
      
      res.status(200).json(generated)
      return
    } catch (genError) {
      console.error('❌ Erro ao gerar briefing:', genError)
      res.status(200).json({
        date,
        summary: 'Erro ao gerar briefing. Verifique os logs do servidor.',
        areaSummaries: [],
        topAlerts: [],
        topCases: [],
        kpiHighlights: [],
        recommendations: []
      })
      return
    }
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

