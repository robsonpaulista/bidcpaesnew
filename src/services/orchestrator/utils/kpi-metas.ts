// ==========================================
// METAS POR KPI
// ==========================================
// Metas padrão para comparação nos KPIs

export const KPI_METAS: Record<string, number> = {
  // Compras
  'otd': 95, // OTD meta: 95%
  'otd_fornecedores': 95,
  'fill_rate': 98,
  'lead_time': 3, // dias (quanto menor melhor)
  'lead_time_medio': 3,
  'nao_conformidades': 2, // % (quanto menor melhor)
  'cobertura': 10, // dias
  'cobertura_estoque_mp': 10,
  'custo_mp': 0, // Não tem meta fixa (depende do budget)
  'custo_total_mp': 0,
  // Produção
  'oee': 80, // OEE meta: 80%
  'disponibilidade': 90, // Disponibilidade meta: 90%
  'performance': 85, // Performance meta: 85%
  'qualidade': 95, // Qualidade meta: 95%
  'rendimento': 97, // Rendimento meta: 97%
  'perdas_processo': 2, // Perdas meta: <2% (quanto menor melhor)
  'producao_total': 0, // Não tem meta fixa
  'mtbf': 48 // MTBF meta: 48h
}

export function getKPIMeta(area: string, kpiId: string): number | null {
  // Tenta primeiro com área específica, depois genérico
  const areaSpecificKey = `${area}_${kpiId}`
  if (KPI_METAS[areaSpecificKey] !== undefined) {
    return KPI_METAS[areaSpecificKey]
  }
  return KPI_METAS[kpiId] ?? null
}


