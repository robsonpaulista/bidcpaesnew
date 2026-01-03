// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/ask
// ==========================================
// Esta função roda no BACKEND (Vercel Serverless)
// A API key do Groq fica segura aqui (process.env.GROQ_API_KEY, não VITE_)

// Tipos simplificados (sem dependência externa)
interface VercelRequest {
  method?: string
  body?: any
  headers?: Record<string, string | string[] | undefined>
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (data: any) => void
  setHeader: (key: string, value: string) => void
}

// ==========================================
// HANDLER PRINCIPAL
// ==========================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({})
    return
  }

  // Apenas POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // ==========================================
    // RATE LIMITING (CRÍTICO PARA PRODUÇÃO)
    // ==========================================
    const { checkRateLimit, getRateLimitIdentifier } = await import('../lib/rate-limit.js')
    
    const identifier = getRateLimitIdentifier(req)
    const rateLimitResult = await checkRateLimit(identifier, 30, 60) // 30 req/min
    
    if (!rateLimitResult.success) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${rateLimitResult.limit} requests per minute.`,
        reset: rateLimitResult.reset
      })
      return
    }

    // Adiciona headers de rate limit
    res.setHeader('X-RateLimit-Limit', String(rateLimitResult.limit))
    res.setHeader('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    res.setHeader('X-RateLimit-Reset', String(rateLimitResult.reset))

    const request = req.body

    // Validação básica
    if (!request || !request.question || typeof request.question !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "question" field' })
      return
    }

    // Importa orquestração dinamicamente (evita problemas de build)
    // Em produção, o Vercel compila isso corretamente
    const { orchestrate } = await import('../../src/services/orchestrator/maestro')
    
    // Executa orquestração (agora no backend, seguro)
    // A API key do Groq está em process.env.GROQ_API_KEY (não exposta)
    const response = await orchestrate({
      question: request.question,
      context: request.context || {}
    })

    // Retorna resposta
    res.status(200).json(response)
  } catch (error) {
    console.error('❌ Erro na orquestração:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage 
    })
  }
}
