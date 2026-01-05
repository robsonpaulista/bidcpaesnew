// ==========================================
// METAS POR KPI
// ==========================================
// Metas padrão para comparação nos KPIs

export const KPI_METAS: Record<string, number> = {
  'otd': 95, // OTD meta: 95%
  'otd_fornecedores': 95,
  'fill_rate': 98,
  'lead_time': 3, // dias (quanto menor melhor)
  'lead_time_medio': 3,
  'nao_conformidades': 2, // % (quanto menor melhor)
  'cobertura': 10, // dias
  'cobertura_estoque_mp': 10,
  'custo_mp': 0, // Não tem meta fixa (depende do budget)
  'custo_total_mp': 0
}

export function getKPIMeta(kpiId: string): number | null {
  return KPI_METAS[kpiId] ?? null
}


