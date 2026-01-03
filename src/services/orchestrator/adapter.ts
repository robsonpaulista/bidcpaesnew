// ==========================================
// ADAPTER DE DADOS - MOCK (Fase Atual)
// ==========================================
// Este adapter implementa as funções semânticas usando dados mockados
// Na fase pós-migração, será substituído por AdapterSQL que executa views/procedures

import {
  KPIsOverview,
  MarginByProduct,
  CostBreakdown,
  LossesByLine,
  OEE,
  SupplierVariation,
  StockCoverage,
  OTIF,
  SalesMix,
  RouteCost,
  VehiclePerformance
} from './types'
import {
  homeKPIs,
  comercialKPIs,
  producaoKPIs,
  comprasKPIs,
  estoqueKPIs,
  logisticaKPIs,
  financeiroKPIs,
  receitaMensal,
  volumePorCategoria,
  perdasPorArea,
  perdasProducao,
  oeeHistorico,
  rendimentoPorLinha,
  custoMateriasPrimas,
  performanceFornecedores,
  giroEstoqueCategoria,
  otifHistorico,
  mixProdutos,
  custoLogisticoPorRota,
  performanceVeiculos,
  evolucaoPrecos
} from '../mockData'

// ==========================================
// FUNÇÕES SEMÂNTICAS
// ==========================================

export async function get_kpis_overview(
  period: string,
  unit?: string,
  line?: string
): Promise<KPIsOverview> {
  // Simula delay de consulta
  await new Promise(resolve => setTimeout(resolve, 300))

  let kpis = [...homeKPIs]

  if (unit === 'producao') {
    kpis = producaoKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  } else if (unit === 'comercial') {
    kpis = comercialKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  } else if (unit === 'compras') {
    kpis = comprasKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  } else if (unit === 'estoque') {
    kpis = estoqueKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  } else if (unit === 'logistica') {
    kpis = logisticaKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  } else if (unit === 'financeiro') {
    kpis = financeiroKPIs.map(k => ({
      ...k,
      id: k.id,
      label: k.label,
      value: k.value,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  }

  return {
    period,
    unit,
    line,
    kpis: kpis.map(k => ({
      id: k.id,
      label: k.label,
      value: typeof k.value === 'number' ? k.value : 0,
      unit: k.unit || '',
      change: k.change,
      trend: k.trend || 'neutral'
    }))
  }
}

export async function get_margin_by_product(period: string): Promise<MarginByProduct> {
  await new Promise(resolve => setTimeout(resolve, 400))

  // Usa dados reais do mix de produtos e margens comerciais
  const mixData = mixProdutos
  const baseRevenue = receitaMensal[receitaMensal.length - 1].value || 0
  
  const products = mixData.map((mix) => {
    const revenue = (baseRevenue * (mix.atual || 0)) / 100
    const margin = mix.margem || 28.7 // Usa margem real do mix
    const cost = revenue * (1 - margin / 100)
    
    // Calcula variação baseada na diferença entre atual e ideal
    const change = ((mix.atual || 0) - (mix.ideal || 0)) * 0.5

    return {
      name: mix.name,
      margin: Number(margin.toFixed(1)),
      revenue: Number(revenue.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      change: Number(change.toFixed(1))
    }
  })

  return { period, products }
}

export async function get_cost_breakdown(
  product: string,
  period: string
): Promise<CostBreakdown> {
  await new Promise(resolve => setTimeout(resolve, 350))

  const breakdown = [
    { category: 'Matéria-Prima', value: 60, percent: 60 },
    { category: 'Mão de Obra', value: 22, percent: 22 },
    { category: 'Energia/Utilidades', value: 8, percent: 8 },
    { category: 'Manutenção', value: 5, percent: 5 },
    { category: 'Outros', value: 5, percent: 5 }
  ]

  return {
    product,
    period,
    breakdown,
    total: 100
  }
}

export async function get_losses_by_line(period: string): Promise<LossesByLine> {
  await new Promise(resolve => setTimeout(resolve, 400))

  const lines = [
    {
      line: 'Linha 1 - Francês',
      losses: 927,
      percent: 1.6,
      causes: [
        { cause: 'Massa mole', value: 35 },
        { cause: 'Massa dura', value: 22 },
        { cause: 'Queimado', value: 18 },
        { cause: 'Formato irregular', value: 15 },
        { cause: 'Outros', value: 10 }
      ]
    },
    {
      line: 'Linha 2 - Forma',
      losses: 583,
      percent: 1.8,
      causes: [
        { cause: 'Massa mole', value: 40 },
        { cause: 'Queimado', value: 25 },
        { cause: 'Formato irregular', value: 20 },
        { cause: 'Outros', value: 15 }
      ]
    },
    {
      line: 'Linha 3 - Doces',
      losses: 477,
      percent: 2.2,
      causes: [
        { cause: 'Massa mole', value: 30 },
        { cause: 'Queimado', value: 28 },
        { cause: 'Formato irregular', value: 25 },
        { cause: 'Outros', value: 17 }
      ]
    }
  ]

  return { period, lines }
}

export async function get_oee(line: string, period: string): Promise<OEE> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const lastOEE = oeeHistorico[oeeHistorico.length - 1]
  const lineNumber = line.includes('1') ? 1 : line.includes('2') ? 2 : line.includes('3') ? 3 : 4

  return {
    line,
    period,
    oee: (lastOEE.oee as number) || 78.5,
    availability: (lastOEE.disponibilidade as number) || 92.3,
    performance: (lastOEE.performance as number) || 88.7,
    quality: (lastOEE.qualidade as number) || 95.8,
    trend: 'up'
  }
}

export async function get_supplier_variation(
  input: string,
  period: string
): Promise<SupplierVariation> {
  await new Promise(resolve => setTimeout(resolve, 400))

  const inputData = custoMateriasPrimas.find(c => 
    c.name.toLowerCase().includes(input.toLowerCase())
  )

  // Usa variação real dos dados mockados
  const basePrice = inputData?.value || 4.85
  const realVariation = inputData?.variacao || 0

  const suppliers = performanceFornecedores.map(supplier => {
    // Calcula preço baseado na variação real e performance do fornecedor
    // Fornecedores com melhor qualidade/OTD tendem a ter preços mais estáveis
    const supplierFactor = (supplier.qualidade || 95) / 100
    const variation = realVariation * (1 - supplierFactor * 0.3) // Reduz variação para bons fornecedores
    const price = basePrice * (1 + variation / 100)

    return {
      name: supplier.name,
      price: Number(price.toFixed(2)),
      variation: Number(variation.toFixed(1)),
      otd: supplier.otd || 0,
      quality: supplier.qualidade || 0
    }
  })

  return { input, period, suppliers }
}

export async function get_stock_coverage(
  product: string,
  period: string
): Promise<StockCoverage> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const stockData = giroEstoqueCategoria.find(s => 
    s.name.toLowerCase().includes(product.toLowerCase())
  )

  return {
    product,
    period,
    coverage: stockData?.cobertura || 8,
    stock: stockData?.valor || 0,
    value: stockData?.valor || 0,
    trend: 'neutral'
  }
}

export async function get_otif(period: string): Promise<OTIF> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const lastOTIF = otifHistorico[otifHistorico.length - 1]

  return {
    period,
    otif: lastOTIF.otif || 94.7,
    onTime: lastOTIF.prazo || 96.2,
    inFull: lastOTIF.completo || 98.3,
    trend: 'up'
  }
}

export async function get_sales_mix(
  period: string,
  channel?: string
): Promise<SalesMix> {
  await new Promise(resolve => setTimeout(resolve, 350))

  const mix = mixProdutos.map(m => ({
    product: m.name,
    actual: m.atual || 0,
    ideal: m.ideal || 0,
    margin: m.margem || 0
  }))

  return { period, channel, mix }
}

// ==========================================
// ANÁLISE DE RECEITA MENSAL
// ==========================================

export interface RevenueMonthly {
  period: string
  months: Array<{
    month: string
    value: number
    meta?: number
  }>
  summary: {
    total: number
    average: number
    bestMonth: { month: string; value: number }
    worstMonth: { month: string; value: number }
    variation: {
      min: number
      max: number
      oscillation: number // % de oscilação
    }
  }
}

export async function get_revenue_monthly(period: string): Promise<RevenueMonthly> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const months = receitaMensal.map(m => ({
    month: m.name,
    value: m.value || 0,
    meta: m.meta
  }))

  const values = months.map(m => m.value)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = total / values.length
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const oscillation = ((maxValue - minValue) / average) * 100

  const bestMonth = months.reduce((best, current) => 
    current.value > best.value ? current : best
  )
  const worstMonth = months.reduce((worst, current) => 
    current.value < worst.value ? current : worst
  )

  return {
    period,
    months,
    summary: {
      total,
      average,
      bestMonth: { month: bestMonth.month, value: bestMonth.value },
      worstMonth: { month: worstMonth.month, value: worstMonth.value },
      variation: {
        min: minValue,
        max: maxValue,
        oscillation: Number(oscillation.toFixed(2))
      }
    }
  }
}

// ==========================================
// EXPORT DO ADAPTER
// ==========================================

// ==========================================
// ANÁLISE DE CUSTO POR ROTA
// ==========================================

export async function get_route_cost(period: string): Promise<RouteCost> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const routes = custoLogisticoPorRota.map(r => ({
    name: r.name as string,
    cost: (r.custo as number) || 0,
    deliveries: (r.entregas as number) || 0,
    costPerDelivery: (r.custoEntrega as number) || 0,
    km: (r.km as number) || 0,
    costPerKm: ((r.custo as number) || 0) / ((r.km as number) || 1)
  }))

  const totalCost = routes.reduce((sum, r) => sum + r.cost, 0)
  const totalDeliveries = routes.reduce((sum, r) => sum + r.deliveries, 0)
  const averageCostPerDelivery = totalCost / totalDeliveries
  const totalKm = routes.reduce((sum, r) => sum + r.km, 0)
  const averageCostPerKm = totalCost / totalKm

  const bestRoute = routes.reduce((best, current) => 
    current.costPerDelivery < best.costPerDelivery ? current : best
  )
  const worstRoute = routes.reduce((worst, current) => 
    current.costPerDelivery > worst.costPerDelivery ? current : worst
  )

  return {
    period,
    routes,
    summary: {
      totalCost,
      totalDeliveries,
      averageCostPerDelivery,
      averageCostPerKm,
      bestRoute: { name: bestRoute.name, costPerDelivery: bestRoute.costPerDelivery },
      worstRoute: { name: worstRoute.name, costPerDelivery: worstRoute.costPerDelivery }
    }
  }
}

// ==========================================
// ANÁLISE DE PERFORMANCE DE VEÍCULOS
// ==========================================

export async function get_vehicle_performance(period: string): Promise<VehiclePerformance> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const vehicles = performanceVeiculos.map(v => ({
    name: v.name as string,
    deliveries: (v.entregas as number) || 0,
    capacity: (v.capacidade as number) || 0,
    cost: (v.custo as number) || 0,
    km: (v.km as number) || 0,
    efficiency: ((v.entregas as number) || 0) / ((v.km as number) || 1) // entregas por km
  }))

  const totalVehicles = vehicles.length
  const totalDeliveries = vehicles.reduce((sum, v) => sum + v.deliveries, 0)
  const totalKm = vehicles.reduce((sum, v) => sum + v.km, 0)
  const averageEfficiency = totalDeliveries / totalKm

  const bestVehicle = vehicles.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  )
  const worstVehicle = vehicles.reduce((worst, current) => 
    current.efficiency < worst.efficiency ? current : worst
  )

  return {
    period,
    vehicles,
    summary: {
      totalVehicles,
      averageEfficiency,
      bestVehicle: { name: bestVehicle.name, efficiency: bestVehicle.efficiency },
      worstVehicle: { name: worstVehicle.name, efficiency: worstVehicle.efficiency }
    }
  }
}

// ==========================================
// ANÁLISE DE SAZONALIDADE DE COMPRAS (MATÉRIAS-PRIMAS)
// ==========================================

export interface RawMaterialSeasonality {
  period: string
  materials: Array<{
    name: string
    months: Array<{
      month: string
      price: number
    }>
    summary: {
      average: number
      min: number
      max: number
      oscillation: number
      bestMonth: { month: string; price: number }
      worstMonth: { month: string; price: number }
    }
  }>
  overall: {
    averageOscillation: number
    mostVolatile: { name: string; oscillation: number }
    mostStable: { name: string; oscillation: number }
  }
}

export async function get_raw_material_seasonality(period: string): Promise<RawMaterialSeasonality> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // Extrai matérias-primas dos dados de evolução de preços
  const materialNames = ['farinha', 'margarina', 'fermento']
  const materials = materialNames.map(matName => {
    const monthlyPrices = evolucaoPrecos.map(m => ({
      month: m.name as string,
      price: (m[matName as keyof typeof m] as number) || 0
    }))

    const prices = monthlyPrices.map(m => m.price)
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const oscillation = ((max - min) / average) * 100

    const bestMonth = monthlyPrices.reduce((best, current) => 
      current.price < best.price ? current : best
    )
    const worstMonth = monthlyPrices.reduce((worst, current) => 
      current.price > worst.price ? current : worst
    )

    return {
      name: matName === 'farinha' ? 'Farinha de Trigo' : 
            matName === 'margarina' ? 'Margarina' : 
            'Fermento',
      months: monthlyPrices,
      summary: {
        average,
        min,
        max,
        oscillation,
        bestMonth: { month: bestMonth.month, price: bestMonth.price },
        worstMonth: { month: worstMonth.month, price: worstMonth.price }
      }
    }
  })

  const averageOscillation = materials.reduce((sum, m) => sum + m.summary.oscillation, 0) / materials.length
  const mostVolatile = materials.reduce((most, current) => 
    current.summary.oscillation > most.summary.oscillation ? current : most
  )
  const mostStable = materials.reduce((stable, current) => 
    current.summary.oscillation < stable.summary.oscillation ? current : stable
  )

  return {
    period,
    materials,
    overall: {
      averageOscillation,
      mostVolatile: { name: mostVolatile.name, oscillation: mostVolatile.summary.oscillation },
      mostStable: { name: mostStable.name, oscillation: mostStable.summary.oscillation }
    }
  }
}

export const DataAdapter = {
  get_kpis_overview,
  get_margin_by_product,
  get_cost_breakdown,
  get_losses_by_line,
  get_oee,
  get_supplier_variation,
  get_stock_coverage,
  get_otif,
  get_sales_mix,
  get_revenue_monthly,
  get_route_cost,
  get_vehicle_performance,
  get_raw_material_seasonality
}

