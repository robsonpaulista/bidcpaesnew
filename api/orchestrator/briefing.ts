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
    // Pega data da query (ou usa hoje)
    const date = req.query?.date || new Date().toISOString().split('T')[0]

    // Busca briefing do Supabase
    const { supabaseFetch } = await import('../../src/services/supabase/client')
    
    const { data, error } = await supabaseFetch('briefings', {
      method: 'GET',
      query: {
        date: `eq.${date}`,
        limit: '1'
      }
    })

    if (error) {
      res.status(500).json({ error: 'Erro ao buscar briefing', message: String(error) })
      return
    }

    const briefing = Array.isArray(data) ? data[0] : data

    if (!briefing) {
      // Se não existe, gera na hora (fallback)
      const { generateBriefing } = await import('../../src/services/orchestrator/briefing')
      const generated = await generateBriefing(date)
      
      res.status(200).json(generated)
      return
    }

    res.status(200).json(briefing)
  } catch (error) {
    console.error('❌ Erro ao buscar briefing:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage 
    })
  }
}

