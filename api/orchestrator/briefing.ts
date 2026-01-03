// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/briefing
// ==========================================
// Retorna briefing do dia (ou data específica)

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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Supabase não configurado no Vercel')
      res.status(500).json({ 
        error: 'Supabase não configurado',
        message: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no Vercel Dashboard',
        details: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY
        }
      })
      return
    }

    // Pega data da query (ou usa hoje)
    const date = (typeof req.query?.date === 'string' ? req.query.date : null) || new Date().toISOString().split('T')[0]

    // Busca briefing do Supabase
    const { supabaseFetch } = await import('../../src/services/supabase/client')
    
    const { data, error } = await supabaseFetch('briefings', {
      method: 'GET',
      query: {
        date: `eq.${date}`,
        limit: '1',
        order: 'date.desc'
      },
      useServiceRole: false
    })

    if (error) {
      console.error('❌ Erro ao buscar briefing no Supabase:', error)
      // Se erro, tenta gerar na hora (fallback)
      try {
        const { generateBriefing } = await import('../../src/services/orchestrator/briefing')
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

    const briefing = Array.isArray(data) ? data[0] : data

    if (!briefing || (typeof briefing === 'object' && !('date' in briefing))) {
      // Se não existe, gera na hora (fallback)
      try {
        const { generateBriefing } = await import('../../src/services/orchestrator/briefing')
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

    res.status(200).json(briefing)
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

