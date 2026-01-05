// ==========================================
// AGENTES ESPECIALISTAS
// ==========================================

import { AgentType, AgentResponse } from '../types.js'
import { DataAdapter } from '../adapter.js'
import { mapQuestionToKPI, mapQuestionToKPIs } from './kpi-mapper.js'

// ==========================================
// AGENTE: CUSTOS & MARGEM
// ==========================================

export async function agentCustosMargem(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []

  // Analisa margem por produto
  const marginData = await DataAdapter.get_margin_by_product('dezembro')
  
  // Identifica produtos com margem baixa
  const lowMarginProducts = marginData.products.filter(p => p.margin < 28)
  if (lowMarginProducts.length > 0) {
    findings.push(`${lowMarginProducts.length} produtos com margem abaixo de 28%`)
    lowMarginProducts.forEach(p => {
      evidence.push({
        metric: `Margem ${p.name}`,
        value: `${p.margin}%`,
        comparison: 'Meta: 28%',
        source: 'get_margin_by_product'
      })
    })
  }

  // Analisa breakdown de custos
  if (context?.product) {
    const costData = await DataAdapter.get_cost_breakdown(
      context.product as string,
      'dezembro'
    )
    const mpPercent = costData.breakdown.find(b => b.category === 'Matéria-Prima')?.percent || 0
    if (mpPercent > 65) {
      findings.push('Custo de matéria-prima representa mais de 65% do total')
      recommendations.push('Revisar negociações com fornecedores de MP')
    }
  }

  // KPIs gerais - usa unit do contexto se disponível
  const unit = context?.unit as string | undefined
  const kpis = await DataAdapter.get_kpis_overview('dezembro', unit)
  const margemKPI = kpis.kpis.find(k => k.id === 'margem')
  if (margemKPI && margemKPI.value < 30) {
    findings.push('Margem bruta abaixo de 30%')
    evidence.push({
      metric: 'Margem Bruta',
      value: `${margemKPI.value}%`,
      comparison: 'Meta: 30%',
      source: 'get_kpis_overview'
    })
    recommendations.push('Investigar aumento de custos ou redução de preços')
  }

  const confidence = findings.length > 0 ? 75 : 50

  return {
    agent: 'custos_margem',
    confidence,
    findings,
    evidence,
    recommendations,
    limitations: ['Dados baseados em período mensal', 'Não considera variações sazonais']
  }
}

// ==========================================
// AGENTE: COMPRAS & FORNECEDORES
// ==========================================

import { getPageContext } from '../page-context.js'
import { scoreKPIs, selectMainKPIFromScores, checkKnownAmbiguities, isWorstInputQuestion, isSpecificInputPriceQuestion, isSpecificLineOEEQuestion, isWorstLineQuestion } from './kpi-scorer.js'
import { checkEvidenceForKPI, generateClarificationMessage } from './evidence-checker.js'
import { getKPILabel } from '../kpi-labels.js'
import { formatCurrency, formatValueWithUnit, formatNumber } from '../utils/format.js'
import { getKPIMeta } from '../utils/kpi-metas.js'

// Catálogo fechado de KPIs (seguindo prompt estruturado)
const KPI_CATALOG_IDS: Record<string, string> = {
  'custo_total_mp': 'custo_mp',
  'otd_fornecedores': 'otd',
  'fill_rate': 'fill_rate',
  'lead_time_medio': 'lead_time',
  'cobertura_estoque_mp': 'cobertura',
  'nao_conformidades': 'nao_conformidades',
  'dependencia_fornecedores': 'dependencia_fornecedores'
}

// DEPRECATED - mantido apenas para compatibilidade
function selectMainKPIFromQuestion(question: string): { kpiId: string | null; needsClarification: boolean } {
  const lowerQuestion = question.toLowerCase()
  
  // Detecção de ambiguidades (regra anti-confusão)
  const hasEntrega = lowerQuestion.includes('entrega')
  const hasCompleto = lowerQuestion.includes('completo') || lowerQuestion.includes('faltou') || lowerQuestion.includes('corte')
  const hasPrazo = lowerQuestion.includes('prazo') || lowerQuestion.includes('pontualidade') || lowerQuestion.includes('atraso')
  const hasTempoEntrega = (lowerQuestion.includes('tempo') && lowerQuestion.includes('entrega')) || 
                          lowerQuestion.includes('lead time') || lowerQuestion.includes('demora')
  
  // Ambiguidade: entrega + completo
  if (hasEntrega && hasCompleto) {
    return { kpiId: null, needsClarification: true }
  }
  
  // Ambiguidade: prazo + tempo (distinguir OTD vs Lead Time)
  if (hasPrazo && hasTempoEntrega) {
    if (lowerQuestion.includes('no prazo') || lowerQuestion.includes('pontualidade')) {
      return { kpiId: 'otd_fornecedores', needsClarification: false }
    }
    if (lowerQuestion.includes('quantos dias') || lowerQuestion.includes('tempo entre')) {
      return { kpiId: 'lead_time_medio', needsClarification: false }
    }
    return { kpiId: null, needsClarification: true }
  }
  
  // Regras de seleção (ordem de prioridade conforme prompt)
  
  // 1. OTD Fornecedores
  if (lowerQuestion.includes('prazo') || lowerQuestion.includes('pontualidade') || 
      lowerQuestion.includes('atraso') || lowerQuestion.includes('otd') ||
      (lowerQuestion.includes('entrega') && lowerQuestion.includes('no prazo'))) {
    return { kpiId: 'otd_fornecedores', needsClarification: false }
  }
  
  // 2. Fill Rate
  if (lowerQuestion.includes('pedido incompleto') || lowerQuestion.includes('faltou') ||
      lowerQuestion.includes('corte') || lowerQuestion.includes('atendido parcialmente') ||
      lowerQuestion.includes('fill rate') || (lowerQuestion.includes('pedido') && hasCompleto)) {
    return { kpiId: 'fill_rate', needsClarification: false }
  }
  
  // 3. Lead Time Médio
  if (lowerQuestion.includes('tempo entre pedido e entrega') || lowerQuestion.includes('demora') ||
      lowerQuestion.includes('lead time') || lowerQuestion.includes('prazo médio') ||
      (lowerQuestion.includes('tempo') && lowerQuestion.includes('entrega') && !lowerQuestion.includes('no prazo'))) {
    return { kpiId: 'lead_time_medio', needsClarification: false }
  }
  
  // 4. Não Conformidades
  if (lowerQuestion.includes('qualidade') || lowerQuestion.includes('não conformidade') ||
      lowerQuestion.includes('problema') || lowerQuestion.includes('defeito') ||
      lowerQuestion.includes('reclamação')) {
    return { kpiId: 'nao_conformidades', needsClarification: false }
  }
  
  // 5. Custo Total MP
  if (lowerQuestion.includes('custo total') || lowerQuestion.includes('gasto total') ||
      lowerQuestion.includes('valor gasto com mp') || lowerQuestion.includes('custo mp') ||
      (lowerQuestion.includes('custo') && lowerQuestion.includes('matéria-prima'))) {
    return { kpiId: 'custo_total_mp', needsClarification: false }
  }
  
  // 6. Cobertura Estoque MP
  if (lowerQuestion.includes('dias de estoque') || lowerQuestion.includes('cobertura') ||
      lowerQuestion.includes('quanto dura') || lowerQuestion.includes('estoque disponível')) {
    return { kpiId: 'cobertura_estoque_mp', needsClarification: false }
  }
  
  // Performance comparativo (dados de ranking)
  if (lowerQuestion.includes('performance fornecedores comparativo') ||
      (lowerQuestion.includes('performance fornecedores') && lowerQuestion.includes('comparativo')) ||
      (lowerQuestion.includes('comparativo') && lowerQuestion.includes('fornecedor'))) {
    return { kpiId: 'performance_comparativo', needsClarification: false }
  }
  
  // Não identificado
  return { kpiId: null, needsClarification: true }
}

/**
 * Filtra "Outros" de uma lista, retornando itens válidos e flag se tinha "Outros"
 */
function filterOthers<T extends { name: string }>(items: T[]): { valid: T[]; hadOthers: boolean } {
  const valid = items.filter(item => item.name.toLowerCase() !== 'outros')
  const hadOthers = items.length !== valid.length
  return { valid, hadOthers }
}

/**
 * Formata mensagem de evidência com meta e delta
 */
function formatEvidenceMessage(
  value: number,
  unit: string,
  change?: number,
  meta?: number | null,
  kpiId?: string
): { value: string; comparison?: string } {
  const isCurrency = unit === 'R$'
  const formattedValue = isCurrency 
    ? formatCurrency(value) 
    : formatValueWithUnit(value, unit, false)
  
  const parts: string[] = []
  
  // Adiciona meta se disponível
  if (meta !== null && meta !== undefined && meta > 0) {
    const isBetter = (kpiId === 'otd_fornecedores' || kpiId === 'fill_rate') 
      ? value >= meta 
      : (kpiId === 'nao_conformidades' || kpiId?.includes('lead_time'))
      ? value <= meta
      : null
    
    if (isBetter !== null) {
      const metaText = isCurrency ? formatCurrency(meta) : `${formatNumber(meta, unit === '%' ? 0 : 1)}${unit}`
      parts.push(`meta ${metaText}`)
      if (!isBetter) {
        parts[parts.length - 1] = `abaixo da ${parts[parts.length - 1]}`
      }
    }
  }
  
  // Adiciona delta (variação vs período anterior)
  if (change !== undefined && change !== null) {
    const deltaText = change > 0 ? `+${formatNumber(change, 1)}pp` : `${formatNumber(change, 1)}pp`
    parts.push(`delta ${deltaText} vs período anterior`)
  }
  
  return {
    value: formattedValue,
    comparison: parts.length > 0 ? parts.join(', ') : undefined
  }
}

export async function agentComprasFornecedores(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []
  const limitations: string[] = []
  const kpiConfidence = 0 // Será calculado

  // PASSO 0.1: Detecção especial de preço específico de insumo (ex: "preço de compra do Leite")
  const priceQuestionCheck = isSpecificInputPriceQuestion(question)
  if (priceQuestionCheck.isPriceQuestion && priceQuestionCheck.inputName) {
    const pageContext = getPageContext('compras', 'dezembro')
    
    if (pageContext?.tabelaPrecos && pageContext.tabelaPrecos.length > 0) {
      // Normaliza nome do insumo para busca (remove acentos, lowercase)
      const normalizedInputName = priceQuestionCheck.inputName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      
      // Busca o insumo na tabela (busca parcial e normalizada)
      const inputPrice = pageContext.tabelaPrecos.find(mp => {
        const normalizedMpName = mp.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return normalizedMpName.includes(normalizedInputName) || normalizedInputName.includes(normalizedMpName.split(' ')[0])
      })
      
      if (inputPrice) {
        const formattedPrice = formatValueWithUnit(inputPrice.value, inputPrice.unidade, true)
        findings.push(
          `Preço de compra de ${inputPrice.name}: ${formattedPrice}.`
        )
        
        if (inputPrice.variacao !== 0) {
          const variacaoText = inputPrice.variacao > 0 ? `+${formatNumber(inputPrice.variacao, 1)}%` : `${formatNumber(inputPrice.variacao, 1)}%`
          findings.push(`Variação: ${variacaoText} vs período anterior.`)
          evidence.push({
            metric: `${inputPrice.name} - Preço`,
            value: formattedPrice,
            comparison: `Variação: ${variacaoText}`,
            source: 'tabela'
          })
        } else {
          evidence.push({
            metric: `${inputPrice.name} - Preço`,
            value: formattedPrice,
            comparison: 'Sem variação',
            source: 'tabela'
          })
        }
        
        const finalConfidence = 90
        
        return {
          agent: 'compras_fornecedores',
          confidence: finalConfidence,
          findings,
          evidence,
          recommendations,
          limitations: [],
          thoughtProcess: {
            kpiPrincipal: undefined, // Não é um KPI, é consulta específica
            area: 'compras',
            dataSource: 'tabela',
            kpiConfidence: 95
          }
        }
      } else {
        return {
          agent: 'compras_fornecedores',
          confidence: 0,
          findings: [
            `Não encontrei o preço de "${priceQuestionCheck.inputName}" na tabela de insumos.`,
            'Verifique se o nome do insumo está correto ou consulte a tabela completa.'
          ],
          evidence: [],
          recommendations: [],
          limitations: ['Insumo não encontrado na tabela']
        }
      }
    }
    
    // Se não tem dados, informa
    return {
      agent: 'compras_fornecedores',
      confidence: 0,
      findings: [
        'Não consegui ler os dados de preços de insumos da página agora.',
        'Você está com o painel de Compras carregado?'
      ],
      evidence: [],
      recommendations: [],
      limitations: ['Dados não disponíveis no contexto da página']
    }
  }

  // PASSO 0.2: Detecção especial de evolução de preços
  // Detecta quando a pergunta pede preços de um insumo específico em um período
  const lowerQuestion = question.toLowerCase()
  
  // Palavras-chave que indicam evolução/série temporal
  const evolutionKeywords = [
    'evolução', 'evolucao', 'evoluir', 'evoluiu',
    'variação', 'variacao', 'variações', 'variacoes', 'variação mensal', 'variacao mensal',
    'tendência', 'tendencia', 'tendências', 'tendencias',
    'período', 'periodo', 'períodos', 'periodos',
    'ao longo', 'ao longo do', 'durante', 'no período', 'no periodo',
    'histórico', 'historico', 'histórica', 'historica',
    'série', 'serie', 'séries', 'series',
    'gráfico', 'grafico', 'gráficos', 'graficos',
    'me mostre', 'mostre', 'mostrar', 'mostrar os', 'mostrar as'
  ]
  
  // Verifica se menciona período (meses)
  const monthKeywords = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
    'janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  const hasMonthKeyword = monthKeywords.some(kw => {
    // Verifica se o mês está isolado (não parte de outra palavra)
    // Usa word boundary ou verifica caracteres ao redor
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    if (regex.test(lowerQuestion)) return true
    
    // Fallback: verifica se está rodeado por espaços, pontuação ou início/fim
    const pos = lowerQuestion.indexOf(kw)
    if (pos === -1) return false
    const before = pos > 0 ? lowerQuestion[pos - 1] : ' '
    const after = pos + kw.length < lowerQuestion.length ? lowerQuestion[pos + kw.length] : ' '
    return (/[\s,.\-]/.test(before) || pos === 0) && (/[\s,.\-?]/.test(after) || pos + kw.length === lowerQuestion.length)
  })
  
  // Verifica se menciona "a" ou "até" entre meses (indica período)
  const hasPeriodConnector = (lowerQuestion.includes(' a ') || 
                              lowerQuestion.includes(' até ') || 
                              lowerQuestion.includes(' ate ')) && hasMonthKeyword
  
  // Normaliza a pergunta para busca sem acentos
  const normalizedQuestion = lowerQuestion.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const hasEvolutionKeyword = evolutionKeywords.some(kw => {
    const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedQuestion.includes(normalizedKw)
  })
  
  // Detecta "preço" ou "preços" (singular e plural)
  // Busca por "pre" seguido de caracteres até "os" (captura "preços" mesmo com encoding diferente)
  const hasPriceKeyword = /pre.*?os/i.test(lowerQuestion) || 
                          lowerQuestion.includes('preço') || 
                          lowerQuestion.includes('preco') || 
                          lowerQuestion.includes('preços') || 
                          lowerQuestion.includes('precos') ||
                          normalizedQuestion.includes('preco') || 
                          normalizedQuestion.includes('precos')
  
  const hasInputKeyword = ['farinha', 'margarina', 'fermento', 'açúcar', 'acucar', 'leite', 'ovos', 'sal'].some(kw => {
    const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedQuestion.includes(normalizedKw)
  })
  
  // Detecta evolução se:
  // 1. Tem palavra-chave explícita de evolução + preço + insumo, OU
  // 2. Tem período (meses) + preço + insumo (mesmo sem palavra "evolução")
  const isEvolutionQuestion = (hasEvolutionKeyword && hasPriceKeyword && hasInputKeyword) ||
                              (hasMonthKeyword && hasPeriodConnector && hasPriceKeyword && hasInputKeyword)
  
  if (isEvolutionQuestion) {
    const pageContext = getPageContext('compras', 'dezembro')
    
    if (pageContext?.seriePrecos && pageContext.seriePrecos.length > 0) {
      // Extrai o insumo mencionado
      let targetInput: string | null = null
      const inputMap: Record<string, string> = {
        'farinha': 'farinha',
        'margarina': 'margarina',
        'fermento': 'fermento',
        'açúcar': 'farinha', // Não tem açúcar na série, usa farinha como fallback
        'acucar': 'farinha',
        'leite': 'farinha', // Não tem leite na série
        'ovos': 'farinha', // Não tem ovos na série
        'sal': 'farinha' // Não tem sal na série
      }
      
      for (const [input, serieKey] of Object.entries(inputMap)) {
        if (lowerQuestion.includes(input)) {
          targetInput = serieKey
          break
        }
      }
      
      if (targetInput && (targetInput === 'farinha' || targetInput === 'margarina' || targetInput === 'fermento')) {
        // Extrai período se mencionado (ex: "jan a ago", "agosto a outubro")
        const monthMap: Record<string, string> = {
          // Abreviações (ordem: mais específicas primeiro para evitar falsos positivos)
          'ago': 'Ago', 'set': 'Set', 'out': 'Out', 'nov': 'Nov', 'dez': 'Dez',
          'jan': 'Jan', 'fev': 'Fev', 'abr': 'Abr', 'mai': 'Mai', 'jun': 'Jun', 'jul': 'Jul',
          'mar': 'Mar', // Deixar por último para evitar match com "margarina"
          // Nomes completos
          'agosto': 'Ago', 'setembro': 'Set', 'outubro': 'Out', 'novembro': 'Nov', 'dezembro': 'Dez',
          'janeiro': 'Jan', 'fevereiro': 'Fev', 'abril': 'Abr', 'maio': 'Mai', 'junho': 'Jun',
          'julho': 'Jul', 'março': 'Mar', 'marco': 'Mar'
        }
        
        // Ordem dos meses para determinar qual é início e qual é fim
        const monthOrder: Record<string, number> = {
          'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4,
          'Mai': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8,
          'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
        }
        
        let startMonth: string | null = null
        let endMonth: string | null = null
        const foundMonths: Array<{ abbr: string; full: string; position: number }> = []
        
        // Função para verificar se é um mês isolado (não parte de outra palavra)
        const isIsolatedMonth = (text: string, monthAbbr: string, position: number): boolean => {
          // Usa word boundary para verificar se está isolado
          const before = position > 0 ? text[position - 1] : ' '
          const after = position + monthAbbr.length < text.length ? text[position + monthAbbr.length] : ' '
          // Verifica se está rodeado por espaços, pontuação ou início/fim da string
          return (/[\s,.\-]/.test(before) || position === 0) && (/[\s,.\-?]/.test(after) || position + monthAbbr.length === text.length)
        }
        
        // Busca todos os meses mencionados na pergunta (apenas meses isolados)
        // Primeiro busca nomes completos (mais específicos), depois abreviações
        const sortedMonthEntries = Object.entries(monthMap).sort((a, b) => {
          // Nomes completos primeiro (mais longos)
          if (a[0].length !== b[0].length) return b[0].length - a[0].length
          return a[0].localeCompare(b[0])
        })
        
        for (const [abbr, full] of sortedMonthEntries) {
          let searchPos = 0
          while (true) {
            const position = lowerQuestion.indexOf(abbr, searchPos)
            if (position === -1) break
            
            // Verifica se é um mês isolado (não parte de outra palavra como "margarina")
            if (isIsolatedMonth(lowerQuestion, abbr, position)) {
              // Verifica se já não foi adicionado (evita duplicatas)
              const alreadyFound = foundMonths.some(m => m.full === full)
              if (!alreadyFound) {
                foundMonths.push({ abbr, full, position })
              }
            }
            
            searchPos = position + 1
          }
        }
        
        // Remove duplicatas (mesmo mês encontrado múltiplas vezes)
        const uniqueMonths = foundMonths.filter((m, idx, arr) => 
          arr.findIndex(x => x.full === m.full) === idx
        )
        
        // Ordena por posição na string (da esquerda para direita)
        uniqueMonths.sort((a, b) => a.position - b.position)
        
        if (uniqueMonths.length >= 2) {
          // Se encontrou 2 ou mais meses, pega o primeiro e o último
          startMonth = uniqueMonths[0].full
          endMonth = uniqueMonths[uniqueMonths.length - 1].full
          
          // Verifica se a ordem está correta (início antes de fim)
          if (monthOrder[startMonth] > monthOrder[endMonth]) {
            // Se está invertido, troca
            const temp = startMonth
            startMonth = endMonth
            endMonth = temp
          }
        } else if (uniqueMonths.length === 1) {
          // Se encontrou apenas um mês, usa como início
          startMonth = uniqueMonths[0].full
          // Tenta inferir o fim pela palavra "a" ou "até"
          const monthIndex = lowerQuestion.indexOf(uniqueMonths[0].abbr)
          const afterMonth = lowerQuestion.substring(monthIndex + uniqueMonths[0].abbr.length)
          if (afterMonth.includes(' a ') || afterMonth.includes(' até ') || afterMonth.includes(' ate ')) {
            // Procura outro mês depois de "a" ou "até"
            for (const [abbr, full] of Object.entries(monthMap)) {
              if (afterMonth.includes(abbr) && abbr !== uniqueMonths[0].abbr) {
                const pos = afterMonth.indexOf(abbr)
                if (isIsolatedMonth(afterMonth, abbr, pos)) {
                  endMonth = full
                  break
                }
              }
            }
          }
        }
        
        // Filtra série de preços pelo período
        let filteredSeries = pageContext.seriePrecos
        if (startMonth && endMonth) {
          const startIndex = filteredSeries.findIndex(m => m.name === startMonth)
          const endIndex = filteredSeries.findIndex(m => m.name === endMonth)
          if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
            filteredSeries = filteredSeries.slice(startIndex, endIndex + 1)
          }
        }
        
        // Analisa a evolução
        const inputLabel = targetInput === 'farinha' ? 'Farinha de Trigo' : 
                          targetInput === 'margarina' ? 'Margarina' : 'Fermento'
        
        const prices = filteredSeries
          .map(m => m[targetInput as 'farinha' | 'margarina' | 'fermento'])
          .filter((p): p is number => p !== undefined)
        
        if (prices.length > 0) {
          const firstPrice = prices[0]
          const lastPrice = prices[prices.length - 1]
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
          const variation = ((lastPrice - firstPrice) / firstPrice) * 100
          
          // Formata o período para exibição
          let periodLabel = ''
          if (startMonth && endMonth) {
            periodLabel = ` (${startMonth} a ${endMonth})`
          } else if (startMonth) {
            periodLabel = ` (a partir de ${startMonth})`
          }
          
          // Monta análise completa do período
          findings.push(
            `Evolução do preço de compra de ${inputLabel}${periodLabel}:`
          )
          
          // Análise resumida
          findings.push(
            `• Preço inicial (${filteredSeries[0].name}): ${formatValueWithUnit(firstPrice, 'kg', true)}`
          )
          findings.push(
            `• Preço final (${filteredSeries[filteredSeries.length - 1].name}): ${formatValueWithUnit(lastPrice, 'kg', true)}`
          )
          findings.push(
            `• Variação no período: ${variation > 0 ? '+' : ''}${formatNumber(variation, 1)}%`
          )
          
          // Análise detalhada
          if (filteredSeries.length > 2) {
            findings.push(
              `• Preço médio: ${formatValueWithUnit(avgPrice, 'kg', true)}`
            )
            findings.push(
              `• Menor preço: ${formatValueWithUnit(minPrice, 'kg', true)}`
            )
            findings.push(
              `• Maior preço: ${formatValueWithUnit(maxPrice, 'kg', true)}`
            )
          }
          
          // Adiciona TODAS as evidências mês a mês do período solicitado
          filteredSeries.forEach(mes => {
            const price = mes[targetInput as 'farinha' | 'margarina' | 'fermento']
            if (price !== undefined) {
              evidence.push({
                metric: `${inputLabel} - ${mes.name}`,
                value: formatValueWithUnit(price, 'kg', true),
                source: 'serie_precos'
              })
            }
          })
          
          // Se não encontrou evidências, pode ser que o período não tenha dados
          if (evidence.length === 0) {
            findings.push('Não encontrei dados de preços para o período solicitado.')
            limitations.push('Período sem dados disponíveis')
          }
          
          if (variation > 5) {
            recommendations.push('O preço apresentou aumento significativo no período. Considere negociar contratos de longo prazo ou buscar alternativas de fornecedores.')
          } else if (variation < -5) {
            recommendations.push('O preço apresentou redução no período. Aproveite para negociar melhores condições ou aumentar o volume de compras.')
          }
          
          return {
            agent: 'compras_fornecedores',
            confidence: 90,
            findings,
            evidence,
            recommendations,
            limitations: [],
            thoughtProcess: {
              kpiPrincipal: 'evolucao_precos',
              area: 'compras',
              dataSource: 'page_context',
              kpiConfidence: 90
            }
          }
        }
      }
    }
  }

  // PASSO 0.3: Detecção especial de "pior insumo" ANTES do scoring normal
  if (isWorstInputQuestion(question)) {
    const pageContext = getPageContext('compras', 'dezembro')
    
    if (pageContext?.tabelaPrecos && pageContext.tabelaPrecos.length > 0) {
      // Filtra "Outros" e pega top 1 por aumento
      const { valid: precosValidos, hadOthers } = filterOthers(pageContext.tabelaPrecos)
      const topAumento = precosValidos
        .filter(mp => mp.variacao > 0)
        .sort((a, b) => b.variacao - a.variacao)[0]
      
      if (topAumento) {
        const formattedPrice = formatValueWithUnit(topAumento.value, topAumento.unidade, true)
        findings.push(
          `O pior insumo do mês, pelo aumento de preço, foi ${topAumento.name} (+${formatNumber(topAumento.variacao, 1)}%). ` +
          `Preço atual: ${formattedPrice}.`
        )
        evidence.push({
          metric: `${topAumento.name} - Variação`,
          value: `+${formatNumber(topAumento.variacao, 1)}%`,
          comparison: `Preço: ${formattedPrice}`,
          source: 'tabela'
        })
        
        if (hadOthers) {
          findings.push('Nota: "Outros" é um agrupamento. Para detalhes, abra a tabela de insumos.')
        }
        
        // Confiança alta para "worst_input" detectado
        const finalConfidence = 85
        
        return {
          agent: 'compras_fornecedores',
          confidence: finalConfidence,
          findings,
          evidence,
          recommendations,
          limitations: [],
          thoughtProcess: {
            kpiPrincipal: 'custo_mp', // Contexto, não KPI principal
            area: 'compras',
            dataSource: 'tabela',
            kpiConfidence: 90 // Alta confiança na detecção de "worst_input"
          }
        }
      }
    }
    
    // Se não tem dados, informa
    return {
      agent: 'compras_fornecedores',
      confidence: 0,
      findings: [
        'Não consegui ler os dados de preços de insumos da página agora.',
        'Você está com o painel de Compras carregado?'
      ],
      evidence: [],
      recommendations: [],
      limitations: ['Dados não disponíveis no contexto da página']
    }
  }

  // PASSO 1: PRIMEIRO classifica KPI (usando score determinístico)
  const scores = scoreKPIs(question)
  const selection = selectMainKPIFromScores(scores)
  const kpiConfidenceValue = selection.confidence
  
  // PASSO 2: Verifica ambiguidade real (2 KPIs competindo)
  if (selection.isAmbiguous || !selection.kpiId) {
    // Pega IDs dos KPIs (filtra nulos/undefined)
    let altKpiIds = scores.slice(0, 3)
      .map(s => s.kpiId)
      .filter((id): id is string => !!id)
    
    // Se não há KPIs pontuados, oferece todos os KPIs disponíveis
    if (altKpiIds.length === 0) {
      altKpiIds = Object.keys(KPI_CATALOG_IDS) // Todos os KPIs disponíveis
    }
    
    const clarification = generateClarificationMessage(altKpiIds, question)
    
    // Formata mensagem incluindo as opções sugeridas
    const findingsList: string[] = [clarification.message]
    
    if (clarification.options.length > 0) {
      findingsList.push('')
      findingsList.push('Indicadores sugeridos:')
      clarification.options.forEach(opt => {
        findingsList.push(`• ${opt}`)
      })
    }
    
    return {
      agent: 'compras_fornecedores',
      confidence: 0,
      findings: findingsList,
      evidence: [],
      recommendations: [],
      limitations: ['Pergunta ambígua - precisa esclarecimento'],
      thoughtProcess: {
        kpiPrincipal: undefined,
        area: 'compras',
        dataSource: 'page_context',
        kpiConfidence: 0
      }
    }
  }
  
  // PASSO 3: DEPOIS busca contexto da página
  const pageContext = getPageContext('compras', 'dezembro')
  
  // PASSO 4: Verifica evidência mínima para o KPI selecionado
  const evidenceCheck = checkEvidenceForKPI(selection.kpiId, pageContext)
  
  if (!evidenceCheck.hasMinimumEvidence) {
    return {
      agent: 'compras_fornecedores',
      confidence: 0,
      findings: [
        `Não consegui ler os dados de ${getKPILabel('compras', selection.kpiId)} da página agora.`,
        'Você está com o painel de Compras carregado? (se sim, diga o período: mês atual / 30 dias)'
      ],
      evidence: [],
      recommendations: [],
      limitations: ['Dados não disponíveis no contexto da página'],
      thoughtProcess: {
        kpiPrincipal: undefined,
        area: 'compras',
        dataSource: 'page_context',
        kpiConfidence: kpiConfidenceValue
      }
    }
  }
  
  // PASSO 5: Mapeia KPI ID para backend ID
  const backendKpiId = KPI_CATALOG_IDS[selection.kpiId]
  if (!backendKpiId) {
    return {
      agent: 'compras_fornecedores',
      confidence: kpiConfidenceValue,
      findings: [`KPI ${selection.kpiId} não está mapeado no sistema`],
      evidence: [],
      recommendations: [],
      limitations: ['KPI não encontrado no catálogo'],
      thoughtProcess: {
        kpiPrincipal: undefined,
        area: 'compras',
        dataSource: 'page_context',
        kpiConfidence: kpiConfidenceValue
      }
    }
  }
  
  // PASSO 6: Busca dados do KPI no contexto (se aplicável)
  // Alguns KPIs não têm card (ex: dependencia_fornecedores), apenas ranking
  const kpi = selection.kpiId !== 'dependencia_fornecedores' 
    ? pageContext?.kpis.find(k => k.id === backendKpiId)
    : null
  
  // Para KPIs com card, valida se encontrou
  if (selection.kpiId !== 'dependencia_fornecedores' && !kpi) {
    return {
      agent: 'compras_fornecedores',
      confidence: kpiConfidenceValue,
      findings: [`Não encontrei dados para ${getKPILabel('compras', selection.kpiId)}`],
      evidence: [],
      recommendations: [],
      limitations: ['KPI não encontrado nos dados'],
      thoughtProcess: {
        kpiPrincipal: backendKpiId,
        area: 'compras',
        dataSource: 'page_context',
        kpiConfidence: kpiConfidenceValue
      }
    }
  }
  
  // PASSO 7: Monta resposta com dados do KPI (com formatação melhor) - apenas se tem card
  if (kpi) {
    const meta = getKPIMeta('compras', selection.kpiId) || getKPIMeta('compras', backendKpiId)
    const kpiValue = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value)) || 0
    const formattedEvidence = formatEvidenceMessage(kpiValue, kpi.unit || '', kpi.change, meta, selection.kpiId)
    
    // Monta mensagem de finding melhorada
    let findingMsg = `${kpi.label}: ${formattedEvidence.value}`
    if (formattedEvidence.comparison) {
      findingMsg += ` (${formattedEvidence.comparison})`
    }
    findings.push(findingMsg)
    
    evidence.push({
      metric: kpi.label,
      value: formattedEvidence.value,
      comparison: formattedEvidence.comparison,
      source: 'card'
    })
  }
  
  // PASSO 8: Adiciona dados relacionados do ranking quando aplicável
  if (pageContext && pageContext.rankingFornecedores && pageContext.rankingFornecedores.length > 0) {
    if (selection.kpiId === 'otd_fornecedores') {
      const { valid: fornecedoresValidos, hadOthers } = filterOthers(pageContext.rankingFornecedores)
      const fornecedoresBaixos = fornecedoresValidos
        .filter(f => f.otd < 90)
        .sort((a, b) => a.otd - b.otd)
        .slice(0, 3) // Top 3 piores
      
      if (fornecedoresBaixos.length > 0) {
        const nomes = fornecedoresBaixos.map(f => f.name).join(', ')
        findings.push(`Piores atrasos: ${nomes}.`)
        
        fornecedoresBaixos.forEach(f => {
          evidence.push({
            metric: `${f.name} - OTD`,
            value: `${formatNumber(f.otd, 1)}%`,
            comparison: `Qualidade: ${formatNumber(f.qualidade, 1)}%`,
            source: 'ranking'
          })
        })
        recommendations.push('Revisar contratos e penalidades por atraso com fornecedores abaixo de 90%')
        
        if (hadOthers) {
          findings.push('Nota: "Outros" é um agrupamento. Para detalhes, abra a tabela de fornecedores.')
        }
      }
    }
    
    if (selection.kpiId === 'nao_conformidades') {
      const { valid: fornecedoresValidos, hadOthers } = filterOthers(pageContext.rankingFornecedores)
      const fornecedoresBaixos = fornecedoresValidos
        .filter(f => f.qualidade < 95)
        .sort((a, b) => a.qualidade - b.qualidade)
        .slice(0, 3) // Top 3 piores
      
      if (fornecedoresBaixos.length > 0) {
        const nomes = fornecedoresBaixos.map(f => f.name).join(', ')
        findings.push(`${fornecedoresBaixos.length} fornecedores com qualidade abaixo de 95%: ${nomes}.`)
        
        fornecedoresBaixos.forEach(f => {
          evidence.push({
            metric: `${f.name} - Qualidade`,
            value: `${formatNumber(f.qualidade, 1)}%`,
            comparison: `OTD: ${formatNumber(f.otd, 1)}%`,
            source: 'ranking'
          })
        })
        recommendations.push('Implementar auditorias de qualidade para fornecedores abaixo de 95%')
        
        if (hadOthers) {
          findings.push('Nota: "Outros" é um agrupamento. Para detalhes, abra a tabela de fornecedores.')
        }
      }
    }

    if (selection.kpiId === 'dependencia_fornecedores') {
      const { valid: fornecedoresValidos, hadOthers } = filterOthers(pageContext.rankingFornecedores)
      const fornecedoresOrdenados = fornecedoresValidos
        .filter(f => typeof f.dependencia === 'number' && f.dependencia > 0)
        .sort((a, b) => b.dependencia - a.dependencia) // Maior para menor
        .slice(0, 5) // Top 5 maiores
      
      if (fornecedoresOrdenados.length > 0) {
        const fornecedorPrincipal = fornecedoresOrdenados[0]
        findings.push(`Fornecedor principal: ${fornecedorPrincipal.name} com ${formatNumber(fornecedorPrincipal.dependencia, 1)}% de dependência.`)
        
        if (fornecedoresOrdenados.length > 1) {
          const outrosPrincipais = fornecedoresOrdenados.slice(1, 4).map(f => 
            `${f.name} (${formatNumber(f.dependencia, 1)}%)`
          ).join(', ')
          findings.push(`Outros principais: ${outrosPrincipais}.`)
        }
        
        fornecedoresOrdenados.forEach(f => {
          evidence.push({
            metric: `${f.name} - Dependência`,
            value: `${formatNumber(f.dependencia, 1)}%`,
            comparison: `OTD: ${formatNumber(f.otd, 1)}% | Qualidade: ${formatNumber(f.qualidade, 1)}%`,
            source: 'ranking'
          })
        })
        
        const totalDependencia = fornecedoresOrdenados.reduce((sum, f) => sum + f.dependencia, 0)
        if (totalDependencia > 70) {
          recommendations.push('Alta concentração de compras. Considere diversificar fornecedores para reduzir riscos.')
        }
        
        if (hadOthers) {
          findings.push('Nota: "Outros" é um agrupamento. Para detalhes, abra a tabela de fornecedores.')
        }
      }
    }
  }
  
  // PASSO 9: Adiciona dados de custo/preço quando aplicável (NÃO para "worst_input", já tratado acima)
  if (selection.kpiId === 'custo_total_mp' && pageContext && pageContext.tabelaPrecos && pageContext.tabelaPrecos.length > 0) {
    const { valid: precosValidos, hadOthers } = filterOthers(pageContext.tabelaPrecos)
    const topAumentos = precosValidos
      .filter(mp => mp.variacao > 0)
      .sort((a, b) => b.variacao - a.variacao)
      .slice(0, 3) // Top 3 com maior aumento
    
    if (topAumentos.length > 0) {
      const nomes = topAumentos.map(mp => `${mp.name} (+${formatNumber(mp.variacao, 1)}%)`).join(', ')
      findings.push(`Top insumos com maior aumento: ${nomes}.`)
      
      topAumentos.forEach(mp => {
        const formattedPrice = formatValueWithUnit(mp.value, mp.unidade, true)
        evidence.push({
          metric: mp.name,
          value: formattedPrice,
          comparison: `Variação: +${formatNumber(mp.variacao, 1)}%`,
          source: 'tabela'
        })
      })
      
      if (hadOthers) {
        findings.push('Nota: "Outros" é um agrupamento. Para detalhes, abra a tabela de insumos.')
      }
    }
  }
  
  // PASSO 10: Calcula confiança final (kpiConfidence * 0.6 + evidenceQuality * 0.4)
  const evidenceQuality = evidence.length >= 2 ? 90 : evidence.length === 1 ? 70 : 50
  const finalConfidence = Math.round(kpiConfidenceValue * 0.6 + evidenceQuality * 0.4)
  
  // PASSO 11: Retorna resposta completa
  return {
    agent: 'compras_fornecedores',
    confidence: finalConfidence,
    findings,
    evidence,
    recommendations,
    limitations: [],
    thoughtProcess: {
      kpiPrincipal: backendKpiId,
      area: 'compras',
      dataSource: 'page_context',
      kpiConfidence: kpiConfidenceValue
    }
  }
}

// ==========================================
// AGENTE: PRODUÇÃO
// ==========================================

export async function agentProducao(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []
  const limitations: string[] = []
  const kpiConfidence = 0 // Será calculado

  // PASSO 0.1: Detecção especial de OEE específico de linha (ex: "qual o OEE da Linha 1?")
  const oeeQuestionCheck = isSpecificLineOEEQuestion(question)
  if (oeeQuestionCheck.isOEEQuestion && oeeQuestionCheck.lineName) {
    const pageContext = getPageContext('producao', 'dezembro')
    
    if (pageContext?.rendimentoLinhas && pageContext.rendimentoLinhas.length > 0) {
      // Busca a linha na tabela de rendimento (que tem OEE implícito)
      const line = pageContext.rendimentoLinhas.find(l => {
        const normalizedLineName = oeeQuestionCheck.lineName!.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const normalizedLName = l.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return normalizedLName.includes(normalizedLineName) || normalizedLineName.includes(normalizedLName.split(' ')[0])
      })
      
      if (line) {
        // Busca OEE atual nos KPIs
        const oeeKPI = pageContext.kpis.find(k => k.id === 'oee')
        const oeeValue = typeof oeeKPI?.value === 'number' ? oeeKPI.value : 0
        
        findings.push(
          `OEE da ${line.name}: ${formatNumber(oeeValue, 1)}%`
        )
        
        if (oeeKPI?.change !== undefined) {
          const changeText = oeeKPI.change > 0 ? `+${formatNumber(oeeKPI.change, 1)}%` : `${formatNumber(oeeKPI.change, 1)}%`
          findings.push(`Variação: ${changeText} vs período anterior.`)
          evidence.push({
            metric: `${line.name} - OEE`,
            value: `${formatNumber(oeeValue, 1)}%`,
            comparison: `Variação: ${changeText}`,
            source: 'page_context'
          })
        } else {
          evidence.push({
            metric: `${line.name} - OEE`,
            value: `${formatNumber(oeeValue, 1)}%`,
            source: 'page_context'
          })
        }
        
        // Adiciona rendimento da linha
        if (line.rendimento) {
          findings.push(`Rendimento: ${formatNumber(line.rendimento, 1)}% (Meta: ${formatNumber(line.meta, 1)}%)`)
          evidence.push({
            metric: `${line.name} - Rendimento`,
            value: `${formatNumber(line.rendimento, 1)}%`,
            comparison: `Meta: ${formatNumber(line.meta, 1)}%`,
            source: 'page_context'
          })
        }
        
        const finalConfidence = 90
        
        return {
          agent: 'producao',
          confidence: finalConfidence,
          findings,
          evidence,
          recommendations,
          limitations: [],
          thoughtProcess: {
            kpiPrincipal: 'oee',
            area: 'producao',
            dataSource: 'page_context',
            kpiConfidence: 95
          }
        }
      }
    }
    
    // Se não tem dados, informa
    return {
      agent: 'producao',
      confidence: 0,
      findings: [
        'Não consegui ler os dados de OEE da página agora.',
        'Você está com o painel de Produção carregado?'
      ],
      evidence: [],
      recommendations: [],
      limitations: ['Dados não disponíveis no contexto da página']
    }
  }

  // PASSO 0.2: Detecção especial de evolução de OEE/indicadores
  // Detecta quando a pergunta pede evolução de indicadores em um período
  const lowerQuestion = question.toLowerCase()
  
  // Palavras-chave que indicam evolução/série temporal
  const evolutionKeywords = [
    'evolução', 'evolucao', 'evoluir', 'evoluiu',
    'variação', 'variacao', 'variações', 'variacoes', 'variação mensal', 'variacao mensal',
    'tendência', 'tendencia', 'tendências', 'tendencias',
    'período', 'periodo', 'períodos', 'periodos',
    'ao longo', 'ao longo do', 'durante', 'no período', 'no periodo',
    'histórico', 'historico', 'histórica', 'historica',
    'série', 'serie', 'séries', 'series',
    'gráfico', 'grafico', 'gráficos', 'graficos',
    'me mostre', 'mostre', 'mostrar', 'mostrar os', 'mostrar as'
  ]
  
  // Verifica se menciona período (meses)
  const monthKeywords = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
    'janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  const hasMonthKeyword = monthKeywords.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    if (regex.test(lowerQuestion)) return true
    
    const pos = lowerQuestion.indexOf(kw)
    if (pos === -1) return false
    const before = pos > 0 ? lowerQuestion[pos - 1] : ' '
    const after = pos + kw.length < lowerQuestion.length ? lowerQuestion[pos + kw.length] : ' '
    return (/[\s,.\-]/.test(before) || pos === 0) && (/[\s,.\-?]/.test(after) || pos + kw.length === lowerQuestion.length)
  })
  
  // Verifica se menciona "a" ou "até" entre meses (indica período)
  const hasPeriodConnector = (lowerQuestion.includes(' a ') || 
                              lowerQuestion.includes(' até ') || 
                              lowerQuestion.includes(' ate ')) && hasMonthKeyword
  
  // Normaliza a pergunta para busca sem acentos
  const normalizedQuestion = lowerQuestion.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  const hasEvolutionKeyword = evolutionKeywords.some(kw => {
    const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalizedQuestion.includes(normalizedKw)
  })
  
  // Detecta indicadores de produção mencionados
  const indicatorKeywords = ['oee', 'disponibilidade', 'performance', 'qualidade', 'rendimento', 'perdas']
  const hasIndicatorKeyword = indicatorKeywords.some(kw => lowerQuestion.includes(kw))
  
  // Detecta linha mencionada (opcional)
  const lineKeywords = ['linha 1', 'linha 2', 'linha 3', 'linha 4', 'francês', 'frances', 'forma', 'doces', 'especiais']
  const hasLineKeyword = lineKeywords.some(kw => lowerQuestion.includes(kw))
  
  // Detecta evolução se:
  // 1. Tem palavra-chave explícita de evolução + indicador + (opcionalmente) linha, OU
  // 2. Tem período (meses) + indicador + (opcionalmente) linha
  const isEvolutionQuestion = (hasEvolutionKeyword && hasIndicatorKeyword) ||
                              (hasMonthKeyword && hasPeriodConnector && hasIndicatorKeyword)
  
  if (isEvolutionQuestion) {
    const pageContext = getPageContext('producao', 'dezembro')
    
    if (pageContext?.serieOEE && pageContext.serieOEE.length > 0) {
      // Determina qual indicador analisar
      let targetIndicator: 'oee' | 'disponibilidade' | 'performance' | 'qualidade' | null = null
      if (lowerQuestion.includes('oee')) {
        targetIndicator = 'oee'
      } else if (lowerQuestion.includes('disponibilidade')) {
        targetIndicator = 'disponibilidade'
      } else if (lowerQuestion.includes('performance')) {
        targetIndicator = 'performance'
      } else if (lowerQuestion.includes('qualidade')) {
        targetIndicator = 'qualidade'
      } else {
        // Default: OEE
        targetIndicator = 'oee'
      }
      
      // Extrai período se mencionado
      const monthMap: Record<string, string> = {
        'ago': 'Ago', 'set': 'Set', 'out': 'Out', 'nov': 'Nov', 'dez': 'Dez',
        'jan': 'Jan', 'fev': 'Fev', 'abr': 'Abr', 'mai': 'Mai', 'jun': 'Jun', 'jul': 'Jul',
        'mar': 'Mar',
        'agosto': 'Ago', 'setembro': 'Set', 'outubro': 'Out', 'novembro': 'Nov', 'dezembro': 'Dez',
        'janeiro': 'Jan', 'fevereiro': 'Fev', 'abril': 'Abr', 'maio': 'Mai', 'junho': 'Jun',
        'julho': 'Jul', 'março': 'Mar', 'marco': 'Mar'
      }
      
      const monthOrder: Record<string, number> = {
        'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4,
        'Mai': 5, 'Jun': 6, 'Jul': 7, 'Ago': 8,
        'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
      }
      
      let startMonth: string | null = null
      let endMonth: string | null = null
      const foundMonths: Array<{ abbr: string; full: string; position: number }> = []
      
      const isIsolatedMonth = (text: string, monthAbbr: string, position: number): boolean => {
        const before = position > 0 ? text[position - 1] : ' '
        const after = position + monthAbbr.length < text.length ? text[position + monthAbbr.length] : ' '
        return (/[\s,.\-]/.test(before) || position === 0) && (/[\s,.\-?]/.test(after) || position + monthAbbr.length === text.length)
      }
      
      // Busca todos os meses mencionados
      const sortedMonthEntries = Object.entries(monthMap).sort((a, b) => {
        if (a[0].length !== b[0].length) return b[0].length - a[0].length
        return a[0].localeCompare(b[0])
      })
      
      for (const [abbr, full] of sortedMonthEntries) {
        let searchPos = 0
        while (true) {
          const position = lowerQuestion.indexOf(abbr, searchPos)
          if (position === -1) break
          
          if (isIsolatedMonth(lowerQuestion, abbr, position)) {
            const alreadyFound = foundMonths.some(m => m.full === full)
            if (!alreadyFound) {
              foundMonths.push({ abbr, full, position })
            }
          }
          
          searchPos = position + 1
        }
      }
      
      const uniqueMonths = foundMonths.filter((m, idx, arr) => 
        arr.findIndex(x => x.full === m.full) === idx
      )
      uniqueMonths.sort((a, b) => a.position - b.position)
      
      if (uniqueMonths.length >= 2) {
        startMonth = uniqueMonths[0].full
        endMonth = uniqueMonths[uniqueMonths.length - 1].full
        
        if (monthOrder[startMonth] > monthOrder[endMonth]) {
          const temp = startMonth
          startMonth = endMonth
          endMonth = temp
        }
      } else if (uniqueMonths.length === 1) {
        startMonth = uniqueMonths[0].full
        const monthIndex = lowerQuestion.indexOf(uniqueMonths[0].abbr)
        const afterMonth = lowerQuestion.substring(monthIndex + uniqueMonths[0].abbr.length)
        if (afterMonth.includes(' a ') || afterMonth.includes(' até ') || afterMonth.includes(' ate ')) {
          for (const [abbr, full] of Object.entries(monthMap)) {
            if (afterMonth.includes(abbr) && abbr !== uniqueMonths[0].abbr) {
              const pos = afterMonth.indexOf(abbr)
              if (isIsolatedMonth(afterMonth, abbr, pos)) {
                endMonth = full
                break
              }
            }
          }
        }
      }
      
      // Filtra série pelo período
      let filteredSeries = pageContext.serieOEE
      if (startMonth && endMonth) {
        const startIndex = filteredSeries.findIndex(m => m.name === startMonth)
        const endIndex = filteredSeries.findIndex(m => m.name === endMonth)
        if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
          filteredSeries = filteredSeries.slice(startIndex, endIndex + 1)
        }
      }
      
      // Analisa a evolução
      const indicatorLabel = targetIndicator === 'oee' ? 'OEE' :
                            targetIndicator === 'disponibilidade' ? 'Disponibilidade' :
                            targetIndicator === 'performance' ? 'Performance' : 'Qualidade'
      
      const values = filteredSeries
        .map(m => m[targetIndicator!])
        .filter((v): v is number => v !== undefined)
      
      if (values.length > 0) {
        const firstValue = values[0]
        const lastValue = values[values.length - 1]
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
        const variation = ((lastValue - firstValue) / firstValue) * 100
        
        let periodLabel = ''
        if (startMonth && endMonth) {
          periodLabel = ` (${startMonth} a ${endMonth})`
        } else if (startMonth) {
          periodLabel = ` (a partir de ${startMonth})`
        }
        
        findings.push(
          `Evolução do ${indicatorLabel}${periodLabel}:`
        )
        
        findings.push(
          `• ${indicatorLabel} inicial (${filteredSeries[0].name}): ${formatNumber(firstValue, 1)}%`
        )
        findings.push(
          `• ${indicatorLabel} final (${filteredSeries[filteredSeries.length - 1].name}): ${formatNumber(lastValue, 1)}%`
        )
        findings.push(
          `• Variação no período: ${variation > 0 ? '+' : ''}${formatNumber(variation, 1)}%`
        )
        
        if (filteredSeries.length > 2) {
          findings.push(
            `• ${indicatorLabel} médio: ${formatNumber(avgValue, 1)}%`
          )
          findings.push(
            `• Menor ${indicatorLabel}: ${formatNumber(minValue, 1)}%`
          )
          findings.push(
            `• Maior ${indicatorLabel}: ${formatNumber(maxValue, 1)}%`
          )
        }
        
        // Adiciona TODAS as evidências mês a mês do período
        filteredSeries.forEach(mes => {
          const value = mes[targetIndicator!]
          if (value !== undefined) {
            evidence.push({
              metric: `${indicatorLabel} - ${mes.name}`,
              value: `${formatNumber(value, 1)}%`,
              source: 'serie_oee'
            })
          }
        })
        
        if (evidence.length === 0) {
          findings.push('Não encontrei dados para o período solicitado.')
          limitations.push('Período sem dados disponíveis')
        }
        
        if (variation > 5) {
          recommendations.push(`O ${indicatorLabel} apresentou aumento significativo no período. Continue monitorando para identificar causas.`)
        } else if (variation < -5) {
          recommendations.push(`O ${indicatorLabel} apresentou redução no período. Investigue causas e implemente ações corretivas.`)
        }
        
        return {
          agent: 'producao',
          confidence: 90,
          findings,
          evidence,
          recommendations,
          limitations: [],
          thoughtProcess: {
            kpiPrincipal: targetIndicator === 'oee' ? 'oee' : targetIndicator,
            area: 'producao',
            dataSource: 'page_context',
            kpiConfidence: 90
          }
        }
      }
    }
  }

  // PASSO 0.3: Detecção especial de "pior linha" ANTES do scoring normal
  if (isWorstLineQuestion(question)) {
    const pageContext = getPageContext('producao', 'dezembro')
    
    if (pageContext?.rendimentoLinhas && pageContext.rendimentoLinhas.length > 0) {
      // Ordena por rendimento (menor primeiro = pior)
      const linhasOrdenadas = [...pageContext.rendimentoLinhas]
        .sort((a, b) => a.rendimento - b.rendimento)
      
      const worstLine = linhasOrdenadas[0]
      
      if (worstLine) {
        findings.push(
          `A linha com menor rendimento é ${worstLine.name} (${formatNumber(worstLine.rendimento, 1)}%). ` +
          `Meta: ${formatNumber(worstLine.meta, 1)}%.`
        )
        
        // Adiciona evidência da pior linha
        evidence.push({
          metric: `${worstLine.name} - Rendimento`,
          value: `${formatNumber(worstLine.rendimento, 1)}%`,
          comparison: `Meta: ${formatNumber(worstLine.meta, 1)}%`,
          source: 'page_context'
        })
        
        // Adiciona todas as linhas para comparação (mostra ranking completo)
        linhasOrdenadas.forEach((linha, index) => {
          if (index > 0) { // Já adicionou a pior acima
            evidence.push({
              metric: `${linha.name} - Rendimento`,
              value: `${formatNumber(linha.rendimento, 1)}%`,
              comparison: `Meta: ${formatNumber(linha.meta, 1)}%`,
              source: 'page_context'
            })
          }
        })
        
        if (worstLine.rendimento < worstLine.meta) {
          recommendations.push(`Implementar ações de melhoria na ${worstLine.name} para atingir a meta de ${formatNumber(worstLine.meta, 1)}%.`)
        }
        
        // Adiciona comparação com outras linhas
        if (linhasOrdenadas.length > 1) {
          const bestLine = linhasOrdenadas[linhasOrdenadas.length - 1]
          const diferenca = bestLine.rendimento - worstLine.rendimento
          findings.push(
            `Comparado com a melhor linha (${bestLine.name}: ${formatNumber(bestLine.rendimento, 1)}%), ` +
            `há uma diferença de ${formatNumber(diferenca, 1)} pontos percentuais.`
          )
        }
        
        return {
          agent: 'producao',
          confidence: 90,
          findings,
          evidence,
          recommendations,
          limitations: [],
          thoughtProcess: {
            kpiPrincipal: 'rendimento',
            area: 'producao',
            dataSource: 'page_context',
            kpiConfidence: 90
          }
        }
      }
    }
    
    // Se não encontrou dados, informa
    return {
      agent: 'producao',
      confidence: 0,
      findings: [
        'Não consegui ler os dados de rendimento por linha da página agora.',
        'Você está com o painel de Produção carregado?'
      ],
      evidence: [],
      recommendations: [],
      limitations: ['Dados não disponíveis no contexto da página']
    }
  }

  // PASSO 1: PRIMEIRO classifica KPI (usando score determinístico)
  const scores = scoreKPIs(question)
  const selection = selectMainKPIFromScores(scores)
  const kpiConfidenceValue = selection.confidence
  
  // PASSO 2: Verifica ambiguidade real (2 KPIs competindo)
  if (selection.isAmbiguous || !selection.kpiId) {
    let altKpiIds = scores.slice(0, 3)
      .map(s => s.kpiId)
      .filter((id): id is string => !!id)
    
    if (altKpiIds.length === 0) {
      // KPIs de Produção disponíveis
      altKpiIds = ['oee', 'disponibilidade', 'performance', 'qualidade', 'rendimento', 'perdas_processo', 'producao_total', 'mtbf']
    }
    
    const clarification = generateClarificationMessage(altKpiIds, question)
    
    const findingsList: string[] = [clarification.message]
    
    if (clarification.options.length > 0) {
      findingsList.push('')
      findingsList.push('Indicadores sugeridos:')
      clarification.options.forEach(opt => {
        findingsList.push(`• ${opt}`)
      })
    }
    
    return {
      agent: 'producao',
      confidence: 0,
      findings: findingsList,
      evidence: [],
      recommendations: [],
      limitations: ['Pergunta ambígua - precisa esclarecimento'],
      thoughtProcess: {
        kpiPrincipal: undefined,
        area: 'producao',
        dataSource: 'page_context',
        kpiConfidence: 0
      }
    }
  }
  
  // PASSO 3: Busca contexto da página
  const pageContext = getPageContext('producao', 'dezembro')
  
  // PASSO 4: Verifica evidência mínima para o KPI selecionado
  const evidenceCheck = checkEvidenceForKPI(selection.kpiId, pageContext)
  
  if (!evidenceCheck.hasMinimumEvidence) {
    const clarification = generateClarificationMessage([selection.kpiId], question)
    return {
      agent: 'producao',
      confidence: 0,
      findings: [clarification.message],
      evidence: [],
      recommendations: [],
      limitations: ['Dados insuficientes para análise'],
      thoughtProcess: {
        kpiPrincipal: selection.kpiId,
        area: 'producao',
        dataSource: 'page_context',
        kpiConfidence: 0
      }
    }
  }
  
  // PASSO 5: Busca dados do KPI no contexto
  const kpi = pageContext?.kpis.find(k => k.id === selection.kpiId)
  
  if (!kpi) {
    return {
      agent: 'producao',
      confidence: kpiConfidenceValue,
      findings: [`Não encontrei dados para ${getKPILabel('producao', selection.kpiId)}`],
      evidence: [],
      recommendations: [],
      limitations: ['KPI não encontrado no contexto'],
      thoughtProcess: {
        kpiPrincipal: selection.kpiId,
        area: 'producao',
        dataSource: 'page_context',
        kpiConfidence: kpiConfidenceValue
      }
    }
  }
  
  // PASSO 6: Analisa o KPI
  const kpiValue = typeof kpi.value === 'number' ? kpi.value : 0
  const kpiLabel = getKPILabel('producao', selection.kpiId)
  const kpiMeta = getKPIMeta('producao', selection.kpiId)
  
  // Formata valor
  const formattedValue = kpi.unit === '%' 
    ? `${formatNumber(kpiValue, 1)}%`
    : kpi.unit === 'R$'
    ? formatCurrency(kpiValue)
    : `${formatNumber(kpiValue, 0)} ${kpi.unit}`
  
  findings.push(`${kpiLabel}: ${formattedValue}`)
  
  if (kpi.change !== undefined && kpi.change !== 0) {
    const changeText = kpi.change > 0 ? `+${formatNumber(kpi.change, 1)}%` : `${formatNumber(kpi.change, 1)}%`
    findings.push(`Variação: ${changeText} vs período anterior.`)
  }
  
  evidence.push({
    metric: kpiLabel,
    value: formattedValue,
    comparison: kpi.change !== undefined && kpi.change !== 0 
      ? `Variação: ${kpi.change > 0 ? '+' : ''}${formatNumber(kpi.change, 1)}%`
      : undefined,
    source: 'page_context'
  })
  
  // Adiciona meta se disponível
  if (kpiMeta !== null && kpiMeta !== undefined) {
    const metaComparison = kpiValue >= kpiMeta ? 'Acima da meta' : 'Abaixo da meta'
    evidence.push({
      metric: `${kpiLabel} - Meta`,
      value: `${formatNumber(kpiMeta, 1)}${kpi.unit}`,
      comparison: metaComparison,
      source: 'meta'
    })
    
    if (kpiValue < kpiMeta) {
      recommendations.push(`Implementar ações para atingir a meta de ${formatNumber(kpiMeta, 1)}${kpi.unit} para ${kpiLabel}.`)
    }
  }
  
  // Análises específicas por KPI
  if (selection.kpiId === 'perdas_processo' && pageContext?.perdasProducao && pageContext.perdasProducao.length > 0) {
    const topPerdas = pageContext.perdasProducao
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
    
    if (topPerdas.length > 0) {
      const nomes = topPerdas.map(p => `${p.name} (${formatNumber(p.value, 0)}%)`).join(', ')
      findings.push(`Principais tipos de perdas: ${nomes}.`)
      
      topPerdas.forEach(p => {
        evidence.push({
          metric: `Perda: ${p.name}`,
          value: `${formatNumber(p.value, 0)}%`,
          comparison: `${formatNumber(p.kg, 0)} kg`,
          source: 'perdas_producao'
        })
      })
      
      recommendations.push('Investigar causas principais das perdas mais frequentes e implementar ações corretivas.')
    }
  }
  
  if (selection.kpiId === 'producao_total' && pageContext?.produtividadeTurnos && pageContext.produtividadeTurnos.length > 0) {
    const turnos = pageContext.produtividadeTurnos
    const totalProducao = turnos.reduce((sum, t) => sum + t.valor, 0)
    
    findings.push(`Produção por turno: ${turnos.map(t => `${t.name}: ${formatNumber(t.valor, 0)} kg`).join(', ')}.`)
    
    turnos.forEach(t => {
      evidence.push({
        metric: t.name,
        value: `${formatNumber(t.valor, 0)} kg`,
        comparison: `Meta: ${formatNumber(t.meta, 0)} kg | Eficiência: ${formatNumber(t.eficiencia, 1)}%`,
        source: 'produtividade_turnos'
      })
    })
  }
  
  return {
    agent: 'producao',
    confidence: kpiConfidenceValue || 75,
    findings,
    evidence,
    recommendations,
    limitations: [],
    thoughtProcess: {
      kpiPrincipal: selection.kpiId,
      area: 'producao',
      dataSource: 'page_context',
      kpiConfidence: kpiConfidenceValue || 75
    }
  }
}

// ==========================================
// AGENTE: ESTOQUE & LOGÍSTICA
// ==========================================

export async function agentEstoqueLogistica(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []

  const lowerQuestion = question.toLowerCase()
  
  // Determina se é pergunta sobre estoque ou logística
  const isEstoqueQuestion = lowerQuestion.includes('estoque') || 
                            lowerQuestion.includes('acurácia') || 
                            lowerQuestion.includes('acuracia') ||
                            lowerQuestion.includes('inventário') ||
                            lowerQuestion.includes('inventario') ||
                            lowerQuestion.includes('giro') && !lowerQuestion.includes('custo por km') ||
                            lowerQuestion.includes('cobertura') && !lowerQuestion.includes('entrega')
  
  // SEMPRE busca KPIs da área apropriada
  const area = isEstoqueQuestion ? 'estoque' : 'logistica'
  const kpisData = await DataAdapter.get_kpis_overview('dezembro', area)
  const allKPIs = kpisData.kpis || []
  
  // Mapeia perguntas para KPIs específicos
  const mappedKPIs = mapQuestionToKPIs(question, area)
  
  // Casos especiais para logística
  const isVehicleQuestion = mappedKPIs.some(m => m.kpiId === 'veiculos') ||
                            (lowerQuestion.includes('veículo') || lowerQuestion.includes('veículos') || lowerQuestion.includes('veiculos')) &&
                            !lowerQuestion.includes('rota') && !lowerQuestion.includes('rotas')
  
  const isRouteQuestion = mappedKPIs.some(m => m.kpiId === 'rotas') ||
                          (lowerQuestion.includes('rota') || lowerQuestion.includes('rotas')) &&
                          !lowerQuestion.includes('veículo') && !lowerQuestion.includes('veículos')
  
  const isEquilibriumQuestion = lowerQuestion.includes('ponto de equilíbrio') ||
                                lowerQuestion.includes('ponto de equilibrio') ||
                                lowerQuestion.includes('equilíbrio') ||
                                lowerQuestion.includes('equilibrio') ||
                                lowerQuestion.includes('break even')

  // Se mapeou para KPIs específicos (exceto casos especiais), retorna esses KPIs
  if (mappedKPIs.length > 0 && !isVehicleQuestion && !isRouteQuestion) {
    for (const mapped of mappedKPIs) {
      const kpi = allKPIs.find(k => k.id === mapped.kpiId)
      if (kpi) {
        findings.push(`${mapped.kpiLabel}: ${kpi.value}${kpi.unit || ''}`)
        evidence.push({
          metric: mapped.kpiLabel,
          value: `${kpi.value}${kpi.unit || ''}`,
          comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
          source: 'get_kpis_overview'
        })
      }
    }
  }

  // Caso especial: Performance de Veículos (NÃO rotas)
  if (isVehicleQuestion) {
    const vehicleData = await DataAdapter.get_vehicle_performance('dezembro')
    const totalDeliveries = vehicleData.vehicles.reduce((sum, v) => sum + v.deliveries, 0)
    
    findings.push(`Frota de ${vehicleData.summary.totalVehicles} veículos`)
    findings.push(`Melhor veículo: ${vehicleData.summary.bestVehicle.name} com eficiência de ${(vehicleData.summary.bestVehicle.efficiency * 100).toFixed(2)} entregas/km`)
    findings.push(`Pior veículo: ${vehicleData.summary.worstVehicle.name} com eficiência de ${(vehicleData.summary.worstVehicle.efficiency * 100).toFixed(2)} entregas/km`)
    
    evidence.push({
      metric: 'Eficiência Média da Frota',
      value: `${(vehicleData.summary.averageEfficiency * 100).toFixed(2)} entregas/km`,
      comparison: `${totalDeliveries} entregas totais`,
      source: 'get_vehicle_performance'
    })
    
    // Top 3 veículos
    const topVehicles = [...vehicleData.vehicles]
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 3)
    
    topVehicles.forEach(vehicle => {
      evidence.push({
        metric: `${vehicle.name}`,
        value: `${vehicle.deliveries} entregas`,
        comparison: `Eficiência: ${(vehicle.efficiency * 100).toFixed(2)} entregas/km | Capacidade: ${vehicle.capacity}%`,
        source: 'get_vehicle_performance'
      })
    })
    
    const efficiencyDiff = vehicleData.summary.bestVehicle.efficiency - vehicleData.summary.worstVehicle.efficiency
    if (efficiencyDiff > 0.01) {
      recommendations.push(`Otimizar ${vehicleData.summary.worstVehicle.name} para melhorar eficiência`)
      recommendations.push(`Priorizar uso de ${vehicleData.summary.bestVehicle.name} em rotas mais longas`)
    }
  }
  
  // Caso especial: Custo por Rota (NÃO veículos)
  else if (isRouteQuestion) {
    const routeData = await DataAdapter.get_route_cost('dezembro')
    
    // Se pergunta sobre ponto de equilíbrio, faz análise comparativa detalhada
    if (isEquilibriumQuestion) {
    
      // Análise completa de todas as rotas
      const sortedRoutes = [...routeData.routes].sort((a, b) => a.costPerDelivery - b.costPerDelivery)
      
      // Encontra ponto de equilíbrio (onde custos se igualam) entre rotas
      // Para cada par de rotas, calcula onde seria indiferente
      const equilibriumPoints: Array<{ route1: string; route2: string; description: string }> = []
      
      for (let i = 0; i < sortedRoutes.length; i++) {
        for (let j = i + 1; j < sortedRoutes.length; j++) {
          const route1 = sortedRoutes[i]
          const route2 = sortedRoutes[j]
          
          // Ponto de equilíbrio: onde o custo total seria igual
          // Se custo por entrega é diferente, mas temos custos fixos variáveis
          // Para simplificar, assumimos que o equilíbrio é quando o custo médio geral é atingido
          const avgCost = (route1.costPerDelivery + route2.costPerDelivery) / 2
          const costDiff = Math.abs(route2.costPerDelivery - route1.costPerDelivery)
          
          if (costDiff > 0.5) {
            equilibriumPoints.push({
              route1: route1.name,
              route2: route2.name,
              description: `Custo médio: R$ ${avgCost.toFixed(2)}/entrega (diferença de R$ ${costDiff.toFixed(2)})`
            })
          }
        }
      }
      
      // Análise de custo médio (ponto de equilíbrio geral)
      findings.push(`Ponto de equilíbrio médio: R$ ${routeData.summary.averageCostPerDelivery.toFixed(2)} por entrega`)
      findings.push(`Rotas abaixo da média: ${sortedRoutes.filter(r => r.costPerDelivery < routeData.summary.averageCostPerDelivery).length} rotas`)
      findings.push(`Rotas acima da média: ${sortedRoutes.filter(r => r.costPerDelivery > routeData.summary.averageCostPerDelivery).length} rotas`)
      
      // Detalhamento de todas as rotas
      sortedRoutes.forEach((route, index) => {
        const deviation = ((route.costPerDelivery - routeData.summary.averageCostPerDelivery) / routeData.summary.averageCostPerDelivery) * 100
        const status = route.costPerDelivery < routeData.summary.averageCostPerDelivery ? 'Abaixo da média' : 'Acima da média'
        
        evidence.push({
          metric: `${route.name}`,
          value: `R$ ${route.costPerDelivery.toFixed(2)}/entrega`,
          comparison: `${status} (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%)`,
          source: 'get_route_cost'
        })
      })
      
      // Recomendações baseadas em ponto de equilíbrio
      const routesBelowAvg = sortedRoutes.filter(r => r.costPerDelivery < routeData.summary.averageCostPerDelivery)
      const routesAboveAvg = sortedRoutes.filter(r => r.costPerDelivery > routeData.summary.averageCostPerDelivery)
      
      if (routesBelowAvg.length > 0) {
        recommendations.push(`Priorizar uso de rotas eficientes: ${routesBelowAvg.map(r => r.name).join(', ')}`)
      }
      if (routesAboveAvg.length > 0) {
        recommendations.push(`Otimizar rotas acima da média: ${routesAboveAvg.map(r => r.name).join(', ')}`)
      }
      
      // Análise de custo por km (outro indicador de eficiência)
      const bestKmRoute = routeData.routes.reduce((best, current) => 
        current.costPerKm < best.costPerKm ? current : best
      )
      const worstKmRoute = routeData.routes.reduce((worst, current) => 
        current.costPerKm > worst.costPerKm ? current : worst
      )
      
      evidence.push({
        metric: 'Custo Médio por Km',
        value: `R$ ${routeData.summary.averageCostPerKm.toFixed(2)}/km`,
        comparison: `Melhor: ${bestKmRoute.name} (R$ ${bestKmRoute.costPerKm.toFixed(2)}/km)`,
        source: 'get_route_cost'
      })
      
    } else {
      // Análise padrão (não é pergunta sobre ponto de equilíbrio)
      findings.push(`Rota mais eficiente: ${routeData.summary.bestRoute.name} com custo de R$ ${routeData.summary.bestRoute.costPerDelivery.toFixed(2)} por entrega`)
      findings.push(`Rota menos eficiente: ${routeData.summary.worstRoute.name} com custo de R$ ${routeData.summary.worstRoute.costPerDelivery.toFixed(2)} por entrega`)
      
      evidence.push({
        metric: 'Custo Médio por Entrega',
        value: `R$ ${routeData.summary.averageCostPerDelivery.toFixed(2)}`,
        comparison: `Total: ${routeData.summary.totalDeliveries} entregas`,
        source: 'get_route_cost'
      })
      
      evidence.push({
        metric: `Melhor Rota: ${routeData.summary.bestRoute.name}`,
        value: `R$ ${routeData.summary.bestRoute.costPerDelivery.toFixed(2)}/entrega`,
        comparison: 'Menor custo por entrega',
        source: 'get_route_cost'
      })
      
      evidence.push({
        metric: `Pior Rota: ${routeData.summary.worstRoute.name}`,
        value: `R$ ${routeData.summary.worstRoute.costPerDelivery.toFixed(2)}/entrega`,
        comparison: 'Maior custo por entrega',
        source: 'get_route_cost'
      })
      
      // Análise de viabilidade
      const costDifference = routeData.summary.worstRoute.costPerDelivery - routeData.summary.bestRoute.costPerDelivery
      if (costDifference > 2) {
        findings.push(`Diferença significativa de R$ ${costDifference.toFixed(2)} entre melhor e pior rota`)
        recommendations.push(`Otimizar ${routeData.summary.worstRoute.name} para reduzir custo por entrega`)
        recommendations.push(`Considerar redistribuir entregas para ${routeData.summary.bestRoute.name}`)
      }
    }
    
  } 
  
  // Se não mapeou para KPIs específicos e não é caso especial, retorna KPIs principais
  if (mappedKPIs.length === 0 && !isVehicleQuestion && !isRouteQuestion && findings.length === 0 && !isEstoqueQuestion) {
    const mainKPIs = allKPIs.slice(0, 3) // Primeiros 3 KPIs
    for (const kpi of mainKPIs) {
      findings.push(`${kpi.label}: ${kpi.value}${kpi.unit || ''}`)
      evidence.push({
        metric: kpi.label,
        value: `${kpi.value}${kpi.unit || ''}`,
        comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
        source: 'get_kpis_overview'
      })
    }
  }
  
  // Analisa KPIs de estoque
  if (isEstoqueQuestion) {
    // Se mapeou para KPIs específicos de estoque, retorna esses KPIs
    if (mappedKPIs.length > 0) {
      for (const mapped of mappedKPIs) {
        const kpi = allKPIs.find(k => k.id === mapped.kpiId)
        if (kpi) {
          findings.push(`${mapped.kpiLabel}: ${kpi.value}${kpi.unit || ''}`)
          evidence.push({
            metric: mapped.kpiLabel,
            value: `${kpi.value}${kpi.unit || ''}`,
            comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
            source: 'get_kpis_overview'
          })
        }
      }
    } else if (findings.length === 0) {
      // Se não mapeou para KPIs específicos, retorna KPIs principais de estoque
      const mainKPIs = allKPIs.slice(0, 3)
      for (const kpi of mainKPIs) {
        findings.push(`${kpi.label}: ${kpi.value}${kpi.unit || ''}`)
        evidence.push({
          metric: kpi.label,
          value: `${kpi.value}${kpi.unit || ''}`,
          comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
          source: 'get_kpis_overview'
        })
      }
    }
    
    // Análises específicas baseadas em KPIs de estoque
    const acuraciaKPI = allKPIs.find(k => k.id === 'acuracia')
    if (acuraciaKPI && acuraciaKPI.value < 98 && !mappedKPIs.find(m => m.kpiId === 'acuracia')) {
      findings.push(`Acurácia de estoque de ${acuraciaKPI.value}% abaixo da meta de 98%`)
      recommendations.push('Realizar inventário físico e ajustar divergências')
    }
    
    const giroKPI = allKPIs.find(k => k.id === 'giro_estoque')
    if (giroKPI && giroKPI.value > 15 && !mappedKPIs.find(m => m.kpiId === 'giro_estoque')) {
      findings.push(`Giro de estoque de ${giroKPI.value} dias acima do ideal`)
      recommendations.push('Otimizar giro de estoque')
    }
    
    const avariasKPI = allKPIs.find(k => k.id === 'avarias')
    if (avariasKPI && avariasKPI.value > 1 && !mappedKPIs.find(m => m.kpiId === 'avarias')) {
      findings.push(`Avarias de ${avariasKPI.value}% acima do aceitável`)
      recommendations.push('Revisar processos de manuseio e armazenamento')
    }
  }
  
  // Análises específicas baseadas em KPIs (apenas se não já foram adicionadas)
  if (!isEstoqueQuestion && area === 'logistica') {
    const otifKPI = allKPIs.find(k => k.id === 'otif')
    if (otifKPI && otifKPI.value < 95 && !mappedKPIs.find(m => m.kpiId === 'otif') && !isRouteQuestion && !isVehicleQuestion) {
      findings.push(`OTIF de ${otifKPI.value}% abaixo da meta de 95%`)
      recommendations.push('Melhorar planejamento de rotas e processos de picking')
    }
  }

  // Analisa cobertura de estoque (apenas se produto específico)
  if (context?.product && isEstoqueQuestion) {
    const stockData = await DataAdapter.get_stock_coverage(
      context.product as string,
      'dezembro'
    )
    if (stockData.coverage < 7) {
      findings.push(`Cobertura de estoque baixa: ${stockData.coverage} dias`)
      recommendations.push('Aumentar estoque de segurança')
    } else if (stockData.coverage > 15) {
      findings.push(`Cobertura de estoque alta: ${stockData.coverage} dias`)
      recommendations.push('Otimizar giro de estoque')
    }
  }

  return {
    agent: 'estoque_logistica',
    confidence: findings.length > 0 ? 85 : 70,
    findings,
    evidence,
    recommendations,
    limitations: ['Análise baseada em dados agregados mensais']
  }
}

// ==========================================
// AGENTE: COMERCIAL
// ==========================================

export async function agentComercial(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []

  // SEMPRE busca KPIs da área comercial
  const kpisData = await DataAdapter.get_kpis_overview('dezembro', 'comercial')
  const allKPIs = kpisData.kpis || []
  
  // Mapeia perguntas para KPIs específicos
  const mappedKPIs = mapQuestionToKPIs(question, 'comercial')
  const lowerQuestion = question.toLowerCase()
  
  // Casos especiais que não são KPIs diretos
  const isCustomersByRangeQuestion = mappedKPIs.some(m => m.kpiId === 'clientes_faixa') ||
                                     lowerQuestion.includes('clientes por faixa') ||
                                     lowerQuestion.includes('faixa de faturamento') ||
                                     lowerQuestion.includes('distribuição de clientes') ||
                                     lowerQuestion.includes('distribuicao de clientes')
  
  const isRevenueQuestion = lowerQuestion.includes('faturamento') ||
                            lowerQuestion.includes('receita') ||
                            lowerQuestion.includes('evolução') ||
                            lowerQuestion.includes('evolucao') ||
                            lowerQuestion.includes('oscilação') ||
                            lowerQuestion.includes('oscilacao') ||
                            lowerQuestion.includes('melhor mês') ||
                            lowerQuestion.includes('pior mês') ||
                            lowerQuestion.includes('melhor mes') ||
                            lowerQuestion.includes('pior mes') ||
                            context?.analyzeRevenue
  
  const isSeasonalityQuestion = lowerQuestion.includes('sazonalidade') ||
                                lowerQuestion.includes('sazonal') ||
                                lowerQuestion.includes('padrão') ||
                                lowerQuestion.includes('padrao') ||
                                lowerQuestion.includes('sazão') ||
                                lowerQuestion.includes('sazao')

  // Se a pergunta é sobre clientes por faixa de faturamento
  if (isCustomersByRangeQuestion) {
    const customersData = await DataAdapter.get_customers_by_billing_range('dezembro')
    
    // Análise da distribuição
    const totalCustomers = customersData.ranges.reduce((sum, r) => sum + r.customers, 0)
    const totalRevenue = customersData.ranges.reduce((sum, r) => sum + r.revenue, 0)
    
    // Maior faixa por quantidade
    const largestByQuantity = [...customersData.ranges].sort((a, b) => b.customers - a.customers)[0]
    // Maior faixa por receita
    const largestByRevenue = [...customersData.ranges].sort((a, b) => b.revenue - a.revenue)[0]
    
    findings.push(`Total de ${totalCustomers.toLocaleString('pt-BR')} clientes ativos`)
    findings.push(`Faixa com mais clientes: ${largestByQuantity.range} (${largestByQuantity.customers} clientes, ${largestByQuantity.percentage}%)`)
    findings.push(`Faixa com maior faturamento: ${largestByRevenue.range} (R$ ${(largestByRevenue.revenue / 1000).toFixed(0)}k, ${((largestByRevenue.revenue / totalRevenue) * 100).toFixed(1)}% do total)`)
    
    customersData.ranges.forEach(range => {
      evidence.push({
        metric: range.range,
        value: `${range.customers} clientes`,
        comparison: `${range.percentage}% da base | R$ ${(range.revenue / 1000).toFixed(0)}k`,
        source: 'get_customers_by_billing_range'
      })
    })
    
    // Análise de concentração
    const top3Revenue = customersData.ranges
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
    const top3RevenuePercent = (top3Revenue.reduce((sum, r) => sum + r.revenue, 0) / totalRevenue) * 100
    
    if (top3RevenuePercent > 60) {
      findings.push(`Concentração alta: top 3 faixas representam ${top3RevenuePercent.toFixed(1)}% do faturamento`)
      recommendations.push('Desenvolver estratégias para aumentar faturamento nas faixas menores')
    }
    
    // Análise de distribuição
    const midRanges = customersData.ranges.filter(r => 
      r.range.includes('R$ 2k') || r.range.includes('R$ 5k') || r.range.includes('R$ 1k')
    )
    const midRangesPercent = midRanges.reduce((sum, r) => sum + r.percentage, 0)
    
    if (midRangesPercent > 50) {
      findings.push(`Base bem distribuída: ${midRangesPercent.toFixed(1)}% dos clientes nas faixas intermediárias`)
    }
  }
  // Se a pergunta é sobre faturamento/receita, analisa receita mensal
  else if (isRevenueQuestion || isSeasonalityQuestion) {
    const revenueData = await DataAdapter.get_revenue_monthly('dezembro')
    
    // Se a pergunta é especificamente sobre sazonalidade, prioriza análise sazonal
    if (isSeasonalityQuestion) {
      // Adiciona contexto básico
      evidence.push({
        metric: 'Oscilação do Faturamento',
        value: `${revenueData.summary.variation.oscillation}%`,
        comparison: `Entre ${(revenueData.summary.variation.min / 1000000).toFixed(2)}M e ${(revenueData.summary.variation.max / 1000000).toFixed(2)}M`,
        source: 'get_revenue_monthly'
      })
      
      // Agrupa meses por trimestre para identificar padrões sazonais
      const quarters: Record<string, number[]> = {
        'Q1': [], // Jan, Fev, Mar
        'Q2': [], // Apr, Mai, Jun
        'Q3': [], // Jul, Ago, Set
        'Q4': []  // Out, Nov, Dez
      }
      
      revenueData.months.forEach((month, index) => {
        const quarter = Math.floor(index / 3)
        const quarterKey = `Q${quarter + 1}`
        if (quarters[quarterKey]) {
          quarters[quarterKey].push(month.value)
        }
      })
      
      // Calcula média por trimestre
      const quarterAverages: Record<string, number> = {}
      Object.entries(quarters).forEach(([q, values]) => {
        quarterAverages[q] = values.reduce((sum, v) => sum + v, 0) / values.length
      })
      
      // Identifica padrão sazonal
      const avgAll = Object.values(quarterAverages).reduce((sum, v) => sum + v, 0) / 4
      const quarterDeviations = Object.entries(quarterAverages).map(([q, avg]) => ({
        quarter: q,
        average: avg,
        deviation: ((avg - avgAll) / avgAll) * 100
      }))
      
      // Ordena por desvio
      quarterDeviations.sort((a, b) => b.deviation - a.deviation)
      
      const strongestQuarter = quarterDeviations[0]
      const weakestQuarter = quarterDeviations[quarterDeviations.length - 1]
      
      // Análise de sazonalidade
      if (Math.abs(strongestQuarter.deviation) > 10) {
        findings.push(`Padrão sazonal identificado: ${strongestQuarter.quarter} apresenta ${strongestQuarter.deviation > 0 ? 'pico' : 'vale'} de ${Math.abs(strongestQuarter.deviation).toFixed(1)}% vs média anual`)
        findings.push(`${weakestQuarter.quarter} apresenta ${weakestQuarter.deviation < 0 ? 'vale' : 'pico'} de ${Math.abs(weakestQuarter.deviation).toFixed(1)}% vs média anual`)
        
        evidence.push({
          metric: `Média ${strongestQuarter.quarter}`,
          value: `R$ ${(strongestQuarter.average / 1000000).toFixed(2)}M`,
          comparison: `Desvio: ${strongestQuarter.deviation > 0 ? '+' : ''}${strongestQuarter.deviation.toFixed(1)}%`,
          source: 'get_revenue_monthly'
        })
        
        evidence.push({
          metric: `Média ${weakestQuarter.quarter}`,
          value: `R$ ${(weakestQuarter.average / 1000000).toFixed(2)}M`,
          comparison: `Desvio: ${weakestQuarter.deviation > 0 ? '+' : ''}${weakestQuarter.deviation.toFixed(1)}%`,
          source: 'get_revenue_monthly'
        })
        
        recommendations.push(`Ajustar planejamento de produção e estoque para ${strongestQuarter.quarter} (período de pico)`)
        recommendations.push(`Preparar estratégias promocionais para ${weakestQuarter.quarter} (período de menor demanda)`)
      } else {
        findings.push('Padrão sazonal fraco detectado: variação entre trimestres abaixo de 10%')
        evidence.push({
          metric: 'Variação Sazonal',
          value: `${Math.abs(strongestQuarter.deviation).toFixed(1)}%`,
          comparison: 'Diferença entre trimestre mais forte e mais fraco',
          source: 'get_revenue_monthly'
        })
      }
      
      // Análise mensal detalhada (identifica meses consistentemente altos/baixos)
      const monthlyAverages = revenueData.months.map(m => ({
        month: m.month,
        value: m.value,
        deviation: ((m.value - revenueData.summary.average) / revenueData.summary.average) * 100
      }))
      
      monthlyAverages.sort((a, b) => b.deviation - a.deviation)
      const top3Months = monthlyAverages.slice(0, 3)
      const bottom3Months = monthlyAverages.slice(-3).reverse()
      
      if (top3Months[0].deviation > 5) {
        findings.push(`Meses tipicamente mais fortes: ${top3Months.map(m => m.month).join(', ')}`)
      }
      if (bottom3Months[0].deviation < -5) {
        findings.push(`Meses tipicamente mais fracos: ${bottom3Months.map(m => m.month).join(', ')}`)
      }
    } else {
      // Se não é pergunta sobre sazonalidade, faz análise padrão de receita
      // Melhor e pior mês
      findings.push(`Melhor mês: ${revenueData.summary.bestMonth.month} com R$ ${(revenueData.summary.bestMonth.value / 1000000).toFixed(2)}M`)
      findings.push(`Pior mês: ${revenueData.summary.worstMonth.month} com R$ ${(revenueData.summary.worstMonth.value / 1000000).toFixed(2)}M`)
      
      evidence.push({
        metric: 'Oscilação do Faturamento',
        value: `${revenueData.summary.variation.oscillation}%`,
        comparison: `Entre ${(revenueData.summary.variation.min / 1000000).toFixed(2)}M e ${(revenueData.summary.variation.max / 1000000).toFixed(2)}M`,
        source: 'get_revenue_monthly'
      })
      
      evidence.push({
        metric: `Melhor Mês: ${revenueData.summary.bestMonth.month}`,
        value: `R$ ${(revenueData.summary.bestMonth.value / 1000000).toFixed(2)}M`,
        source: 'get_revenue_monthly'
      })
      
      evidence.push({
        metric: `Pior Mês: ${revenueData.summary.worstMonth.month}`,
        value: `R$ ${(revenueData.summary.worstMonth.value / 1000000).toFixed(2)}M`,
        source: 'get_revenue_monthly'
      })
      
      evidence.push({
        metric: 'Média Mensal',
        value: `R$ ${(revenueData.summary.average / 1000000).toFixed(2)}M`,
        source: 'get_revenue_monthly'
      })

      // Análise de tendência
      const lastMonths = revenueData.months.slice(-3)
      const firstMonths = revenueData.months.slice(0, 3)
      const lastAvg = lastMonths.reduce((sum, m) => sum + m.value, 0) / lastMonths.length
      const firstAvg = firstMonths.reduce((sum, m) => sum + m.value, 0) / firstMonths.length
      const growth = ((lastAvg - firstAvg) / firstAvg) * 100

      if (growth > 0) {
        findings.push(`Tendência de crescimento: +${growth.toFixed(1)}% comparando últimos 3 meses vs primeiros 3 meses`)
      } else {
        findings.push(`Tendência de queda: ${growth.toFixed(1)}% comparando últimos 3 meses vs primeiros 3 meses`)
      }

      if (revenueData.summary.variation.oscillation > 15) {
        recommendations.push('Oscilação alta detectada - investigar sazonalidade e planejar estoque')
      }
    }
  } else {
    // Analisa mix de vendas (apenas se não for pergunta sobre receita)
    const mixData = await DataAdapter.get_sales_mix('dezembro')
    const deviation = mixData.mix.filter(m => Math.abs(m.actual - m.ideal) > 2)
    if (deviation.length > 0) {
      findings.push(`${deviation.length} produtos com mix desalinhado do ideal`)
      deviation.forEach(m => {
        evidence.push({
          metric: `Mix ${m.product}`,
          value: `${m.actual}%`,
          comparison: `Ideal: ${m.ideal}%`,
          source: 'get_sales_mix'
        })
      })
      recommendations.push('Ajustar estratégia de vendas para alinhar mix')
    }
  }

  // Se mapeou para KPIs específicos (exceto casos especiais), retorna esses KPIs
  if (mappedKPIs.length > 0 && !isCustomersByRangeQuestion) {
    for (const mapped of mappedKPIs) {
      const kpi = allKPIs.find(k => k.id === mapped.kpiId)
      if (kpi) {
        findings.push(`${mapped.kpiLabel}: ${kpi.value}${kpi.unit || ''}`)
        evidence.push({
          metric: mapped.kpiLabel,
          value: `${kpi.value}${kpi.unit || ''}`,
          comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
          source: 'get_kpis_overview'
        })
      }
    }
  }
  
  // Se não mapeou para KPIs específicos e não é caso especial, retorna KPIs principais
  if (mappedKPIs.length === 0 && !isCustomersByRangeQuestion && !isRevenueQuestion && !isSeasonalityQuestion && findings.length === 0) {
    const mainKPIs = allKPIs.slice(0, 3) // Primeiros 3 KPIs
    for (const kpi of mainKPIs) {
      findings.push(`${kpi.label}: ${kpi.value}${kpi.unit || ''}`)
      evidence.push({
        metric: kpi.label,
        value: `${kpi.value}${kpi.unit || ''}`,
        comparison: kpi.change ? `Variação: ${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined,
        source: 'get_kpis_overview'
      })
    }
  }
  
  // Análises específicas baseadas em KPIs
  const churnKPI = allKPIs.find(k => k.id === 'churn')
  if (churnKPI && churnKPI.value > 3 && !mappedKPIs.find(m => m.kpiId === 'churn')) {
    findings.push(`Churn rate de ${churnKPI.value}% acima do aceitável`)
    recommendations.push('Implementar ações de retenção de clientes')
  }

  return {
    agent: 'comercial',
    confidence: findings.length > 0 ? 85 : 60,
    findings,
    evidence,
    recommendations,
    limitations: ['Dados agregados mensais']
  }
}

// ==========================================
// AGENTE: FINANCEIRO
// ==========================================

export async function agentFinanceiro(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []

  // KPIs financeiros - usa unit do contexto se disponível
  const unit = (context?.unit as string | undefined) || 'financeiro'
  const kpis = await DataAdapter.get_kpis_overview('dezembro', unit)
  
  const inadimplenciaKPI = kpis.kpis.find(k => k.id === 'inadimplencia')
  if (inadimplenciaKPI && inadimplenciaKPI.value > 3) {
    findings.push(`Inadimplência de ${inadimplenciaKPI.value}% acima do aceitável`)
    evidence.push({
      metric: 'Inadimplência',
      value: `${inadimplenciaKPI.value}%`,
      comparison: 'Meta: <3%',
      source: 'get_kpis_overview'
    })
    recommendations.push('Intensificar cobrança e revisar políticas de crédito')
  }

  const pmrKPI = kpis.kpis.find(k => k.id === 'pmr')
  if (pmrKPI && pmrKPI.value > 30) {
    findings.push(`PMR de ${pmrKPI.value} dias acima do ideal`)
    recommendations.push('Acelerar recebimentos')
  }

  return {
    agent: 'financeiro',
    confidence: findings.length > 0 ? 80 : 65,
    findings,
    evidence,
    recommendations,
    limitations: ['Análise baseada em indicadores agregados']
  }
}

// ==========================================
// MAPA DE AGENTES
// ==========================================

export const agents: Record<AgentType, (question: string, context?: Record<string, unknown>) => Promise<AgentResponse>> = {
  custos_margem: agentCustosMargem,
  compras_fornecedores: agentComprasFornecedores,
  producao: agentProducao,
  qualidade: agentProducao, // Reutiliza lógica de produção
  estoque_logistica: agentEstoqueLogistica,
  comercial: agentComercial,
  financeiro: agentFinanceiro,
  auditor: async () => ({
    agent: 'auditor',
    confidence: 100,
    findings: [],
    evidence: [],
    recommendations: [],
    limitations: []
  })
}

