// ==========================================
// RECUPERAÇÃO DE CONTEXTO DE CONVERSA
// ==========================================
// Funções para detectar perguntas de follow-up e recuperar contexto

import type { ConversationMessage } from './types.js'

/**
 * Detecta se a pergunta é um follow-up (ex: "e da margarina?", "e o fermento?", "e do leite?")
 */
export function isFollowUpQuestion(question: string): boolean {
  const lowerQuestion = question.toLowerCase().trim()
  
  // Padrões de follow-up
  const followUpPatterns = [
    /^e\s+(da|do|dos|das|o|a|os|as)\s+/i, // "e da margarina?", "e o fermento?", "e do leite?"
    /^e\s+(quanto|qual|quais)/i, // "e quanto?", "e qual?"
    /^e\s+[a-záàâãéêíóôõúç]+/i, // "e margarina?", "e leite?" (sem artigo)
  ]
  
  return followUpPatterns.some(pattern => pattern.test(lowerQuestion))
}

/**
 * Detecta se a resposta é uma seleção de indicador (ex: "Custo", "OTD", "Custo / Variação de Preço")
 */
export function isKpiSelection(answer: string): boolean {
  const lowerAnswer = answer.toLowerCase().trim()
  
  // KPIs conhecidos (incluindo variações com "/")
  const knownKpis = [
    'custo', 'custo total', 'custo mp', 'custo / variação de preço', 'custo / variacao de preco',
    'otd', 'otd fornecedores', 'otd (entregas no prazo)',
    'fill rate', 'fill rate (pedido completo)',
    'lead time', 'lead time (quantos dias)',
    'cobertura', 'cobertura de estoque',
    'qualidade', 'não conformidades', 'nao conformidades',
    'dependência', 'dependencia', 'dependência / volume de compras por fornecedor'
  ]
  
  // Verifica se a resposta corresponde a algum KPI conhecido
  return knownKpis.some(kpi => lowerAnswer.includes(kpi) || kpi.includes(lowerAnswer))
}

/**
 * Extrai o nome do insumo/produto de uma pergunta de follow-up
 */
export function extractInputFromFollowUp(question: string): string | null {
  const lowerQuestion = question.toLowerCase().trim()
  
  // Remove padrões de follow-up
  let cleaned = lowerQuestion
    .replace(/^e\s+(da|do|dos|das|o|a|os|as)\s+/i, '')
    .replace(/^e\s+/i, '')
    .replace(/\?$/, '') // Remove interrogação no final
    .trim()
  
  if (cleaned.length === 0) return null
  
  // Lista de insumos conhecidos (ordem importa - mais específicos primeiro)
  const knownInputs = [
    'farinha de trigo',
    'farinha',
    'margarina',
    'fermento',
    'açúcar', 'acucar', 'açucar', 'acúcar',
    'sal',
    'ovos', 'ovo',
    'leite'
  ]
  
  // Busca o primeiro insumo que aparece na pergunta
  for (const input of knownInputs) {
    if (cleaned.includes(input)) {
      return input
    }
  }
  
  return cleaned // Retorna o texto limpo se não encontrou um insumo conhecido
}

/**
 * Recupera o contexto da pergunta anterior
 */
export function recoverContextFromHistory(
  currentQuestion: string,
  history: ConversationMessage[]
): { recoveredQuestion: string; contextType: 'follow-up' | 'clarification' | 'none' } {
  
  // Se a pergunta menciona explicitamente um KPI/indicador diferente, NÃO recupera contexto
  // Ex: se pergunta anterior era sobre "fornecedor que demora mais" e agora é "lead time médio"
  // → não deve recuperar contexto, é uma nova pergunta
  const lowerQuestion = currentQuestion.toLowerCase()
  const explicitKpiKeywords = [
    'lead time', 'leadtime', 'tempo de entrega', 'tempo médio de entrega',
    'otd', 'on time delivery', 'fill rate', 'cobertura', 'custo total',
    'não conformidades', 'nao conformidades', 'qualidade',
    'oee', 'disponibilidade', 'performance', 'rendimento', 'produtividade'
  ]
  const hasExplicitKpi = explicitKpiKeywords.some(kw => lowerQuestion.includes(kw))
  
  // Se menciona KPI explícito, não recupera contexto (é nova pergunta)
  if (hasExplicitKpi && !isFollowUpQuestion(currentQuestion)) {
    return {
      recoveredQuestion: currentQuestion,
      contextType: 'none'
    }
  }
  
  // Detecta follow-up
  if (isFollowUpQuestion(currentQuestion)) {
    // Busca a última pergunta do usuário que não é um follow-up
    const lastUserQuestion = [...history]
      .reverse()
      .find(msg => msg.role === 'user' && !isFollowUpQuestion(msg.content))
    
    if (lastUserQuestion) {
      const extractedInput = extractInputFromFollowUp(currentQuestion)
      if (extractedInput) {
        // Reconstrói a pergunta baseada no padrão da última pergunta
        // Ex: se a última foi "preço de compra do fermento" e agora é "e da margarina?"
        // → "preço de compra da margarina"
        const lastQuestion = lastUserQuestion.content.toLowerCase()
        
        // Detecta se a pergunta anterior era sobre evolução (variação, evolução, período, etc.)
        const evolutionKeywords = [
          'evolução', 'evolucao', 'variação', 'variacao', 'variação mensal', 'variacao mensal',
          'tendência', 'tendencia', 'período', 'periodo', 'histórico', 'historico',
          'série', 'serie', 'gráfico', 'grafico', 'me mostre', 'mostre'
        ]
        const hasEvolutionContext = evolutionKeywords.some(kw => lastQuestion.includes(kw))
        
        // Detecta período mencionado na pergunta anterior (ex: "de maio a agosto")
        const monthKeywords = [
          'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
          'janeiro', 'fevereiro', 'março', 'marco', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ]
        const hasPeriod = monthKeywords.some(kw => {
          const pos = lastQuestion.indexOf(kw)
          if (pos === -1) return false
          const before = pos > 0 ? lastQuestion[pos - 1] : ' '
          const after = pos + kw.length < lastQuestion.length ? lastQuestion[pos + kw.length] : ' '
          return /[\s,.\-]/.test(before) && /[\s,.\-]/.test(after)
        })
        const hasPeriodConnector = (lastQuestion.includes(' a ') || 
                                   lastQuestion.includes(' até ') || 
                                   lastQuestion.includes(' ate ')) && hasPeriod
        
        // Se a pergunta anterior era sobre evolução/período, mantém esse contexto
        if (hasEvolutionContext || hasPeriodConnector) {
          // Extrai período da pergunta anterior se existir
          let periodPart = ''
          if (hasPeriodConnector) {
            // Tenta extrair o período (ex: "de maio a agosto" → "de maio a agosto")
            const periodMatch = lastQuestion.match(/(de\s+[a-zç]+?\s+a\s+[a-zç]+)/i)
            if (periodMatch) {
              periodPart = periodMatch[1]
            } else {
              // Fallback: procura padrão "X a Y" onde X e Y são meses
              const months = monthKeywords.filter(kw => {
                const pos = lastQuestion.indexOf(kw)
                if (pos === -1) return false
                const before = pos > 0 ? lastQuestion[pos - 1] : ' '
                const after = pos + kw.length < lastQuestion.length ? lastQuestion[pos + kw.length] : ' '
                return /[\s,.\-]/.test(before) && /[\s,.\-]/.test(after)
              })
              if (months.length >= 2) {
                const firstMonth = months[0]
                const lastMonth = months[months.length - 1]
                periodPart = `de ${firstMonth} a ${lastMonth}`
              }
            }
          }
          
          // Reconstrói pergunta mantendo contexto de evolução
          const artigo = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'da' : 'do'
          if (periodPart) {
            return {
              recoveredQuestion: `variação do preço de compra ${artigo} ${extractedInput} ${periodPart}`,
              contextType: 'follow-up'
            }
          } else {
            return {
              recoveredQuestion: `variação do preço de compra ${artigo} ${extractedInput}`,
              contextType: 'follow-up'
            }
          }
        }
        
        // Extrai o padrão da pergunta anterior (preço pontual)
        if (lastQuestion.includes('preço de compra')) {
          // Ajusta artigo: "do" para masculino, "da" para feminino
          const artigo = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'da' : 'do'
          return {
            recoveredQuestion: `preço de compra ${artigo} ${extractedInput}`,
            contextType: 'follow-up'
          }
        } else if (lastQuestion.includes('qual o preço')) {
          const artigo = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'da' : 'do'
          return {
            recoveredQuestion: `qual o preço de compra ${artigo} ${extractedInput}`,
            contextType: 'follow-up'
          }
        } else if (lastQuestion.includes('quanto custa')) {
          const artigo = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'a' : 'o'
          return {
            recoveredQuestion: `quanto custa ${artigo} ${extractedInput}`,
            contextType: 'follow-up'
          }
        }
        
        // Fallback: adiciona o input à pergunta anterior
        return {
          recoveredQuestion: `${lastUserQuestion.content} ${extractedInput}`,
          contextType: 'follow-up'
        }
      }
    }
  }
  
  // Detecta resposta a clarificação
  if (isKpiSelection(currentQuestion)) {
    // Busca a última resposta do assistente que pediu clarificação
    const lastAssistantMessage = [...history]
      .reverse()
      .find(msg => msg.role === 'assistant' && 
        (msg.content.includes('Qual desses indicadores') || 
         msg.content.includes('Indicadores sugeridos')))
    
    if (lastAssistantMessage) {
      // Busca a pergunta do usuário que gerou essa clarificação
      const lastAssistantIndex = history.findIndex(msg => msg.content === lastAssistantMessage.content)
      if (lastAssistantIndex > 0) {
        const previousQuestion = history[lastAssistantIndex - 1]
        if (previousQuestion.role === 'user') {
          // Se a pergunta anterior também era um follow-up, precisa buscar a pergunta original
          let originalQuestion = previousQuestion.content
          
          // Se a pergunta anterior era um follow-up, busca a pergunta original antes dela
          if (isFollowUpQuestion(originalQuestion)) {
            // Busca a pergunta original (antes do follow-up)
            const originalUserQuestion = history
              .slice(0, lastAssistantIndex - 1)
              .reverse()
              .find(msg => msg.role === 'user' && !isFollowUpQuestion(msg.content))
            
            if (originalUserQuestion) {
              // Reconstrói baseado na pergunta original
              const extractedInput = extractInputFromFollowUp(previousQuestion.content)
              if (extractedInput) {
                const originalLower = originalUserQuestion.content.toLowerCase()
                // Ajusta artigo: "do" para masculino, "da" para feminino
                const artigo = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'da' : 'do'
                const artigoA = extractedInput === 'margarina' || extractedInput === 'farinha' ? 'a' : 'o'
                
                if (originalLower.includes('preço de compra')) {
                  originalQuestion = `preço de compra ${artigo} ${extractedInput}`
                } else if (originalLower.includes('qual o preço')) {
                  originalQuestion = `qual o preço de compra ${artigo} ${extractedInput}`
                } else if (originalLower.includes('quanto custa')) {
                  originalQuestion = `quanto custa ${artigoA} ${extractedInput}`
                } else {
                  // Fallback: usa padrão da pergunta original + novo insumo
                  originalQuestion = originalUserQuestion.content.replace(
                    /(farinha|margarina|fermento|açúcar|acucar|sal|ovos|ovo|leite)/i,
                    extractedInput
                  )
                }
              }
            }
          }
          
          // IMPORTANTE: Se a pergunta original era sobre preço específico de insumo,
          // mantém o contexto de preço específico, IGNORA a seleção de KPI
          const originalLower = originalQuestion.toLowerCase()
          if (originalLower.includes('preço de compra') || 
              originalLower.includes('qual o preço') || 
              originalLower.includes('quanto custa')) {
            // A pergunta é sobre preço específico - mantém o contexto, ignora KPI selecionado
            return {
              recoveredQuestion: originalQuestion,
              contextType: 'clarification'
            }
          }
          
          // Caso contrário, adiciona o KPI selecionado
          return {
            recoveredQuestion: `${originalQuestion} ${currentQuestion}`,
            contextType: 'clarification'
          }
        }
      }
    }
  }
  
  return {
    recoveredQuestion: currentQuestion,
    contextType: 'none'
  }
}

