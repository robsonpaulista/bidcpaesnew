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

export async function agentComprasFornecedores(
  question: string,
  context?: Record<string, unknown>
): Promise<AgentResponse> {
  const findings: string[] = []
  const evidence: AgentResponse['evidence'] = []
  const recommendations: string[] = []

  // SEMPRE busca KPIs da área de compras
  const kpisData = await DataAdapter.get_kpis_overview('dezembro', 'compras')
  const allKPIs = kpisData.kpis || []
  
  // Mapeia perguntas para KPIs específicos
  const mappedKPIs = mapQuestionToKPIs(question, 'compras')
  const lowerQuestion = question.toLowerCase()
  
  // Se mapeou para KPIs específicos, retorna esses KPIs
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
  }
  const isSeasonalityQuestion = lowerQuestion.includes('sazonalidade') ||
                                lowerQuestion.includes('sazonal') ||
                                lowerQuestion.includes('padrão') ||
                                lowerQuestion.includes('padrao') ||
                                context?.intention === 'analyze_supplier_performance'

  // Se pergunta sobre sazonalidade de compras/matérias-primas
  if (isSeasonalityQuestion && (lowerQuestion.includes('compra') || 
                                lowerQuestion.includes('matéria') || 
                                lowerQuestion.includes('materia') ||
                                lowerQuestion.includes('matéria-prima') ||
                                lowerQuestion.includes('materia-prima'))) {
    const seasonalityData = await DataAdapter.get_raw_material_seasonality('dezembro')
    
    // Análise geral de sazonalidade
    if (seasonalityData.overall.averageOscillation > 10) {
      findings.push(`Padrão sazonal moderado detectado: oscilação média de ${seasonalityData.overall.averageOscillation.toFixed(1)}% nos preços de matérias-primas`)
    } else {
      findings.push(`Padrão sazonal fraco: oscilação média de ${seasonalityData.overall.averageOscillation.toFixed(1)}% (variação entre trimestres abaixo de 10%)`)
    }
    
    findings.push(`Matéria-prima mais volátil: ${seasonalityData.overall.mostVolatile.name} (${seasonalityData.overall.mostVolatile.oscillation.toFixed(1)}% de oscilação)`)
    findings.push(`Matéria-prima mais estável: ${seasonalityData.overall.mostStable.name} (${seasonalityData.overall.mostStable.oscillation.toFixed(1)}% de oscilação)`)
    
    // Detalhamento por matéria-prima
    seasonalityData.materials.forEach(mat => {
      evidence.push({
        metric: `${mat.name} - Oscilação`,
        value: `${mat.summary.oscillation.toFixed(1)}%`,
        comparison: `Melhor mês: ${mat.summary.bestMonth.month} (R$ ${mat.summary.bestMonth.price.toFixed(2)}), Pior: ${mat.summary.worstMonth.month} (R$ ${mat.summary.worstMonth.price.toFixed(2)})`,
        source: 'get_raw_material_seasonality'
      })
    })
    
    // Análise por trimestre (agrupa meses)
    seasonalityData.materials.forEach(mat => {
      const quarters: Record<string, number[]> = {
        'Q1': [],
        'Q2': [],
        'Q3': [],
        'Q4': []
      }
      
      mat.months.forEach((m, index) => {
        const quarter = Math.floor(index / 3)
        const quarterKey = `Q${quarter + 1}`
        if (quarters[quarterKey]) {
          quarters[quarterKey].push(m.price)
        }
      })
      
      const quarterAverages = Object.entries(quarters).map(([q, prices]) => ({
        quarter: q,
        average: prices.reduce((sum, p) => sum + p, 0) / prices.length
      }))
      
      const avgAll = quarterAverages.reduce((sum, q) => sum + q.average, 0) / 4
      const quarterDeviations = quarterAverages.map(q => ({
        quarter: q.quarter,
        deviation: ((q.average - avgAll) / avgAll) * 100
      }))
      
      quarterDeviations.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      const strongestQuarter = quarterDeviations[0]
      
      if (Math.abs(strongestQuarter.deviation) > 5) {
        findings.push(`${mat.name}: ${strongestQuarter.quarter} apresenta ${strongestQuarter.deviation > 0 ? 'pico' : 'vale'} de ${Math.abs(strongestQuarter.deviation).toFixed(1)}% vs média anual`)
      }
    })
    
    // Recomendações
    if (seasonalityData.overall.averageOscillation > 10) {
      recommendations.push('Considerar compras antecipadas nos meses de menor preço para matérias-primas mais voláteis')
      recommendations.push(`Negociar contratos de longo prazo para ${seasonalityData.overall.mostVolatile.name}`)
    }
  }

  // Analisa performance de fornecedores (geral ou específico por matéria-prima)
  const isPerformanceQuestion = lowerQuestion.includes('performance') || 
                               lowerQuestion.includes('fornecedor') ||
                               lowerQuestion.includes('fornecedores')
  
  if (isPerformanceQuestion || context?.input) {
    // Se há matéria-prima específica, busca variação por fornecedor
    if (context?.input) {
      const supplierData = await DataAdapter.get_supplier_variation(
        context.input as string,
        'dezembro'
      )

      const highVariation = supplierData.suppliers.filter(s => Math.abs(s.variation) > 3)
      if (highVariation.length > 0) {
        findings.push(`${highVariation.length} fornecedores com variação de preço acima de 3%`)
        highVariation.forEach(s => {
          evidence.push({
            metric: `Variação ${s.name}`,
            value: `${s.variation > 0 ? '+' : ''}${s.variation}%`,
            source: 'get_supplier_variation'
          })
        })
      }

      const lowOTD = supplierData.suppliers.filter(s => s.otd < 90)
      if (lowOTD.length > 0) {
        findings.push(`${lowOTD.length} fornecedores com OTD abaixo de 90%`)
        recommendations.push('Revisar contratos e penalidades por atraso')
      }
    } else {
      // Se não há matéria-prima específica, busca performance geral dos fornecedores
      const kpis = await DataAdapter.get_kpis_overview('dezembro', 'compras')
      const otdKPI = kpis.kpis.find(k => k.id === 'otd')
      
      // Busca dados de performance de fornecedores através do adapter
      // Usa uma matéria-prima genérica para obter dados de todos os fornecedores
      const supplierData = await DataAdapter.get_supplier_variation('Farinha de Trigo', 'dezembro')
      
      if (supplierData && supplierData.suppliers && Array.isArray(supplierData.suppliers)) {
        const performanceFornecedores = supplierData.suppliers
        // Analisa OTD
        const lowOTD = performanceFornecedores.filter(s => s.otd < 90)
        
        if (lowOTD.length > 0) {
          findings.push(`${lowOTD.length} fornecedores com OTD abaixo de 90%`)
          lowOTD.forEach(s => {
            evidence.push({
              metric: `${s.name} - OTD`,
              value: `${s.otd}%`,
              comparison: `Qualidade: ${s.quality}%`,
              source: 'get_supplier_variation'
            })
          })
          recommendations.push('Revisar contratos e penalidades por atraso para fornecedores com OTD baixo')
        }
        
        // Analisa qualidade
        const lowQuality = performanceFornecedores.filter(s => s.quality < 95)
        
        if (lowQuality.length > 0) {
          findings.push(`${lowQuality.length} fornecedores com qualidade abaixo de 95%`)
          lowQuality.forEach(s => {
            evidence.push({
              metric: `${s.name} - Qualidade`,
              value: `${s.quality}%`,
              comparison: `OTD: ${s.otd}%`,
              source: 'get_supplier_variation'
            })
          })
          recommendations.push('Implementar auditorias de qualidade para fornecedores com baixa performance')
        }
        
        // Melhores fornecedores
        const topSuppliers = [...performanceFornecedores]
          .sort((a, b) => (b.otd + b.quality) - (a.otd + a.quality))
          .slice(0, 3)
        
        if (topSuppliers.length > 0) {
          findings.push(`Melhores fornecedores: ${topSuppliers.map(s => s.name).join(', ')}`)
          topSuppliers.forEach(s => {
            evidence.push({
              metric: `${s.name} - Performance`,
              value: `OTD: ${s.otd}%, Qualidade: ${s.quality}%`,
              comparison: 'Fornecedor de alta performance',
              source: 'get_supplier_variation'
            })
          })
        }
      }
      
      if (otdKPI) {
        evidence.push({
          metric: 'OTD Médio Fornecedores',
          value: `${otdKPI.value}%`,
          comparison: 'Meta: 90%',
          source: 'get_kpis_overview'
        })
      }
    }
  }

  // KPIs de compras - usa unit do contexto se disponível
  const unit = (context?.unit as string | undefined) || 'compras'
  const kpis = await DataAdapter.get_kpis_overview('dezembro', unit)
  const otdKPI = kpis.kpis.find(k => k.id === 'otd')
  if (otdKPI && otdKPI.value < 90) {
    findings.push('OTD de fornecedores abaixo de 90%')
    evidence.push({
      metric: 'OTD Fornecedores',
      value: `${otdKPI.value}%`,
      comparison: 'Meta: 90%',
      source: 'get_kpis_overview'
    })
  }

  return {
    agent: 'compras_fornecedores',
    confidence: findings.length > 0 ? 80 : 60,
    findings,
    evidence,
    recommendations,
    limitations: ['Análise baseada em dados agregados']
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

  // Analisa OEE
  const line = (context?.line as string) || 'Linha 1 - Francês'
  const oeeData = await DataAdapter.get_oee(line, 'dezembro')
  
  if (oeeData.oee < 80) {
    findings.push(`OEE de ${oeeData.oee}% abaixo da meta de 80%`)
    evidence.push({
      metric: 'OEE',
      value: `${oeeData.oee}%`,
      comparison: 'Meta: 80%',
      source: 'get_oee'
    })
    
    if (oeeData.availability < 90) {
      recommendations.push('Investigar paradas não programadas')
    }
    if (oeeData.performance < 85) {
      recommendations.push('Otimizar velocidade de produção')
    }
    if (oeeData.quality < 95) {
      recommendations.push('Revisar processos de qualidade')
    }
  }

  // Analisa perdas
  const lossesData = await DataAdapter.get_losses_by_line('dezembro')
  const highLosses = lossesData.lines.filter(l => l.percent > 2)
  if (highLosses.length > 0) {
    findings.push(`${highLosses.length} linhas com perdas acima de 2%`)
    highLosses.forEach(l => {
      evidence.push({
        metric: `Perdas ${l.line}`,
        value: `${l.percent}%`,
        comparison: 'Meta: <2%',
        source: 'get_losses_by_line'
      })
    })
    recommendations.push('Investigar causas principais de perdas por linha')
  }

  return {
    agent: 'producao',
    confidence: findings.length > 0 ? 85 : 70,
    findings,
    evidence,
    recommendations,
    limitations: ['Análise por linha específica']
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
  const isEstoqueQuestion = lowerQuestion.includes('estoque') || 
                            lowerQuestion.includes('acurácia') || 
                            lowerQuestion.includes('acuracia') ||
                            lowerQuestion.includes('inventário') ||
                            lowerQuestion.includes('inventario') ||
                            lowerQuestion.includes('giro') ||
                            lowerQuestion.includes('cobertura')
  
  const isRouteQuestion = lowerQuestion.includes('rota') ||
                          lowerQuestion.includes('rotas') ||
                          lowerQuestion.includes('custo por rota') ||
                          lowerQuestion.includes('custo por entrega') ||
                          lowerQuestion.includes('eficiência') ||
                          lowerQuestion.includes('eficiencia') ||
                          lowerQuestion.includes('viável') ||
                          lowerQuestion.includes('viavel') ||
                          context?.intention === 'analyze_logistics_cost'
  
  const isEquilibriumQuestion = lowerQuestion.includes('ponto de equilíbrio') ||
                                lowerQuestion.includes('ponto de equilibrio') ||
                                lowerQuestion.includes('equilíbrio') ||
                                lowerQuestion.includes('equilibrio') ||
                                lowerQuestion.includes('break even')

  // Analisa custo por rota (prioridade se for pergunta sobre rotas)
  if (isRouteQuestion) {
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
    
    // Análise de performance de veículos (opcional)
    if (context?.intention === 'analyze_logistics_cost') {
      const vehicleData = await DataAdapter.get_vehicle_performance('dezembro')
      evidence.push({
        metric: 'Eficiência Média da Frota',
        value: `${(vehicleData.summary.averageEfficiency * 100).toFixed(2)} entregas/km`,
        comparison: `Melhor veículo: ${vehicleData.summary.bestVehicle.name}`,
        source: 'get_vehicle_performance'
      })
    }
  } else if (isEstoqueQuestion) {
    // Analisa KPIs de estoque
    const kpis = await DataAdapter.get_kpis_overview('dezembro', 'estoque')
    
    // Analisa acurácia
    const acuraciaKPI = kpis.kpis.find(k => k.id === 'acuracia')
    if (acuraciaKPI) {
      if (acuraciaKPI.value < 98) {
        findings.push(`Acurácia de estoque de ${acuraciaKPI.value}% abaixo da meta de 98%`)
        evidence.push({
          metric: 'Acurácia de Estoque',
          value: `${acuraciaKPI.value}%`,
          comparison: 'Meta: 98%',
          source: 'get_kpis_overview'
        })
        recommendations.push('Realizar inventário físico e ajustar divergências')
      } else {
        findings.push(`Acurácia de estoque excelente: ${acuraciaKPI.value}%`)
        evidence.push({
          metric: 'Acurácia de Estoque',
          value: `${acuraciaKPI.value}%`,
          comparison: 'Meta: 98%',
          source: 'get_kpis_overview'
        })
      }
    }

    // Analisa giro de estoque
    const giroKPI = kpis.kpis.find(k => k.id === 'giro_estoque')
    if (giroKPI && giroKPI.value > 15) {
      findings.push(`Giro de estoque de ${giroKPI.value} dias acima do ideal`)
      evidence.push({
        metric: 'Giro de Estoque',
        value: `${giroKPI.value} dias`,
        comparison: 'Ideal: <15 dias',
        source: 'get_kpis_overview'
      })
      recommendations.push('Otimizar giro de estoque')
    }

    // Analisa avarias
    const avariasKPI = kpis.kpis.find(k => k.id === 'avarias')
    if (avariasKPI && avariasKPI.value > 1) {
      findings.push(`Avarias de ${avariasKPI.value}% acima do aceitável`)
      recommendations.push('Revisar processos de manuseio e armazenamento')
    }
  }

  // Analisa OTIF (se for pergunta sobre logística, mas não sobre rotas)
  if ((lowerQuestion.includes('otif') || lowerQuestion.includes('entrega') || lowerQuestion.includes('logística')) && !isRouteQuestion) {
    const otifData = await DataAdapter.get_otif('dezembro')
    if (otifData.otif < 95) {
      findings.push(`OTIF de ${otifData.otif}% abaixo da meta de 95%`)
      evidence.push({
        metric: 'OTIF',
        value: `${otifData.otif}%`,
        comparison: 'Meta: 95%',
        source: 'get_otif'
      })
      
      if (otifData.onTime < 95) {
        recommendations.push('Melhorar planejamento de rotas')
      }
      if (otifData.inFull < 98) {
        recommendations.push('Revisar processos de picking e separação')
      }
    }
  }

  // Analisa cobertura de estoque
  if (context?.product) {
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

  const lowerQuestion = question.toLowerCase()
  const isCustomersByRangeQuestion = lowerQuestion.includes('clientes por faixa') ||
                                     lowerQuestion.includes('clientes por') ||
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

  // KPIs comerciais - usa unit do contexto se disponível
  const unit = (context?.unit as string | undefined) || 'comercial'
  const kpis = await DataAdapter.get_kpis_overview('dezembro', unit)
  const churnKPI = kpis.kpis.find(k => k.id === 'churn')
  if (churnKPI && churnKPI.value > 3) {
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

