// ==========================================
// MAPEADOR DE PERGUNTAS PARA KPIs
// ==========================================
// Mapeia perguntas simples para IDs de KPIs específicos

export interface KPIMapping {
  keywords: string[]
  kpiId: string
  kpiLabel: string
}

// Mapeamento por área
export const KPI_MAPPINGS: Record<string, KPIMapping[]> = {
  compras: [
    { keywords: ['lead time', 'tempo médio de entrega', 'tempo de entrega', 'tempo entre pedido e entrega', 'tempo médio entrega'], kpiId: 'lead_time', kpiLabel: 'Lead Time Médio' },
    { keywords: ['otd', 'on time delivery', 'percentual de entregas no prazo'], kpiId: 'otd', kpiLabel: 'OTD Fornecedores' },
    { keywords: ['fill rate', 'taxa de atendimento', 'atendimento'], kpiId: 'fill_rate', kpiLabel: 'Fill Rate' },
    { keywords: ['custo mp', 'custo matéria-prima', 'custo materia-prima', 'custo de matéria-prima', 'custo total mp'], kpiId: 'custo_mp', kpiLabel: 'Custo Total MP' },
    { keywords: ['cobertura', 'cobertura estoque', 'cobertura estoque mp', 'cobertura estoque matéria-prima', 'dias de estoque'], kpiId: 'cobertura', kpiLabel: 'Cobertura Estoque MP' },
    { keywords: ['não conformidade', 'nao conformidade', 'não conformidades', 'nao conformidades', 'problemas de qualidade'], kpiId: 'nao_conformidades', kpiLabel: 'Não Conformidades' },
    { keywords: ['performance fornecedores comparativo', 'performance fornecedores comparativo por indicador', 'comparativo fornecedores', 'fornecedores comparativo'], kpiId: 'performance_comparativo', kpiLabel: 'Performance Fornecedores Comparativo' },
    { keywords: ['performance', 'fornecedor', 'fornecedores'], kpiId: 'performance', kpiLabel: 'Performance de Fornecedores' },
  ],
  comercial: [
    { keywords: ['faturamento', 'receita', 'vendas'], kpiId: 'faturamento', kpiLabel: 'Faturamento' },
    { keywords: ['volume', 'volume vendas', 'quantidade'], kpiId: 'volume_vendas', kpiLabel: 'Volume Vendas' },
    { keywords: ['ticket médio', 'ticket medio', 'valor médio', 'valor medio'], kpiId: 'ticket_medio', kpiLabel: 'Ticket Médio' },
    { keywords: ['margem', 'margem contribuição', 'margem contribuicao'], kpiId: 'margem', kpiLabel: 'Margem Contribuição' },
    { keywords: ['clientes ativos', 'clientes'], kpiId: 'clientes_ativos', kpiLabel: 'Clientes Ativos' },
    { keywords: ['churn', 'churn rate', 'perda cliente'], kpiId: 'churn', kpiLabel: 'Churn Rate' },
    { keywords: ['novos clientes', 'novo cliente'], kpiId: 'novos_clientes', kpiLabel: 'Novos Clientes' },
    { keywords: ['clientes recuperados', 'recuperados'], kpiId: 'clientes_recuperados', kpiLabel: 'Recuperados' },
    { keywords: ['clientes por faixa', 'faixa faturamento', 'distribuição clientes', 'distribuicao clientes'], kpiId: 'clientes_faixa', kpiLabel: 'Clientes por Faixa de Faturamento' },
  ],
  producao: [
    { keywords: ['produção total', 'producao total', 'volume produzido'], kpiId: 'producao_total', kpiLabel: 'Produção Total' },
    { keywords: ['oee', 'eficiência', 'eficiencia'], kpiId: 'oee', kpiLabel: 'OEE' },
    { keywords: ['disponibilidade'], kpiId: 'disponibilidade', kpiLabel: 'Disponibilidade' },
    { keywords: ['performance'], kpiId: 'performance', kpiLabel: 'Performance' },
    { keywords: ['qualidade'], kpiId: 'qualidade', kpiLabel: 'Qualidade' },
    { keywords: ['rendimento', 'rendimento médio', 'rendimento medio'], kpiId: 'rendimento', kpiLabel: 'Rendimento Médio' },
    { keywords: ['perdas', 'perdas processo'], kpiId: 'perdas_processo', kpiLabel: 'Perdas Processo' },
    { keywords: ['mtbf', 'tempo médio falhas', 'tempo medio falhas'], kpiId: 'mtbf', kpiLabel: 'MTBF' },
  ],
  estoque: [
    { keywords: ['valor estoque', 'estoque'], kpiId: 'valor_estoque', kpiLabel: 'Valor em Estoque' },
    { keywords: ['giro estoque', 'giro'], kpiId: 'giro_estoque', kpiLabel: 'Giro de Estoque' },
    { keywords: ['acurácia', 'acuracia', 'precisão', 'precisao'], kpiId: 'acuracia', kpiLabel: 'Acurácia' },
    { keywords: ['cobertura', 'cobertura média', 'cobertura media'], kpiId: 'cobertura', kpiLabel: 'Cobertura Média' },
    { keywords: ['vencidos', 'vencimento'], kpiId: 'vencidos', kpiLabel: 'Produtos Vencidos' },
    { keywords: ['avarias'], kpiId: 'avarias', kpiLabel: 'Avarias' },
  ],
  logistica: [
    { keywords: ['otif'], kpiId: 'otif', kpiLabel: 'OTIF' },
    { keywords: ['entrega prazo', 'prazo entrega', 'entrega no prazo'], kpiId: 'entrega_prazo', kpiLabel: 'Entrega no Prazo' },
    { keywords: ['pedidos completos', 'pedido completo'], kpiId: 'pedidos_completos', kpiLabel: 'Pedidos Completos' },
    { keywords: ['custo entrega', 'custo por entrega'], kpiId: 'custo_entrega', kpiLabel: 'Custo por Entrega' },
    { keywords: ['custo km', 'custo por km'], kpiId: 'custo_km', kpiLabel: 'Custo por Km' },
    { keywords: ['avarias logística', 'avarias logistica'], kpiId: 'avarias_logistica', kpiLabel: 'Avarias Logística' },
    { keywords: ['devoluções', 'devolucoes'], kpiId: 'devolucoes', kpiLabel: 'Devoluções' },
    { keywords: ['reentregas'], kpiId: 'reentregas', kpiLabel: 'Reentregas' },
    { keywords: ['custo rota', 'custo por rota', 'rotas', 'rota'], kpiId: 'rotas', kpiLabel: 'Custo por Rota' },
    { keywords: ['veículo', 'veículos', 'veiculos', 'performance veículo', 'performance veículos', 'eficiência veículo', 'eficiencia veiculo'], kpiId: 'veiculos', kpiLabel: 'Performance de Veículos' },
  ],
  financeiro: [
    { keywords: ['receita líquida', 'receita liquida'], kpiId: 'receita_liquida', kpiLabel: 'Receita Líquida' },
    { keywords: ['margem bruta'], kpiId: 'margem_bruta', kpiLabel: 'Margem Bruta' },
    { keywords: ['margem líquida', 'margem liquida'], kpiId: 'margem_liquida', kpiLabel: 'Margem Líquida' },
    { keywords: ['ebitda'], kpiId: 'ebitda', kpiLabel: 'EBITDA' },
    { keywords: ['inadimplência', 'inadimplencia'], kpiId: 'inadimplencia', kpiLabel: 'Inadimplência' },
    { keywords: ['pmr', 'prazo médio recebimento', 'prazo medio recebimento'], kpiId: 'pmr', kpiLabel: 'PMR' },
    { keywords: ['pmp', 'prazo médio pagamento', 'prazo medio pagamento'], kpiId: 'pmp', kpiLabel: 'PMP' },
    { keywords: ['ciclo financeiro'], kpiId: 'ciclo_financeiro', kpiLabel: 'Ciclo Financeiro' },
  ],
}

/**
 * Mapeia uma pergunta para um KPI específico
 */
export function mapQuestionToKPI(question: string, area: string): { kpiId: string; kpiLabel: string } | null {
  const lowerQuestion = question.toLowerCase()
  const mappings = KPI_MAPPINGS[area] || []
  
  for (const mapping of mappings) {
    for (const keyword of mapping.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return { kpiId: mapping.kpiId, kpiLabel: mapping.kpiLabel }
      }
    }
  }
  
  return null
}

/**
 * Encontra múltiplos KPIs relacionados à pergunta
 */
export function mapQuestionToKPIs(question: string, area: string): Array<{ kpiId: string; kpiLabel: string }> {
  const lowerQuestion = question.toLowerCase()
  const mappings = KPI_MAPPINGS[area] || []
  const found: Array<{ kpiId: string; kpiLabel: string }> = []
  
  for (const mapping of mappings) {
    for (const keyword of mapping.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        // Evita duplicatas
        if (!found.find(f => f.kpiId === mapping.kpiId)) {
          found.push({ kpiId: mapping.kpiId, kpiLabel: mapping.kpiLabel })
        }
      }
    }
  }
  
  return found
}

