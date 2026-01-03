// ==========================================
// RATE LIMITING PARA SERVERLESS FUNCTIONS
// ==========================================
// Versão simplificada que funciona no Vercel (sem dependências de src/)

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface MemoryRateLimit {
  requests: number
  windowStart: number
}

// Rate limit em memória (simples para serverless functions)
const memoryRateLimits = new Map<string, MemoryRateLimit>()

function checkMemoryRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  let rateLimit = memoryRateLimits.get(identifier)

  if (!rateLimit || (now - rateLimit.windowStart >= windowMs)) {
    // Nova janela
    rateLimit = {
      requests: 1,
      windowStart: now
    }
    memoryRateLimits.set(identifier, rateLimit)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs
    }
  }

  rateLimit.requests++

  if (rateLimit.requests > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: rateLimit.windowStart + windowMs
    }
  }

  memoryRateLimits.set(identifier, rateLimit)
  return {
    success: true,
    limit,
    remaining: limit - rateLimit.requests,
    reset: rateLimit.windowStart + windowMs
  }
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  // Por enquanto, usa apenas memória (simples para serverless)
  // Em produção, pode integrar com Upstash Redis se necessário
  return checkMemoryRateLimit(identifier, limit, windowSeconds)
}

export function getRateLimitIdentifier(req: { headers?: Record<string, string | string[] | undefined> }): string {
  // Tenta pegar userId de header (se existir)
  const userId = req.headers?.['x-user-id'] || req.headers?.['x-app-token']
  
  if (userId && typeof userId === 'string') {
    return `user:${userId}`
  }

  // Fallback: IP (se disponível)
  // Em Vercel, pode pegar de req.headers['x-forwarded-for']
  const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip']
  
  if (ip && typeof ip === 'string') {
    return `ip:${ip.split(',')[0].trim()}`
  }

  // Último recurso: identificador genérico
  return 'anonymous'
}

