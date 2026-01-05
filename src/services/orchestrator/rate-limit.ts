// ==========================================
// RATE LIMITING - Upstash Rate Limit ou Fallback em Memória
// ==========================================
// Protege endpoint /api/orchestrator/ask de abuso

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// ==========================================
// RATE LIMIT EM MEMÓRIA (Fallback)
// ==========================================

interface MemoryRateLimit {
  requests: number
  windowStart: number
}

const memoryRateLimits = new Map<string, MemoryRateLimit>()

// ==========================================
// RATE LIMIT UPSTASH (Produção)
// ==========================================

interface UpstashRateLimit {
  limit: (identifier: string) => Promise<RateLimitResult>
}

let upstashRateLimit: UpstashRateLimit | null = null

async function initUpstashRateLimit(): Promise<UpstashRateLimit | null> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!upstashUrl || !upstashToken) {
    return null
  }

  try {
    // Upstash Rate Limit via REST API
    const rateLimit: UpstashRateLimit = {
      async limit(identifier: string): Promise<RateLimitResult> {
        const key = `rate_limit:${identifier}`
        const limit = 30 // 30 req/min
        const window = 60 // 1 minuto

        // Implementação simplificada usando Upstash Redis
        // Em produção, use @upstash/ratelimit se disponível
        const response = await fetch(`${upstashUrl}/incr/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${upstashToken}`
          }
        })

        if (!response.ok) {
          // Fallback para memória se Upstash falhar
          return checkMemoryRateLimit(identifier, limit, window)
        }

        const data = await response.json()
        const count = data.result || 0

        // Define TTL se for primeira requisição
        if (count === 1) {
          await fetch(`${upstashUrl}/expire/${encodeURIComponent(key)}/${window}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${upstashToken}`
            }
          })
        }

        return {
          success: count <= limit,
          limit,
          remaining: Math.max(0, limit - count),
          reset: Date.now() + (window * 1000)
        }
      }
    }

    return rateLimit
  } catch (error) {
    console.warn('⚠️ Upstash Rate Limit não disponível, usando memória:', error)
    return null
  }
}

// ==========================================
// RATE LIMIT EM MEMÓRIA (Fallback)
// ==========================================

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

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

export async function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  // Tenta Upstash primeiro (se disponível)
  if (upstashRateLimit) {
    try {
      return await upstashRateLimit.limit(identifier)
    } catch (error) {
      console.warn('⚠️ Erro no Upstash Rate Limit, usando memória:', error)
    }
  }

  // Fallback: memória
  return checkMemoryRateLimit(identifier, limit, windowSeconds)
}

// ==========================================
// HELPERS
// ==========================================

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

// ==========================================
// INICIALIZAÇÃO
// ==========================================

export async function initRateLimit(): Promise<void> {
  if (typeof process !== 'undefined' && process.env) {
    upstashRateLimit = await initUpstashRateLimit()
    if (upstashRateLimit) {
      console.log('✅ Rate Limit (Upstash) inicializado')
    } else {
      console.log('⚠️ Rate Limit Upstash não disponível, usando memória (fallback)')
    }
  }
}

// Inicializa na importação (se backend)
if (typeof process !== 'undefined' && process.env) {
  initRateLimit().catch(console.error)
}



