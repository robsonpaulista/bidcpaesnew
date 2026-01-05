// ==========================================
// CONTEXTO DA PÁGINA - SNAPSHOT DE DADOS
// ==========================================
// Coleta todos os dados visíveis na página para passar ao agente

import { comprasKPIs, custoMateriasPrimas, performanceFornecedores, evolucaoPrecos } from '../mockData.js'

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
  tabelaPrecos: Array<{
    name: string
    value: number
    variacao: number
    unidade: string
  }>
  rankingFornecedores: Array<{
    name: string
    otd: number
    fillRate: number
    qualidade: number
    dependencia: number
  }>
  seriePrecos: Array<{
    name: string
    farinha?: number
    margarina?: number
    fermento?: number
  }>
}

export function getPageContext(page: string, periodo?: string): PageContext | null {
  if (page !== 'compras') {
    return null
  }

  // KPIs Cards
  const kpis = comprasKPIs.map(kpi => ({
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


