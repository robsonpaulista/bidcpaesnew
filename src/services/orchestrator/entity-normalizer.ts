// ==========================================
// NORMALIZAÇÃO E SANITIZAÇÃO DE ENTIDADES
// ==========================================
// Protege contra entidades malformadas do LLM

interface NormalizedEntities {
  kpi?: string
  produto?: string
  periodo?: string
  linha?: string
  area?: string
  fornecedor?: string
  [key: string]: string | undefined
}

interface NormalizationResult {
  entities: NormalizedEntities
  warnings: string[]
  confidencePenalty: number // Reduz confiança se entidades inválidas
}

// ==========================================
// CATÁLOGOS (EM PRODUÇÃO, VIRIAM DO BANCO)
// ==========================================

const VALID_KPIS = [
  'margem', 'margem_bruta', 'margem_liquida',
  'oee', 'otif', 'otd', 'acuracia',
  'receita', 'faturamento', 'perdas', 'inadimplencia'
]

const VALID_PRODUTOS = [
  'flocão', 'flocao', 'farinha', 'pão francês', 'pao frances',
  'pão doce', 'pao doce', 'biscoito', 'bolo'
]

const VALID_LINHAS = [
  'linha 1', 'linha 2', 'linha 3',
  'Linha 1 - Francês', 'Linha 2 - Forma', 'Linha 3 - Doces'
]

const VALID_AREAS = [
  'financeiro', 'comercial', 'producao', 'produção',
  'compras', 'estoque', 'logistica', 'logística'
]

const VALID_PERIODOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  '2024', '2025', '2023'
]

// ==========================================
// FUNÇÕES DE NORMALIZAÇÃO
// ==========================================

function normalizeString(value: string): string {
  // Remove caracteres especiais perigosos
  return value
    .trim()
    .replace(/[;'"\\]/g, '') // Remove caracteres perigosos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .substring(0, 100) // Limita tamanho
}

function normalizePeriodo(periodo: string): { value?: string; warning?: string } {
  const normalized = normalizeString(periodo.toLowerCase())
  
  // Tenta extrair mês e ano
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  
  const mesMatch = meses.find(mes => normalized.includes(mes))
  const anoMatch = normalized.match(/\b(20\d{2})\b/)
  
  if (mesMatch && anoMatch) {
    return { value: `${mesMatch}/${anoMatch[1]}` }
  }
  
  if (mesMatch) {
    return { value: mesMatch }
  }
  
  if (VALID_PERIODOS.some(p => normalized.includes(p))) {
    return { value: normalized }
  }
  
  return {
    warning: `Período não reconhecido: "${periodo}". Use formato "dezembro" ou "dezembro/2024"`
  }
}

function normalizeKPI(kpi: string): { value?: string; warning?: string } {
  const normalized = normalizeString(kpi.toLowerCase())
  
  // Fuzzy match com catálogo
  const match = VALID_KPIS.find(valid => 
    normalized.includes(valid) || valid.includes(normalized)
  )
  
  if (match) {
    return { value: match }
  }
  
  return {
    warning: `KPI não reconhecido: "${kpi}". KPI válidos: ${VALID_KPIS.join(', ')}`
  }
}

function normalizeProduto(produto: string): { value?: string; warning?: string } {
  const normalized = normalizeString(produto.toLowerCase())
  
  // Remove acentos e normaliza
  const normalizedNoAccents = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  
  // Fuzzy match
  const match = VALID_PRODUTOS.find(valid => {
    const validNormalized = valid.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedNoAccents.includes(validNormalized) || validNormalized.includes(normalizedNoAccents)
  })
  
  if (match) {
    return { value: match }
  }
  
  return {
    warning: `Produto não reconhecido: "${produto}". Produtos válidos: ${VALID_PRODUTOS.join(', ')}`
  }
}

function normalizeLinha(linha: string): { value?: string; warning?: string } {
  const normalized = normalizeString(linha.toLowerCase())
  
  // Tenta extrair número da linha
  const linhaMatch = normalized.match(/linha\s*(\d+)/i)
  if (linhaMatch) {
    const num = linhaMatch[1]
    const match = VALID_LINHAS.find(valid => valid.toLowerCase().includes(`linha ${num}`))
    if (match) {
      return { value: match }
    }
  }
  
  // Fuzzy match direto
  const match = VALID_LINHAS.find(valid => 
    normalized.includes(valid.toLowerCase()) || valid.toLowerCase().includes(normalized)
  )
  
  if (match) {
    return { value: match }
  }
  
  return {
    warning: `Linha não reconhecida: "${linha}". Linhas válidas: ${VALID_LINHAS.join(', ')}`
  }
}

function normalizeArea(area: string): { value?: string; warning?: string } {
  const normalized = normalizeString(area.toLowerCase())
  
  const match = VALID_AREAS.find(valid => 
    normalized.includes(valid) || valid.includes(normalized)
  )
  
  if (match) {
    return { value: match }
  }
  
  return {
    warning: `Área não reconhecida: "${area}". Áreas válidas: ${VALID_AREAS.join(', ')}`
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL
// ==========================================

export function normalizeEntities(
  entities: Record<string, unknown>
): NormalizationResult {
  const normalized: NormalizedEntities = {}
  const warnings: string[] = []
  let confidencePenalty = 0

  // Normaliza cada entidade
  if (entities.kpi && typeof entities.kpi === 'string') {
    const result = normalizeKPI(entities.kpi)
    if (result.value) {
      normalized.kpi = result.value
    } else if (result.warning) {
      warnings.push(result.warning)
      confidencePenalty += 0.1
    }
  }

  if (entities.produto && typeof entities.produto === 'string') {
    const result = normalizeProduto(entities.produto)
    if (result.value) {
      normalized.produto = result.value
    } else if (result.warning) {
      warnings.push(result.warning)
      confidencePenalty += 0.1
    }
  }

  if (entities.periodo && typeof entities.periodo === 'string') {
    const result = normalizePeriodo(entities.periodo)
    if (result.value) {
      normalized.periodo = result.value
    } else if (result.warning) {
      warnings.push(result.warning)
      confidencePenalty += 0.05 // Período menos crítico
    }
  }

  if (entities.linha && typeof entities.linha === 'string') {
    const result = normalizeLinha(entities.linha)
    if (result.value) {
      normalized.linha = result.value
    } else if (result.warning) {
      warnings.push(result.warning)
      confidencePenalty += 0.1
    }
  }

  if (entities.area && typeof entities.area === 'string') {
    const result = normalizeArea(entities.area)
    if (result.value) {
      normalized.area = result.value
    } else if (result.warning) {
      warnings.push(result.warning)
      confidencePenalty += 0.05
    }
  }

  // Fornecedor: apenas sanitiza (não valida catálogo por enquanto)
  if (entities.fornecedor && typeof entities.fornecedor === 'string') {
    normalized.fornecedor = normalizeString(entities.fornecedor)
  }

  // Outras entidades: apenas sanitiza
  for (const [key, value] of Object.entries(entities)) {
    if (!['kpi', 'produto', 'periodo', 'linha', 'area', 'fornecedor'].includes(key)) {
      if (typeof value === 'string') {
        normalized[key] = normalizeString(value)
      }
    }
  }

  return {
    entities: normalized,
    warnings,
    confidencePenalty: Math.min(0.3, confidencePenalty) // Máximo 30% de penalidade
  }
}



