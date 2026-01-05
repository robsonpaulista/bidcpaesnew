// ==========================================
// CONTEXTO DA PÁGINA - SNAPSHOT DE DADOS
// ==========================================
// Coleta todos os dados visíveis na página para passar ao agente

import { 
  comprasKPIs, custoMateriasPrimas, performanceFornecedores, evolucaoPrecos,
  producaoKPIs, oeeHistorico, rendimentoPorLinha, produtividadeTurno, perdasProducao,
  qualidadeProducao
} from '../mockData.js'

export interface PageContext {
  kpis: Array<{
    id: string
    label: string
    value: number | string
    unit: string
    change?: number
    trend?: string
    description?: string
  }>
  // Compras
  tabelaPrecos?: Array<{
    name: string
    value: number
    variacao: number
    unidade: string
  }>
  rankingFornecedores?: Array<{
    name: string
    otd: number
    fillRate: number
    qualidade: number
    dependencia: number
  }>
  seriePrecos?: Array<{
    name: string
    farinha?: number
    margarina?: number
    fermento?: number
  }>
  // Produção
  serieOEE?: Array<{
    name: string
    oee?: number
    disponibilidade?: number
    performance?: number
    qualidade?: number
  }>
  rendimentoLinhas?: Array<{
    name: string
    rendimento: number
    meta: number
  }>
  produtividadeTurnos?: Array<{
    name: string
    valor: number
    meta: number
    eficiencia: number
  }>
  perdasProducao?: Array<{
    name: string
    value: number
    kg: number
  }>
  qualidadeProducao?: {
    temperatura_forno: {
      min: number
      max: number
      unidade: string
      conformidade: number
    }
    ph_massa: {
      min: number
      max: number
      conformidade: number
    }
    umidade: {
      min: number
      max: number
      unidade: string
      conformidade: number
    }
  }
}

export function getPageContext(page: string, periodo?: string): PageContext | null {
  // KPIs Cards (comuns a todas as páginas)
  let kpis: PageContext['kpis'] = []

  if (page === 'compras') {
    kpis = comprasKPIs.map(kpi => ({
      id: kpi.id,
      label: kpi.label,
      value: typeof kpi.value === 'number' ? kpi.value : 0,
      unit: kpi.unit || '',
      change: kpi.change,
      trend: kpi.trend || 'neutral',
      description: kpi.description
    }))

    // Tabela Custo por Matéria-Prima
    const tabelaPrecos = custoMateriasPrimas.map(mp => ({
      name: mp.name as string,
      value: typeof mp.value === 'number' ? mp.value : 0,
      variacao: typeof mp.variacao === 'number' ? mp.variacao : 0,
      unidade: typeof mp.unidade === 'string' ? mp.unidade : 'kg'
    }))

    // Ranking Performance Fornecedores
    const rankingFornecedores = performanceFornecedores.map(f => ({
      name: f.name as string,
      otd: typeof f.otd === 'number' ? f.otd : 0,
      fillRate: typeof f.fillRate === 'number' ? f.fillRate : 0,
      qualidade: typeof f.qualidade === 'number' ? f.qualidade : 0,
      dependencia: typeof f.dependencia === 'number' ? f.dependencia : 0
    }))

    // Série Evolução de Preços
    const seriePrecos = evolucaoPrecos.map(mes => ({
      name: mes.name as string,
      farinha: typeof mes.farinha === 'number' ? mes.farinha : undefined,
      margarina: typeof mes.margarina === 'number' ? mes.margarina : undefined,
      fermento: typeof mes.fermento === 'number' ? mes.fermento : undefined
    }))

    return {
      kpis,
      tabelaPrecos,
      rankingFornecedores,
      seriePrecos
    }
  }

  if (page === 'producao') {
    kpis = producaoKPIs.map(kpi => ({
      id: kpi.id,
      label: kpi.label,
      value: typeof kpi.value === 'number' ? kpi.value : 0,
      unit: kpi.unit || '',
      change: kpi.change,
      trend: kpi.trend || 'neutral',
      description: kpi.description
    }))

    // Série Histórica OEE (com disponibilidade, performance, qualidade)
    const serieOEE = oeeHistorico.map(mes => ({
      name: mes.name as string,
      oee: typeof mes.oee === 'number' ? mes.oee : undefined,
      disponibilidade: typeof mes.disponibilidade === 'number' ? mes.disponibilidade : undefined,
      performance: typeof mes.performance === 'number' ? mes.performance : undefined,
      qualidade: typeof mes.qualidade === 'number' ? mes.qualidade : undefined
    }))

    // Rendimento por Linha
    const rendimentoLinhas = rendimentoPorLinha.map(linha => ({
      name: linha.name as string,
      rendimento: typeof linha.rendimento === 'number' ? linha.rendimento : 0,
      meta: typeof linha.meta === 'number' ? linha.meta : 0
    }))

    // Produtividade por Turno
    const produtividadeTurnos = produtividadeTurno.map(turno => ({
      name: turno.name as string,
      valor: typeof turno.valor === 'number' ? turno.valor : 0,
      meta: typeof turno.meta === 'number' ? turno.meta : 0,
      eficiencia: typeof turno.eficiencia === 'number' ? turno.eficiencia : 0
    }))

    // Perdas de Produção
    const perdasProducaoData = perdasProducao.map(perda => ({
      name: perda.name as string,
      value: typeof perda.value === 'number' ? perda.value : 0,
      kg: typeof perda.kg === 'number' ? perda.kg : 0
    }))

    // Indicadores de Qualidade
    const qualidadeProducaoData = {
      temperatura_forno: {
        min: qualidadeProducao.temperatura_forno.min,
        max: qualidadeProducao.temperatura_forno.max,
        unidade: qualidadeProducao.temperatura_forno.unidade,
        conformidade: qualidadeProducao.temperatura_forno.conformidade
      },
      ph_massa: {
        min: qualidadeProducao.ph_massa.min,
        max: qualidadeProducao.ph_massa.max,
        conformidade: qualidadeProducao.ph_massa.conformidade
      },
      umidade: {
        min: qualidadeProducao.umidade.min,
        max: qualidadeProducao.umidade.max,
        unidade: qualidadeProducao.umidade.unidade,
        conformidade: qualidadeProducao.umidade.conformidade
      }
    }

    return {
      kpis,
      serieOEE,
      rendimentoLinhas,
      produtividadeTurnos,
      perdasProducao: perdasProducaoData,
      qualidadeProducao: qualidadeProducaoData
    }
  }

  return null
}


