// ==========================================
// MAPEADOR LLM - Pergunta → Intenção + Entidades
// ==========================================
// IMPORTANTE: LLM NÃO DECIDE NADA, apenas mapeia e extrai entidades
// O orquestrador (código) decide o plano, queries, lógica

import { BusinessIntention, intentions } from './intentions'

// ==========================================
// TIPOS
// ==========================================

export interface LLMMappingResult {
  intent: BusinessIntention
  confidence: number
  entities: {
    kpi?: string
    produto?: string
    periodo?: string
    linha?: string
    area?: string
    fornecedor?: string
    [key: string]: string | undefined
  }
}

// ==========================================
// CONFIGURAÇÃO
// ==========================================
// IMPORTANTE: Em produção, esta função deve rodar no BACKEND
// No frontend, apenas chama a API /api/orchestrator/ask

interface LLMConfig {
  provider: 'groq' | 'huggingface' | 'gemini' | 'local'
  apiKey?: string
  model?: string
}

// Detecta se está rodando no backend (Node.js) ou frontend (Vite)
// No Vercel Serverless Functions, process.env existe e import.meta.env não
const isBackend = typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.GROQ_API_KEY

const config: LLMConfig = {
  provider: isBackend
    ? (process.env.LLM_PROVIDER as LLMConfig['provider']) || 'local'
    : 'local', // Frontend sempre usa 'local' (chama API)
  apiKey: isBackend
    ? process.env.GROQ_API_KEY || process.env.LLM_API_KEY
    : undefined, // Frontend NUNCA deve ter a key
  model: isBackend
    ? process.env.LLM_MODEL || 'llama-3.1-8b-instant'
    : 'llama-3.1-8b-instant' // Frontend não usa, mas precisa de valor padrão
}

// ==========================================
// PROMPT PARA MAPEAMENTO
// ==========================================
// LLM retorna APENAS intenção + entidades (JSON estruturado)

function createMappingPrompt(question: string): string {
  const intentionsList = Object.entries(intentions)
    .map(([id, def]) => `- ${id}: ${def.name} (${def.description})`)
    .join('\n')

  return `Você é um assistente que mapeia perguntas de negócio para intenções e extrai entidades.

Pergunta: "${question}"

Intenções disponíveis:
${intentionsList}

EXEMPLOS DE MAPEAMENTO:
- "faturamento mensal", "receita", "evolução anual", "melhor/pior mês", "sazonalidade do faturamento" → analyze_revenue_trend
- "sazonalidade nas compras", "sazonalidade de matérias-primas", "padrão de compras" → analyze_supplier_performance
- "margem", "lucro", "custo", "queda de margem" → analyze_margin_decline
- "perdas", "refugo", "desperdício" → analyze_losses
- "oee", "eficiência de produção" → analyze_production_efficiency
- "mix de produtos", "mix de vendas" → analyze_sales_mix
- "rota", "custo por rota", "eficiência de rotas" → analyze_logistics_cost

Sua tarefa:
1. Identificar a intenção mais adequada (seja específico, não genérico)
2. Extrair entidades mencionadas (kpi, produto, período, linha, área, fornecedor)

IMPORTANTE:
- Se a pergunta menciona "faturamento", "receita", "evolução", "melhor mês", "pior mês", "sazonalidade do faturamento" → use analyze_revenue_trend
- Se a pergunta menciona "sazonalidade" + "compra"/"matéria-prima"/"fornecedor" → use analyze_supplier_performance
- Se a pergunta menciona "margem", "lucro", "custo" → use analyze_margin_decline
- Se a pergunta menciona "rota", "custo por rota", "eficiência" + "logística" → use analyze_logistics_cost
- Seja preciso: escolha a intenção que melhor descreve o objetivo da pergunta. Considere o CONTEXTO (compra vs faturamento vs logística)

Retorne APENAS um JSON válido no formato:
{
  "intent": "ID_DA_INTENCAO",
  "confidence": 0.0-1.0,
  "entities": {
    "kpi": "nome_do_kpi_se_mencionado",
    "produto": "nome_do_produto_se_mencionado",
    "periodo": "período_se_mencionado",
    "linha": "linha_se_mencionada",
    "area": "área_se_mencionada",
    "fornecedor": "fornecedor_se_mencionado"
  }
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`
}

// ==========================================
// GROQ API
// ==========================================

async function mapWithGroq(question: string): Promise<LLMMappingResult> {
  if (!config.apiKey) {
    const envHint = isBackend 
      ? 'GROQ_API_KEY ou LLM_API_KEY no Vercel Environment Variables'
      : 'Esta função deve rodar no backend. Chame /api/orchestrator/ask'
    
    if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
      console.error('❌ Groq API key não configurada')
      console.log(`💡 Configure ${envHint}`)
    }
    throw new Error('Groq API key não configurada')
  }

  // Log da requisição (apenas em dev, sem expor a key)
  const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log('🌐 Enviando requisição para Groq API...', {
      model: config.model,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      hasApiKey: !!config.apiKey
    })
  }

  // Timeout de 3 segundos
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente que mapeia perguntas para intenções e extrai entidades. Retorne APENAS JSON válido.'
          },
          {
            role: 'user',
            content: createMappingPrompt(question)
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }, // Força resposta JSON
        max_tokens: 200
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || response.statusText
      if (isDev) {
        console.error('❌ Erro na API Groq:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        })
      }
      throw new Error(`Groq API error (${response.status}): ${errorMessage}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()
    
    if (!content) {
      if (isDev) {
        console.error('❌ Resposta vazia do Groq:', data)
      }
      throw new Error('Resposta vazia do Groq')
    }

    if (isDev) {
      console.log('📥 Resposta bruta do Groq:', content.substring(0, 200) + (content.length > 200 ? '...' : ''))
    }

    return parseLLMResponse(content)
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout ao chamar Groq API (3s)')
    }
    throw error
  }
}

// ==========================================
// GOOGLE GEMINI
// ==========================================

async function mapWithGemini(question: string): Promise<LLMMappingResult> {
  if (!config.apiKey) {
    throw new Error('Gemini API key não configurada')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: createMappingPrompt(question)
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  
  if (!content) {
    throw new Error('Resposta vazia do Gemini')
  }

  return parseLLMResponse(content)
}

// ==========================================
// PARSER DE RESPOSTA LLM
// ==========================================
// Extrai JSON da resposta (pode ter texto antes/depois)

function parseLLMResponse(content: string): LLMMappingResult {
  let parsed: any
  
  // CORREÇÃO CRÍTICA: Tenta JSON.parse direto primeiro (já força JSON com response_format)
  try {
    parsed = JSON.parse(content)
  } catch {
    // Fallback: tenta extrair JSON com regex (último recurso)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON não encontrado na resposta')
    }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
      throw new Error(`Erro ao parsear JSON: ${errorMessage}`)
    }
  }
  
  // Valida estrutura básica
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Resposta não é um objeto JSON válido')
  }
  
  // Valida intent
  if (!parsed.intent || typeof parsed.intent !== 'string') {
    throw new Error('Campo "intent" inválido ou ausente')
  }

  // Valida se intenção existe
  if (!(parsed.intent in intentions)) {
    throw new Error(`Intenção "${parsed.intent}" não existe`)
  }

  // CORREÇÃO CRÍTICA: Usa nullish coalescing (??) em vez de || para confidence = 0
  const rawC = parsed.confidence ?? 0.8
  const c = Number(rawC)
  const confidence = Number.isFinite(c) 
    ? Math.min(1, Math.max(0, c))
    : 0.8

  // Valida entities
  const entities = (typeof parsed.entities === 'object' && parsed.entities !== null && !Array.isArray(parsed.entities))
    ? parsed.entities
    : {}

  return {
    intent: parsed.intent as BusinessIntention,
    confidence,
    entities
  }
}

// ==========================================
// FALLBACK: Mapeamento por Keywords
// ==========================================
// Sempre funciona, mesmo sem LLM

function mapWithKeywords(question: string, context?: Record<string, unknown>): LLMMappingResult {
  const lowerQuestion = question.toLowerCase()
  const intentionScores: Array<{ intention: BusinessIntention; score: number }> = []

  for (const [intentionId, definition] of Object.entries(intentions)) {
    let score = 0
    
    for (const keyword of definition.keywords) {
      if (lowerQuestion.includes(keyword)) {
        score += 1
      }
    }
    
    if (context?.area) {
      const areaAgents = definition.agents
      if (context.area === 'compras' && areaAgents.includes('compras_fornecedores')) score += 2
      if (context.area === 'producao' && areaAgents.includes('producao')) score += 2
      if (context.area === 'estoque' && areaAgents.includes('estoque_logistica')) score += 2
      if (context.area === 'comercial' && areaAgents.includes('comercial')) score += 2
      if (context.area === 'financeiro' && areaAgents.includes('financeiro')) score += 2
    }
    
    intentionScores.push({ intention: intentionId as BusinessIntention, score })
  }

  intentionScores.sort((a, b) => b.score - a.score)
  const selectedIntention = intentionScores[0].score > 0 
    ? intentionScores[0].intention 
    : 'general_overview'

  // Extrai entidades básicas por keywords
  const entities: LLMMappingResult['entities'] = {}
  
  if (lowerQuestion.includes('margem')) entities.kpi = 'margem'
  if (lowerQuestion.includes('oee')) entities.kpi = 'oee'
  if (lowerQuestion.includes('otif')) entities.kpi = 'otif'
  if (lowerQuestion.includes('acurácia') || lowerQuestion.includes('acuracia')) entities.kpi = 'acuracia'
  
  if (lowerQuestion.includes('flocão') || lowerQuestion.includes('flocao')) entities.produto = 'flocão'
  if (lowerQuestion.includes('farinha')) entities.produto = 'farinha'
  if (lowerQuestion.includes('pão francês')) entities.produto = 'Pão Francês'
  
  if (lowerQuestion.includes('dezembro')) entities.periodo = 'dezembro'
  if (lowerQuestion.includes('novembro')) entities.periodo = 'novembro'
  
  if (lowerQuestion.includes('linha 1')) entities.linha = 'Linha 1 - Francês'
  if (lowerQuestion.includes('linha 2')) entities.linha = 'Linha 2 - Forma'
  if (lowerQuestion.includes('linha 3')) entities.linha = 'Linha 3 - Doces'

  return {
    intent: selectedIntention,
    confidence: Math.min(0.9, 0.5 + (intentionScores[0].score * 0.1)),
    entities
  }
}

// ==========================================
// CACHE DO LLM MAPPER (PERSISTENTE)
// ==========================================
// Usa Redis (Upstash) em produção, fallback em memória

import { getCachedMapping, setCachedMapping } from './cache'

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================
// LLM apenas mapeia, orquestrador decide o resto

export async function mapQuestionToIntentionWithLLM(
  question: string,
  context?: Record<string, unknown>
): Promise<LLMMappingResult> {
  // Log de debug (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.log('🔍 Mapeando pergunta com LLM:', {
      provider: config.provider,
      hasApiKey: !!config.apiKey,
      question: question.substring(0, 50) + '...'
    })
  }

  // Verifica cache primeiro (Redis ou memória)
  const cached = await getCachedMapping(question, context)
  if (cached) {
    if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
      console.log('💾 Cache hit:', question.substring(0, 50))
    }
    return cached
  }

  // Se não há API key ou provider é 'local', usa fallback
  if (!config.apiKey || config.provider === 'local') {
    if (import.meta.env.DEV) {
      console.log('⚠️ Usando fallback (keywords) - LLM não configurado')
    }
    const result = mapWithKeywords(question, context)
    // Salva no cache mesmo para fallback
    await setCachedMapping(question, context, result)
    return result
  }

  try {
    let result: LLMMappingResult

    switch (config.provider) {
      case 'groq':
        if (import.meta.env.DEV) {
          console.log('🚀 Usando Groq para mapeamento...')
        }
        result = await mapWithGroq(question)
        if (import.meta.env.DEV) {
          console.log('✅ Groq mapeou:', {
            intent: result.intent,
            confidence: result.confidence,
            entities: result.entities
          })
        }
        break
      case 'gemini':
        if (import.meta.env.DEV) {
          console.log('🚀 Usando Gemini para mapeamento...')
        }
        result = await mapWithGemini(question)
        break
      default:
        if (import.meta.env.DEV) {
          console.log('⚠️ Provider não suportado, usando fallback')
        }
        return mapWithKeywords(question, context)
    }

    // Merge entidades do contexto (prioridade)
    if (context) {
      const contextEntities: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(context)) {
        contextEntities[key] = typeof value === 'string' ? value : String(value ?? '')
      }
      result.entities = { ...result.entities, ...contextEntities }
    }

    // Salva no cache (Redis ou memória)
    await setCachedMapping(question, context, result)

    return result
  } catch (error) {
    console.warn('❌ Erro no mapeamento LLM, usando fallback:', error)
    // Sempre tem fallback
    const fallbackResult = mapWithKeywords(question, context)
    // Salva fallback no cache também
    await setCachedMapping(question, context, fallbackResult)
    return fallbackResult
  }
}

export { config as llmConfig }

