// ==========================================
// CLIENTE SUPABASE
// ==========================================
// Configuração do cliente Supabase para acesso às tabelas

// Tipos básicos (sem dependência do @supabase/supabase-js para compatibilidade)
interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown[] | null; error: unknown }>
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown[] | null; error: unknown }>
      limit: (count: number) => Promise<{ data: unknown[] | null; error: unknown }>
    }
    insert: (values: unknown) => Promise<{ data: unknown[] | null; error: unknown }>
    update: (values: unknown) => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown[] | null; error: unknown }>
    }
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown[] | null; error: unknown }>
    }
  }
}

// Configuração
// No frontend (Vite), usa import.meta.env
// No backend (Node), usa process.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : undefined)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : undefined)
const SUPABASE_SERVICE_ROLE_KEY = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined

// Log de debug (apenas em desenvolvimento ou se não configurado)
const isDev = import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
const isMissingConfig = !SUPABASE_URL || !SUPABASE_ANON_KEY

if (isDev || isMissingConfig) {
  const configStatus = {
    hasUrl: !!SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
    hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    urlPreview: SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'FALTANDO',
    keyPreview: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'FALTANDO'
  }
  
  if (isMissingConfig) {
    console.error('⚠️ Supabase não configurado. URL:', configStatus.urlPreview, 'Key:', configStatus.keyPreview)
    console.warn('💡 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (dev) ou no Vercel Dashboard (prod)')
  } else if (isDev) {
    console.log('🔍 Configuração Supabase:', configStatus)
  }
}

// Cliente para frontend (anon key)
let supabaseClient: SupabaseClient | null = null

// Cliente para backend (service role key)
let supabaseServiceClient: SupabaseClient | null = null

// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function initSupabase(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
    return
  }

  // Não tenta importar @supabase/supabase-js em build time
  // O fallback (fetch direto) funciona perfeitamente
  console.log('✅ Supabase configurado (usando fetch direto)')
}

// Não inicializa no frontend - usa fetch direto
// A inicialização do cliente Supabase JS é opcional

// ==========================================
// FUNÇÕES DE ACESSO
// ==========================================

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

export function getSupabaseServiceClient(): SupabaseClient | null {
  return supabaseServiceClient
}

// ==========================================
// FALLBACK: Fetch Direto (se Supabase JS não disponível)
// ==========================================

export async function supabaseFetch(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    query?: Record<string, string>
    useServiceRole?: boolean
  } = {}
): Promise<{ data: unknown[] | null; error: unknown }> {
  const { method = 'GET', body, query = {}, useServiceRole = false } = options
  
  const key = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY
  
  if (!SUPABASE_URL || !key) {
    const errorMsg = `Supabase não configurado. URL: ${SUPABASE_URL ? 'OK' : 'FALTANDO'}, Key: ${key ? 'OK' : 'FALTANDO'} (useServiceRole: ${useServiceRole})`
    console.error('❌', errorMsg)
    console.error('💡 Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
    return { data: null, error: errorMsg }
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  
  // Para GET e PATCH, adiciona query params
  if ((method === 'GET' || method === 'PATCH') && query) {
    Object.entries(query).forEach(([k, v]) => {
      // Supabase PostgREST usa formato: coluna=operador.valor
      // Exemplos:
      //   date=eq.2026-01-03
      //   timestamp=gte.2026-01-03T00:00:00Z
      //   status=in.(aberto,em_investigacao)
      
      if (k === 'limit' || k === 'order') {
        // Campos especiais do PostgREST
        url.searchParams.set(k, v)
      } else if (k.includes('.')) {
        // Se a chave contém ponto (ex: "timestamp.gte"), separa em coluna e operador
        const [column, operator] = k.split('.', 2)
        url.searchParams.set(column, `${operator}.${v}`)
      } else if (v.includes('.')) {
        // Se o valor já contém ponto, assume que já está no formato correto (ex: "eq.2026-01-03")
        url.searchParams.set(k, v)
      } else {
        // Default: igualdade (eq)
        url.searchParams.set(k, `eq.${v}`)
      }
    })
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      return { data: null, error }
    }

    if (method === 'DELETE') {
      return { data: null, error: null }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// ==========================================
// EXPORTS
// ==========================================

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY }
export type { SupabaseClient }

