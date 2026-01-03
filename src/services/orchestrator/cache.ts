// ==========================================
// CACHE PERSISTENTE - Redis (Upstash) ou Fallback em Memória
// ==========================================
// Em produção, use Upstash Redis para cache confiável em serverless

import type { LLMMappingResult } from './llm-mapper.js'

interface CacheEntry {
  question: string
  context: Record<string, unknown>
  result: LLMMappingResult
  timestamp: number
  ttl: number
}

// ==========================================
// CACHE EM MEMÓRIA (Fallback/Best-Effort)
// ==========================================

const memoryCache = new Map<string, CacheEntry>()

// ==========================================
// CACHE REDIS (Upstash) - Produção
// ==========================================

interface RedisCache {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>
}

let redisClient: RedisCache | null = null

async function initRedis(): Promise<RedisCache | null> {
  // Tenta inicializar Upstash Redis se variáveis de ambiente estiverem configuradas
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    return null
  }

  try {
    // Upstash Redis REST API (compatível com serverless)
    const redis: RedisCache = {
      async get(key: string): Promise<string | null> {
        const response = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
          headers: {
            'Authorization': `Bearer ${redisToken}`
          }
        })
        if (!response.ok) return null
        const data = await response.json()
        return data.result || null
      },
      async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
        const url = options?.ex
          ? `${redisUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${options.ex}`
          : `${redisUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`
        
        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${redisToken}`
          }
        })
      }
    }

    // Testa conexão
    await redis.set('__test__', 'ok', { ex: 1 })
    const test = await redis.get('__test__')
    if (test === 'ok') {
      return redis
    }
  } catch (error) {
    console.warn('⚠️ Redis não disponível, usando cache em memória:', error)
  }

  return null
}

// ==========================================
// FUNÇÕES DE CACHE
// ==========================================

function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')
}

function getCacheKey(question: string, context?: Record<string, unknown>): string {
  const normalized = normalizeQuestion(question)
  const contextStr = JSON.stringify(context || {})
  return `llm_map:${normalized}::${contextStr}`
}

export async function getCachedMapping(
  question: string,
  context?: Record<string, unknown>
): Promise<LLMMappingResult | null> {
  const key = getCacheKey(question, context)
  const ttl = 5 * 60 // 5 minutos em segundos

  // Tenta Redis primeiro (se disponível)
  if (redisClient) {
    try {
      const cached = await redisClient.get(key)
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached)
        // Verifica TTL
        if (Date.now() - entry.timestamp < entry.ttl) {
          return entry.result
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao ler cache Redis, usando memória:', error)
    }
  }

  // Fallback: cache em memória (best-effort)
  const cached = memoryCache.get(key)
  if (cached && (Date.now() - cached.timestamp < cached.ttl)) {
    return cached.result
  }

  return null
}

export async function setCachedMapping(
  question: string,
  context: Record<string, unknown> | undefined,
  result: LLMMappingResult
): Promise<void> {
  const key = getCacheKey(question, context)
  const ttl = 5 * 60 * 1000 // 5 minutos em ms
  const entry: CacheEntry = {
    question: normalizeQuestion(question),
    context: context || {},
    result,
    timestamp: Date.now(),
    ttl
  }

  // Salva no Redis (se disponível)
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(entry), { ex: 300 }) // 5 min em segundos
    } catch (error) {
      console.warn('⚠️ Erro ao salvar cache Redis, usando memória:', error)
    }
  }

  // Sempre salva também em memória (best-effort)
  memoryCache.set(key, entry)
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

export async function initCache(): Promise<void> {
  if (typeof process !== 'undefined' && process.env) {
    redisClient = await initRedis()
    if (redisClient) {
      console.log('✅ Cache Redis (Upstash) inicializado')
    } else {
      console.log('⚠️ Cache Redis não disponível, usando memória (fallback)')
    }
  }
}

// Inicializa na importação (se backend)
if (typeof process !== 'undefined' && process.env) {
  initCache().catch(console.error)
}

