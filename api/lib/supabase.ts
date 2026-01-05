// ==========================================
// HELPER SUPABASE PARA SERVERLESS FUNCTIONS
// ==========================================
// Função simplificada para uso nas APIs do Vercel
// Não depende de src/ porque serverless functions não incluem essa pasta

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
  
  // Lê variáveis de ambiente (sempre process.env em serverless functions)
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const key = useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY
  
  if (!SUPABASE_URL || !key) {
    const errorMsg = `Supabase não configurado. URL: ${SUPABASE_URL ? 'OK' : 'FALTANDO'}, Key: ${key ? 'OK' : 'FALTANDO'} (useServiceRole: ${useServiceRole})`
    console.error('❌', errorMsg)
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
      let error: any
      try {
        const errorText = await response.text()
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText || response.statusText, status: response.status }
        }
      } catch {
        error = { message: response.statusText, status: response.status }
      }
      console.error(`❌ Supabase error (${response.status}) para ${table}:`, error)
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



