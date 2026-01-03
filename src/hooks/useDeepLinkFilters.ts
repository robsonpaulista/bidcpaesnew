// ==========================================
// HOOK PARA APLICAR FILTROS DE DEEP LINKS
// ==========================================
// Lê query parameters da URL e aplica filtros automaticamente

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface DeepLinkFilters {
  focusKpi?: string
  period?: string
  produto?: string
  line?: string
  fornecedor?: string
  [key: string]: string | undefined
}

export function useDeepLinkFilters() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<DeepLinkFilters>({})

  useEffect(() => {
    const newFilters: DeepLinkFilters = {}
    
    // Lê todos os query parameters relevantes
    const focusKpi = searchParams.get('focus')
    const period = searchParams.get('period')
    const produto = searchParams.get('produto')
    const line = searchParams.get('line')
    const fornecedor = searchParams.get('fornecedor')
    
    if (focusKpi) newFilters.focusKpi = focusKpi
    if (period) newFilters.period = period
    if (produto) newFilters.produto = produto
    if (line) newFilters.line = line
    if (fornecedor) newFilters.fornecedor = fornecedor
    
    setFilters(newFilters)
  }, [searchParams])

  return filters
}

// ==========================================
// HOOK PARA DESTACAR KPI ESPECÍFICO
// ==========================================

export function useHighlightKPI(focusKpi?: string) {
  const [highlightedKpi, setHighlightedKpi] = useState<string | undefined>(focusKpi)

  useEffect(() => {
    if (focusKpi) {
      setHighlightedKpi(focusKpi)
      
      // Scroll para o KPI destacado após um pequeno delay
      setTimeout(() => {
        const element = document.getElementById(`kpi-${focusKpi}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Adiciona classe de destaque temporária
          element.classList.add('ring-2', 'ring-primary-500', 'ring-offset-2')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary-500', 'ring-offset-2')
          }, 3000)
        }
      }, 100)
    }
  }, [focusKpi])

  return highlightedKpi
}

