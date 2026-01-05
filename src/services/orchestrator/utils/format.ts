// ==========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ==========================================

/**
 * Formata valores monetários em BRL (R$)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value
  if (isNaN(numValue)) return String(value)
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue)
}

/**
 * Formata números com separadores
 */
export function formatNumber(value: number | string, decimals = 0): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : value
  if (isNaN(numValue)) return String(value)
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue)
}

/**
 * Formata valores com unidade (ex: R$ 0,65 por un.)
 */
export function formatValueWithUnit(value: number | string, unit: string, isCurrency = false): string {
  const formattedValue = isCurrency ? formatCurrency(value) : formatNumber(value, unit === '%' ? 1 : 2)
  
  if (!unit || unit === 'R$') return formattedValue
  
  // Formata unidade de forma mais legível
  const unitMap: Record<string, string> = {
    'un': 'un.',
    'kg': 'kg',
    'unidade': 'un.',
    'dias': 'dias',
    '%': '%'
  }
  
  const formattedUnit = unitMap[unit.toLowerCase()] || unit
  
  // Se for moeda com unidade (ex: R$ 0,65/un)
  if (isCurrency && formattedUnit !== '%') {
    return `${formattedValue} por ${formattedUnit}`
  }
  
  // Caso padrão (ex: 0,65 un. ou 0,65%)
  return `${formattedValue} ${formattedUnit}`
}


