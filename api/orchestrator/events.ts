// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/events
// ==========================================
// Retorna feed de eventos (atividades dos agentes)

// Import estático para evitar problemas com imports dinâmicos no Vercel
import { supabaseFetch } from '../../src/services/supabase/client'

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({})
    return
  }

  // GET: lista eventos
  if (req.method === 'GET') {
    try {
      // Valida variáveis de ambiente
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.error('❌ Supabase não configurado no Vercel')
        // Retorna array vazio em vez de erro (melhor UX)
        res.status(200).json([])
        return
      }

      const limit = parseInt(req.query?.limit || '20')
      const unreadOnly = req.query?.unread === 'true'

      const query: Record<string, string> = {
        order: 'timestamp.desc',
        limit: String(limit)
      }

      if (unreadOnly) {
        query.read = 'eq.false'
      }

      const { data, error } = await supabaseFetch('events', {
        method: 'GET',
        query,
        useServiceRole: false
      })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        // Retorna array vazio em vez de erro (melhor UX)
        res.status(200).json([])
        return
      }

      res.status(200).json(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error)
      // Retorna array vazio em vez de erro (melhor UX)
      res.status(200).json([])
    }
    return
  }

  // PATCH: marca como lido
  if (req.method === 'PATCH') {
    const eventId = req.query?.id
    if (!eventId) {
      res.status(400).json({ error: 'Missing event id' })
      return
    }

    try {
      const { error } = await supabaseFetch('events', {
        method: 'PATCH',
        body: { read: true },
        query: { id: `eq.${eventId}` },
        useServiceRole: true
      })

      if (error) {
        res.status(500).json({ error: 'Erro ao atualizar evento', message: String(error) })
        return
      }

      res.status(200).json({ success: true })
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}

