// ==========================================
// LABELS DE KPIs POR ÁREA
// ==========================================
// Mapeamento de IDs de KPIs para labels amigáveis

export const KPI_LABELS: Record<string, Record<string, string>> = {
  compras: {
    'custo_mp': 'Custo Total MP',
    'custo_total_mp': 'Custo Total MP',
    'otd': 'OTD Fornecedores',
    'otd_fornecedores': 'OTD Fornecedores',
    'fill_rate': 'Fill Rate',
    'lead_time': 'Lead Time Médio',
    'lead_time_medio': 'Lead Time Médio',
    'cobertura': 'Cobertura Estoque MP',
    'cobertura_estoque_mp': 'Cobertura Estoque MP',
    'nao_conformidades': 'Não Conformidades',
    'performance_comparativo': 'Performance Fornecedores',
    'dependencia_fornecedores': 'Dependência / Volume de Compras por Fornecedor'
  }
}

export function getKPILabel(area: string, kpiId: string): string {
  return KPI_LABELS[area]?.[kpiId] || kpiId
}

