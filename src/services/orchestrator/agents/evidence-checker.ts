// ==========================================
// VERIFICAÇÃO DE EVIDÊNCIA MÍNIMA POR KPI
// ==========================================
// Cada KPI tem requisitos específicos de evidência

import type { PageContext } from '../page-context.js'

export interface EvidenceCheckResult {
  hasMinimumEvidence: boolean
  missingFields: string[]
  availableFields: string[]
}

/**
 * Verifica se há evidência mínima para um KPI específico
 */
export function checkEvidenceForKPI(
  kpiId: string,
  pageContext: PageContext | null
): EvidenceCheckResult {
  if (!pageContext) {
    return {
      hasMinimumEvidence: false,
      missingFields: ['pageContext'],
      availableFields: []
    }
  }

  const missing: string[] = []
  const available: string[] = []

  switch (kpiId) {
    case 'otd_fornecedores':
      // Precisa: OTD atual OU top fornecedores atrasados
      const otdKpi = pageContext.kpis.find(k => k.id === 'otd')
      if (otdKpi && otdKpi.value !== undefined && otdKpi.value !== null) {
        available.push('otd_value')
      } else {
        missing.push('otd_value')
      }
      
      if (pageContext.rankingFornecedores && pageContext.rankingFornecedores.length > 0) {
        available.push('ranking_fornecedores')
      } else {
        missing.push('ranking_fornecedores')
      }
      
      return {
        hasMinimumEvidence: available.length > 0,
        missingFields: missing,
        availableFields: available
      }

    case 'custo_total_mp':
      // Precisa: Variação % OU top insumos com aumento
      const custoKpi = pageContext.kpis.find(k => k.id === 'custo_mp')
      if (custoKpi && custoKpi.value !== undefined && custoKpi.value !== null) {
        available.push('custo_value')
        if (custoKpi.change !== undefined) {
          available.push('custo_variation')
        }
      } else {
        missing.push('custo_value')
      }
      
      if (pageContext.tabelaPrecos && pageContext.tabelaPrecos.length > 0) {
        available.push('tabela_precos')
      } else {
        missing.push('tabela_precos')
      }
      
      return {
        hasMinimumEvidence: available.length > 0,
        missingFields: missing,
        availableFields: available
      }

    case 'nao_conformidades':
      // Precisa: NC/devoluções OU top fornecedores com ocorrência
      const ncKpi = pageContext.kpis.find(k => k.id === 'nao_conformidades')
      if (ncKpi && ncKpi.value !== undefined && ncKpi.value !== null) {
        available.push('nc_value')
      } else {
        missing.push('nc_value')
      }
      
      if (pageContext.rankingFornecedores && pageContext.rankingFornecedores.length > 0) {
        available.push('ranking_fornecedores')
      } else {
        missing.push('ranking_fornecedores')
      }
      
      return {
        hasMinimumEvidence: available.length > 0,
        missingFields: missing,
        availableFields: available
      }

    case 'fill_rate':
      const fillRateKpi = pageContext.kpis.find(k => k.id === 'fill_rate')
      if (fillRateKpi && fillRateKpi.value !== undefined && fillRateKpi.value !== null) {
        return {
          hasMinimumEvidence: true,
          missingFields: [],
          availableFields: ['fill_rate_value']
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: ['fill_rate_value'],
        availableFields: []
      }

    case 'lead_time_medio':
      const leadTimeKpi = pageContext.kpis.find(k => k.id === 'lead_time')
      if (leadTimeKpi && leadTimeKpi.value !== undefined && leadTimeKpi.value !== null) {
        return {
          hasMinimumEvidence: true,
          missingFields: [],
          availableFields: ['lead_time_value']
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: ['lead_time_value'],
        availableFields: []
      }

    case 'cobertura_estoque_mp':
      const coberturaKpi = pageContext.kpis.find(k => k.id === 'cobertura')
      if (coberturaKpi && coberturaKpi.value !== undefined && coberturaKpi.value !== null) {
        return {
          hasMinimumEvidence: true,
          missingFields: [],
          availableFields: ['cobertura_value']
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: ['cobertura_value'],
        availableFields: []
      }

    case 'dependencia_fornecedores':
      // Precisa: ranking de fornecedores com campo dependencia
      if (pageContext.rankingFornecedores && pageContext.rankingFornecedores.length > 0) {
        const hasDependencia = pageContext.rankingFornecedores.some(f => 
          typeof f.dependencia === 'number' && f.dependencia > 0
        )
        if (hasDependencia) {
          return {
            hasMinimumEvidence: true,
            missingFields: [],
            availableFields: ['ranking_fornecedores_dependencia']
          }
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: ['ranking_fornecedores_dependencia'],
        availableFields: []
      }

    // KPIs de Produção
    case 'oee':
    case 'disponibilidade':
    case 'performance':
    case 'qualidade':
    case 'rendimento':
    case 'perdas_processo':
    case 'producao_total':
    case 'mtbf':
      // Para KPIs de Produção, verifica se existe no contexto
      const producaoKpi = pageContext.kpis.find(k => k.id === kpiId)
      if (producaoKpi && producaoKpi.value !== undefined && producaoKpi.value !== null) {
        return {
          hasMinimumEvidence: true,
          missingFields: [],
          availableFields: [`${kpiId}_value`]
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: [`${kpiId}_value`],
        availableFields: []
      }

    default:
      // Para KPIs desconhecidos, verifica se existe no contexto genérico
      const genericKpi = pageContext.kpis.find(k => k.id === kpiId)
      if (genericKpi && genericKpi.value !== undefined && genericKpi.value !== null) {
        return {
          hasMinimumEvidence: true,
          missingFields: [],
          availableFields: [`${kpiId}_value`]
        }
      }
      return {
        hasMinimumEvidence: false,
        missingFields: ['unknown_kpi'],
        availableFields: []
      }
  }
}

/**
 * Gera mensagem de clarificação útil baseada em KPIs alternativos
 */
export function generateClarificationMessage(
  alternativeKpis: string[],
  question: string
): { message: string; options: string[] } {
  const kpiLabels: Record<string, string> = {
    // Compras
    'otd_fornecedores': 'OTD (entregas no prazo)',
    'fill_rate': 'Fill Rate (pedido completo)',
    'lead_time_medio': 'Lead Time (quantos dias)',
    'nao_conformidades': 'Qualidade / Não Conformidades',
    'custo_total_mp': 'Custo / Variação de Preço',
    'cobertura_estoque_mp': 'Cobertura de Estoque',
    'dependencia_fornecedores': 'Dependência / Volume de Compras por Fornecedor',
    // Produção
    'oee': 'OEE',
    'disponibilidade': 'Disponibilidade',
    'performance': 'Performance',
    'qualidade': 'Qualidade',
    'rendimento': 'Rendimento Médio',
    'perdas_processo': 'Perdas Processo',
    'producao_total': 'Produção Total',
    'mtbf': 'MTBF'
  }

  const options = alternativeKpis
    .filter(kpiId => kpiId in kpiLabels || kpiId) // Filtra apenas KPIs conhecidos ou IDs válidos
    .map(kpiId => kpiLabels[kpiId] || kpiId)
    .filter(Boolean) // Remove vazios

  let message = ''
  
  if (alternativeKpis.length === 2 && options.length === 2) {
    if (alternativeKpis.includes('otd_fornecedores') && alternativeKpis.includes('fill_rate')) {
      message = 'Você quer saber sobre OTD (entregas no prazo) ou Fill Rate (pedido completo)?'
    } else if (alternativeKpis.includes('otd_fornecedores') && alternativeKpis.includes('lead_time_medio')) {
      message = 'Você quer saber sobre OTD (no prazo) ou Lead Time (quantos dias)?'
    } else {
      message = `Quando você diz "${question}", você quer saber sobre ${options[0]} ou ${options[1]}?`
    }
  } else if (options.length > 0) {
    message = `Qual desses indicadores você quer consultar?`
  } else {
    message = `Sua pergunta pode se referir a diferentes indicadores. Qual deles você quer consultar?`
  }

  return { message, options }
}

