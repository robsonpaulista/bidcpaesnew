// ==========================================
// RANKER DE KPIs POR SCORE (DETERMINÍSTICO)
// ==========================================
// Sistema de pontuação por sinônimos/palavras-chave

export interface KPIScore {
  kpiId: string
  score: number
  matchedKeywords: string[]
}

// Pesos por categoria de palavra-chave
const KEYWORD_WEIGHTS = {
  exact: 5,        // Match exato do KPI (ex: "otd", "lead time")
  primary: 3,      // Palavras-chave primárias (ex: "atraso", "caro", "ruim")
  secondary: 2,    // Palavras-chave secundárias (ex: "prazo", "preço", "qualidade")
  context: 1       // Palavras de contexto (ex: "fornecedor", "entrega")
}

// Mapa de keywords por KPI (com pesos implícitos pela ordem)
const KPI_KEYWORDS: Record<string, Array<{ keywords: string[], weight: number }>> = {
  otd_fornecedores: [
    { keywords: ['otd', 'on time delivery'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['atraso', 'atrasando', 'atrasou', 'atrasar', 'demora', 'demorou', 'atrasado'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['prazo', 'no prazo', 'pontualidade', 'pontual'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['entrega no prazo', 'entregas no prazo', 'entrega atrasada'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['fornecedor', 'fornecedores'], weight: KEYWORD_WEIGHTS.context }
  ],
  fill_rate: [
    { keywords: ['fill rate', 'fillrate'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['pedido incompleto', 'pedido faltando', 'faltou item', 'corte no pedido'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['completo', 'completude', 'atendido por completo'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['faltou', 'falta', 'corte'], weight: KEYWORD_WEIGHTS.secondary }
  ],
  lead_time_medio: [
    { keywords: ['lead time', 'leadtime'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['tempo de entrega', 'tempo entre pedido e entrega', 'tempo médio de entrega'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['quantos dias', 'quanto tempo', 'demora', 'demorou'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['prazo médio', 'prazo de entrega'], weight: KEYWORD_WEIGHTS.secondary }
  ],
  nao_conformidades: [
    { keywords: ['qualidade', 'não conformidade', 'nao conformidade', 'não conformidades', 'nao conformidades'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['ruim', 'veio ruim', 'defeito', 'defeituoso', 'fora do padrão', 'reclamação', 'reclamações'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['devolução', 'devoluções', 'troca', 'trocas', 'avaria', 'avarias'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['problema', 'problemas', 'ocorrência', 'ocorrências'], weight: KEYWORD_WEIGHTS.secondary }
  ],
  custo_total_mp: [
    { keywords: ['custo total mp', 'custo total matéria-prima', 'custo total materia-prima'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['caro', 'subiu', 'aumento', 'aumentou', 'inflação', 'reajuste'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['preço', 'preços', 'custo', 'custos', 'gasto', 'gastos'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['variação', 'variacao', 'subindo', 'mais caro', 'custando mais'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['matéria-prima', 'materia-prima', 'matérias-primas', 'materias-primas', 'insumo', 'insumos'], weight: KEYWORD_WEIGHTS.context }
  ],
  cobertura_estoque_mp: [
    { keywords: ['cobertura', 'cobertura estoque', 'cobertura estoque mp'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['dias de estoque', 'dias estoque', 'quanto dura', 'estoque disponível'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['estoque', 'inventário', 'inventario'], weight: KEYWORD_WEIGHTS.secondary }
  ],
  dependencia_fornecedores: [
    { keywords: ['dependência', 'dependencia', 'volume de compras', 'volume compras'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['compramos mais', 'compramos mais de', 'maior fornecedor', 'maiores fornecedores', 'fornecedor principal', 'fornecedores principais'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['de quais fornecedores', 'quais fornecedores', 'fornecedor que compramos', 'fornecedores que compramos'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['mais compras', 'principal fornecedor', 'principais fornecedores', 'concentração', 'concentracao'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['fornecedor', 'fornecedores'], weight: KEYWORD_WEIGHTS.context }
  ],
  // KPIs de Produção
  oee: [
    { keywords: ['oee'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['eficiência global', 'eficiencia global', 'eficiência dos equipamentos', 'eficiencia dos equipamentos'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['eficiência', 'eficiencia', 'efetividade'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['produção', 'producao', 'linha', 'linhas'], weight: KEYWORD_WEIGHTS.context }
  ],
  disponibilidade: [
    { keywords: ['disponibilidade'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['tempo operando', 'tempo funcionando', 'uptime', 'tempo ativo'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['parada', 'paradas', 'downtime'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['máquina', 'maquina', 'equipamento', 'equipamentos'], weight: KEYWORD_WEIGHTS.context }
  ],
  performance: [
    { keywords: ['performance'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['velocidade', 'ritmo', 'cadência'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['rápido', 'rapido', 'lento', 'devagar'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['produção', 'producao', 'linha'], weight: KEYWORD_WEIGHTS.context }
  ],
  qualidade: [
    { keywords: ['qualidade'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['produtos bons', 'produtos aprovados', 'aprovado', 'reprovado'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['defeito', 'defeitos', 'refugo', 'refugos'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['produção', 'producao', 'linha'], weight: KEYWORD_WEIGHTS.context }
  ],
  rendimento: [
    { keywords: ['rendimento', 'rendimento médio', 'rendimento medio'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['aproveitamento', 'utilização', 'utilizacao'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['matéria-prima', 'materia-prima', 'mp'], weight: KEYWORD_WEIGHTS.context }
  ],
  perdas_processo: [
    { keywords: ['perdas processo', 'perdas de processo'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['perdas', 'perda', 'refugo', 'refugos', 'retrabalho', 'retrabalhos'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['desperdício', 'desperdicio', 'massa mole', 'massa dura', 'queimado'], weight: KEYWORD_WEIGHTS.secondary },
    { keywords: ['produção', 'producao', 'linha'], weight: KEYWORD_WEIGHTS.context }
  ],
  producao_total: [
    { keywords: ['produção total', 'producao total', 'volume produzido'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['volume', 'quantidade produzida', 'kg produzido'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['produção', 'producao'], weight: KEYWORD_WEIGHTS.context }
  ],
  mtbf: [
    { keywords: ['mtbf', 'tempo médio entre falhas', 'tempo medio entre falhas'], weight: KEYWORD_WEIGHTS.exact },
    { keywords: ['falhas', 'quebras', 'manutenção', 'manutencao'], weight: KEYWORD_WEIGHTS.primary },
    { keywords: ['equipamento', 'equipamentos', 'máquina', 'maquina'], weight: KEYWORD_WEIGHTS.context }
  ]
}

/**
 * Detecta se a pergunta é sobre "pior insumo" (ranking, não total)
 */
export function isWorstInputQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase()
  const worstKeywords = ['pior', 'qual o pior', 'mais pesado', 'mais caro pra comprar', 'mais caro para comprar', 'pior insumo', 'pior matéria-prima', 'pior materia-prima', 'vilão', 'vilao']
  const inputKeywords = ['insumo', 'insumos', 'matéria-prima', 'materia-prima', 'materias-primas', 'matérias-primas', 'compra', 'comprar', 'compras']
  
  const hasWorst = worstKeywords.some(kw => lowerQuestion.includes(kw))
  const hasInput = inputKeywords.some(kw => lowerQuestion.includes(kw))
  
  return hasWorst && hasInput
}

/**
 * Detecta se a pergunta é sobre preço específico de um insumo (ex: "preço de compra do Leite")
 * Retorna false se a pergunta menciona evolução/período/tendência (deve usar série de preços)
 */
export function isSpecificInputPriceQuestion(question: string): { isPriceQuestion: boolean; inputName?: string } {
  const lowerQuestion = question.toLowerCase()
  const priceKeywords = ['preço', 'preco', 'qual o preço', 'qual o preco', 'quanto custa', 'valor', 'preço de compra', 'preco de compra']
  const hasPriceKeyword = priceKeywords.some(kw => lowerQuestion.includes(kw))
  
  if (!hasPriceKeyword) {
    return { isPriceQuestion: false }
  }
  
  // Se menciona evolução/período/tendência, NÃO é pergunta de preço específico pontual
  const evolutionKeywords = [
    'evolução', 'evolucao', 'evoluir', 'evoluiu',
    'tendência', 'tendencia', 'tendências', 'tendencias',
    'período', 'periodo', 'períodos', 'periodos',
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    'ao longo', 'ao longo do', 'durante', 'no período', 'no periodo',
    'histórico', 'historico', 'histórica', 'historica',
    'série', 'serie', 'séries', 'series',
    'gráfico', 'grafico', 'gráficos', 'graficos'
  ]
  
  const hasEvolutionKeyword = evolutionKeywords.some(kw => lowerQuestion.includes(kw))
  if (hasEvolutionKeyword) {
    // É pergunta sobre evolução, não preço pontual
    return { isPriceQuestion: false }
  }
  
  // Lista de insumos conhecidos (nomes normalizados para busca)
  const knownInputs = [
    'farinha', 'farinha de trigo',
    'margarina',
    'fermento',
    'açúcar', 'acucar', 'açucar', 'acúcar',
    'sal',
    'ovos', 'ovo',
    'leite'
  ]
  
  // Busca o primeiro insumo que aparece na pergunta
  for (const input of knownInputs) {
    if (lowerQuestion.includes(input)) {
      return { isPriceQuestion: true, inputName: input }
    }
  }
  
  return { isPriceQuestion: false }
}

/**
 * Calcula scores para cada KPI baseado em keywords encontradas na pergunta
 */
export function scoreKPIs(question: string): KPIScore[] {
  const lowerQuestion = question.toLowerCase()
  const scores: Record<string, { score: number; matchedKeywords: string[] }> = {}

  // Para cada KPI, verifica keywords e acumula score
  for (const [kpiId, keywordGroups] of Object.entries(KPI_KEYWORDS)) {
    let totalScore = 0
    const matched: string[] = []

    for (const group of keywordGroups) {
      for (const keyword of group.keywords) {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
          totalScore += group.weight
          matched.push(keyword)
        }
      }
    }

    if (totalScore > 0) {
      scores[kpiId] = { score: totalScore, matchedKeywords: matched }
    }
  }

  // Converte para array e ordena por score
  return Object.entries(scores)
    .map(([kpiId, data]) => ({ kpiId, ...data }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Seleciona KPI principal baseado em scores
 * Retorna null se ambíguo (diferença pequena entre 1º e 2º)
 */
export function selectMainKPIFromScores(scores: KPIScore[]): {
  kpiId: string | null
  confidence: number
  isAmbiguous: boolean
  alternativeKpis?: string[]
} {
  if (scores.length === 0) {
    return { kpiId: null, confidence: 0, isAmbiguous: false }
  }

  const topScore = scores[0]
  const secondScore = scores[1]

  // Se só tem um KPI com score, retorna ele
  if (scores.length === 1) {
    return {
      kpiId: topScore.kpiId,
      confidence: Math.min(100, topScore.score * 10), // Normaliza score para 0-100
      isAmbiguous: false
    }
  }

  // Se a diferença entre 1º e 2º for pequena (< 2 pontos), considera ambíguo
  const scoreDiff = topScore.score - (secondScore?.score || 0)
  const isAmbiguous = scoreDiff < 2

  if (isAmbiguous) {
    return {
      kpiId: null,
      confidence: 0,
      isAmbiguous: true,
      alternativeKpis: scores.slice(0, 2).map(s => s.kpiId)
    }
  }

  return {
    kpiId: topScore.kpiId,
    confidence: Math.min(100, topScore.score * 10),
    isAmbiguous: false
  }
}

/**
 * Verifica ambiguidades específicas conhecidas
 */
export function checkKnownAmbiguities(question: string): {
  isAmbiguous: boolean
  alternatives?: string[]
} {
  const lowerQuestion = question.toLowerCase()

  // Ambiguidade: entrega + completo
  if (lowerQuestion.includes('entrega') && 
      (lowerQuestion.includes('completo') || lowerQuestion.includes('faltou') || lowerQuestion.includes('corte'))) {
    return {
      isAmbiguous: true,
      alternatives: ['otd_fornecedores', 'fill_rate']
    }
  }

  // Ambiguidade: prazo + tempo (distinguir OTD vs Lead Time)
  if ((lowerQuestion.includes('prazo') || lowerQuestion.includes('pontualidade')) &&
      (lowerQuestion.includes('tempo') || lowerQuestion.includes('quantos dias'))) {
    // Se menciona "no prazo" ou "pontualidade" → OTD
    if (lowerQuestion.includes('no prazo') || lowerQuestion.includes('pontualidade')) {
      return { isAmbiguous: false }
    }
    // Se menciona "quantos dias" ou "tempo entre" → Lead Time
    if (lowerQuestion.includes('quantos dias') || lowerQuestion.includes('tempo entre')) {
      return { isAmbiguous: false }
    }
    // Caso contrário, ambíguo
    return {
      isAmbiguous: true,
      alternatives: ['otd_fornecedores', 'lead_time_medio']
    }
  }

  return { isAmbiguous: false }
}

/**
 * Detecta se a pergunta é sobre OEE específico de uma linha (ex: "qual o OEE da Linha 1?")
 * Retorna false se a pergunta menciona evolução/período/tendência (deve usar série temporal)
 */
export function isSpecificLineOEEQuestion(question: string): { isOEEQuestion: boolean; lineName?: string } {
  const lowerQuestion = question.toLowerCase()
  const oeeKeywords = ['oee', 'eficiência', 'eficiencia', 'qual o oee', 'qual a eficiência', 'qual a eficiencia']
  const hasOEEKeyword = oeeKeywords.some(kw => lowerQuestion.includes(kw))
  
  if (!hasOEEKeyword) {
    return { isOEEQuestion: false }
  }
  
  // Se menciona evolução/período/tendência, NÃO é pergunta de OEE específico pontual
  const evolutionKeywords = [
    'evolução', 'evolucao', 'evoluir', 'evoluiu',
    'variação', 'variacao', 'variação mensal', 'variacao mensal',
    'tendência', 'tendencia', 'tendências', 'tendencias',
    'período', 'periodo', 'períodos', 'periodos',
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    'ao longo', 'ao longo do', 'durante', 'no período', 'no periodo',
    'histórico', 'historico', 'histórica', 'historica',
    'série', 'serie', 'séries', 'series',
    'gráfico', 'grafico', 'gráficos', 'graficos'
  ]
  
  const hasEvolutionKeyword = evolutionKeywords.some(kw => lowerQuestion.includes(kw))
  if (hasEvolutionKeyword) {
    // É pergunta sobre evolução, não OEE pontual
    return { isOEEQuestion: false }
  }
  
  // Lista de linhas conhecidas
  const knownLines = [
    'linha 1', 'linha 2', 'linha 3', 'linha 4',
    'linha 1 - francês', 'linha 1 - frances',
    'linha 2 - forma',
    'linha 3 - doces',
    'linha 4 - especiais'
  ]
  
  // Busca a primeira linha que aparece na pergunta
  for (const line of knownLines) {
    if (lowerQuestion.includes(line)) {
      return { isOEEQuestion: true, lineName: line }
    }
  }
  
  return { isOEEQuestion: false }
}

/**
 * Detecta se a pergunta é sobre "pior linha" (ranking, não total)
 */
export function isWorstLineQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase()
  
  // Verifica se menciona "linha" (obrigatório)
  const hasLine = lowerQuestion.includes('linha') || lowerQuestion.includes('linhas')
  if (!hasLine) return false
  
  // Palavras-chave que indicam "pior/menor"
  const worstKeywords = [
    'pior', 'menor', 'menos', 'vilão', 'vilao',
    'rendeu menos', 'rendeu pior', 'rendimento menor', 'menor rendimento',
    'qual linha rendeu', 'qual linha tem', 'qual linha teve',
    'linha que rendeu', 'linha com menor', 'linha com pior'
  ]
  
  // Verifica se tem alguma palavra-chave de "pior/menor"
  const hasWorst = worstKeywords.some(kw => lowerQuestion.includes(kw))
  
  // Casos especiais: "qual linha rendeu menos?" ou "qual linha tem menor rendimento?"
  if (lowerQuestion.includes('qual') && lowerQuestion.includes('linha') && 
      (lowerQuestion.includes('rendeu') || lowerQuestion.includes('tem') || lowerQuestion.includes('teve')) &&
      (lowerQuestion.includes('menos') || lowerQuestion.includes('menor') || lowerQuestion.includes('pior'))) {
    return true
  }
  
  return hasWorst && hasLine
}

