// ==========================================
// DADOS MOCKADOS - BI DC PÃES
// ==========================================

// Tipos
export interface KPI {
  id: string
  label: string
  value: number | string
  unit?: string
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: string
  description?: string
}

export interface ChartData {
  name: string
  value?: number
  [key: string]: string | number | undefined
}

// ==========================================
// HOME - VISÃO GERAL
// ==========================================
export const homeKPIs: KPI[] = [
  { id: 'receita', label: 'Receita Mensal', value: 2847500, unit: 'R$', change: 12.5, trend: 'up', changeLabel: 'vs mês anterior' },
  { id: 'volume', label: 'Volume Produzido (kg)', value: 145820, unit: 'kg', change: 8.3, trend: 'up', changeLabel: 'vs mês anterior', description: 'Total em quilogramas' },
  { id: 'margem', label: 'Margem Bruta', value: 32.4, unit: '%', change: 2.1, trend: 'up', changeLabel: 'vs mês anterior' },
  { id: 'perdas', label: 'Perdas Totais', value: 3.2, unit: '%', change: -0.8, trend: 'up', changeLabel: 'vs mês anterior' },
  { id: 'otif', label: 'OTIF', value: 94.7, unit: '%', change: 1.5, trend: 'up', changeLabel: 'vs mês anterior', description: 'Entregas no prazo e completas' },
  { id: 'giro', label: 'Giro de Estoque', value: 12, unit: 'dias', change: -2, trend: 'up', changeLabel: 'vs mês anterior', description: 'Tempo médio em estoque' },
  { id: 'ebitda', label: 'EBITDA', value: 398250, unit: 'R$', change: 15.2, trend: 'up', changeLabel: 'vs mês anterior', description: 'Lucro antes de juros e impostos' },
  { id: 'clientes', label: 'Clientes Ativos', value: 1247, unit: '', change: 45, trend: 'up', changeLabel: 'novos clientes' },
]

export const receitaMensal: ChartData[] = [
  { name: 'Jan', value: 2150000, meta: 2100000 },
  { name: 'Fev', value: 2280000, meta: 2200000 },
  { name: 'Mar', value: 2450000, meta: 2350000 },
  { name: 'Abr', value: 2380000, meta: 2400000 },
  { name: 'Mai', value: 2520000, meta: 2500000 },
  { name: 'Jun', value: 2610000, meta: 2600000 },
  { name: 'Jul', value: 2490000, meta: 2650000 },
  { name: 'Ago', value: 2720000, meta: 2700000 },
  { name: 'Set', value: 2680000, meta: 2750000 },
  { name: 'Out', value: 2790000, meta: 2800000 },
  { name: 'Nov', value: 2530000, meta: 2850000 },
  { name: 'Dez', value: 2847500, meta: 2900000 },
]

export const perdasPorArea: ChartData[] = [
  { name: 'Produção', value: 1.8, color: '#ed751c' },
  { name: 'Estoque', value: 0.6, color: '#22c55e' },
  { name: 'Logística', value: 0.5, color: '#3b82f6' },
  { name: 'MP Vencida', value: 0.3, color: '#f59e0b' },
]

export const volumePorCategoria: ChartData[] = [
  { name: 'Pão Francês', value: 58420, percent: 40.1 },
  { name: 'Pão de Forma', value: 32150, percent: 22.0 },
  { name: 'Pão Doce', value: 21870, percent: 15.0 },
  { name: 'Bisnaguinha', value: 18320, percent: 12.6 },
  { name: 'Outros', value: 15060, percent: 10.3 },
]

// ==========================================
// COMPRAS - MATÉRIA-PRIMA
// ==========================================
export const comprasKPIs: KPI[] = [
  { id: 'custo_mp', label: 'Custo Total MP', value: 892450, unit: 'R$', change: -3.2, trend: 'up', changeLabel: 'saving', description: 'Matéria-prima no mês' },
  { id: 'otd', label: 'OTD Fornecedores', value: 91.3, unit: '%', change: 2.1, trend: 'up', description: 'Entregas no prazo' },
  { id: 'fill_rate', label: 'Fill Rate', value: 96.8, unit: '%', change: 0.5, trend: 'up', description: '% do pedido atendido' },
  { id: 'lead_time', label: 'Lead Time Médio', value: 3.2, unit: 'dias', change: -0.3, trend: 'up', description: 'Tempo entre pedido e entrega' },
  { id: 'cobertura', label: 'Cobertura Estoque MP', value: 8, unit: 'dias', change: 1, trend: 'neutral', description: 'Dias de estoque disponível' },
  { id: 'nao_conformidades', label: 'Não Conformidades', value: 2.1, unit: '%', change: -0.5, trend: 'up', description: 'Problemas de qualidade' },
]

export const custoMateriasPrimas: ChartData[] = [
  { name: 'Farinha de Trigo', value: 4.85, variacao: 2.3, unidade: 'kg' },
  { name: 'Margarina', value: 12.40, variacao: -1.5, unidade: 'kg' },
  { name: 'Fermento', value: 28.90, variacao: 5.2, unidade: 'kg' },
  { name: 'Açúcar', value: 3.95, variacao: -0.8, unidade: 'kg' },
  { name: 'Sal', value: 1.20, variacao: 0, unidade: 'kg' },
  { name: 'Ovos', value: 0.65, variacao: 8.3, unidade: 'un' },
  { name: 'Leite', value: 5.20, variacao: 3.1, unidade: 'L' },
]

export const performanceFornecedores: ChartData[] = [
  { name: 'Moinho Estrela', otd: 98, fillRate: 99, qualidade: 97, dependencia: 35 },
  { name: 'Distribuidora Sul', otd: 92, fillRate: 95, qualidade: 94, dependencia: 25 },
  { name: 'Laticínios Serrano', otd: 88, fillRate: 92, qualidade: 96, dependencia: 15 },
  { name: 'Açúcar Cristal', otd: 95, fillRate: 98, qualidade: 99, dependencia: 12 },
  { name: 'Outros', otd: 85, fillRate: 90, qualidade: 91, dependencia: 13 },
]

export const evolucaoPrecos: ChartData[] = [
  { name: 'Jan', farinha: 4.50, margarina: 12.80, fermento: 27.50 },
  { name: 'Fev', farinha: 4.55, margarina: 12.70, fermento: 27.80 },
  { name: 'Mar', farinha: 4.60, margarina: 12.60, fermento: 28.00 },
  { name: 'Abr', farinha: 4.65, margarina: 12.55, fermento: 28.20 },
  { name: 'Mai', farinha: 4.70, margarina: 12.50, fermento: 28.40 },
  { name: 'Jun', farinha: 4.72, margarina: 12.45, fermento: 28.50 },
  { name: 'Jul', farinha: 4.75, margarina: 12.42, fermento: 28.60 },
  { name: 'Ago', farinha: 4.78, margarina: 12.40, fermento: 28.70 },
  { name: 'Set', farinha: 4.80, margarina: 12.38, fermento: 28.80 },
  { name: 'Out', farinha: 4.82, margarina: 12.40, fermento: 28.85 },
  { name: 'Nov', farinha: 4.83, margarina: 12.40, fermento: 28.88 },
  { name: 'Dez', farinha: 4.85, margarina: 12.40, fermento: 28.90 },
]

// ==========================================
// PRODUÇÃO
// ==========================================
export const producaoKPIs: KPI[] = [
  { id: 'producao_total', label: 'Produção Total', value: 145820, unit: 'kg', change: 8.3, trend: 'up', description: 'Volume produzido no mês' },
  { id: 'oee', label: 'OEE', value: 78.5, unit: '%', change: 3.2, trend: 'up', description: 'Eficiência global dos equipamentos' },
  { id: 'disponibilidade', label: 'Disponibilidade', value: 92.3, unit: '%', change: 1.5, trend: 'up', description: 'Tempo que a máquina ficou operando' },
  { id: 'performance', label: 'Performance', value: 88.7, unit: '%', change: 2.8, trend: 'up', description: 'Velocidade real vs velocidade ideal' },
  { id: 'qualidade', label: 'Qualidade', value: 95.8, unit: '%', change: 0.5, trend: 'up', description: 'Produtos bons vs total produzido' },
  { id: 'rendimento', label: 'Rendimento Médio', value: 97.2, unit: '%', change: 0.8, trend: 'up', description: 'Aproveitamento da matéria-prima' },
  { id: 'perdas_processo', label: 'Perdas Processo', value: 2650, unit: 'kg', change: -320, trend: 'up', description: 'Refugos e retrabalhos' },
  { id: 'mtbf', label: 'MTBF', value: 48, unit: 'h', change: 6, trend: 'up', description: 'Tempo médio entre falhas' },
]

export const produtividadeTurno: ChartData[] = [
  { name: 'Turno 1 (6h-14h)', valor: 52840, meta: 50000, eficiencia: 105.7 },
  { name: 'Turno 2 (14h-22h)', valor: 48920, meta: 50000, eficiencia: 97.8 },
  { name: 'Turno 3 (22h-6h)', valor: 44060, meta: 45000, eficiencia: 97.9 },
]

export const perdasProducao: ChartData[] = [
  { name: 'Massa mole', value: 35, kg: 927 },
  { name: 'Massa dura', value: 22, kg: 583 },
  { name: 'Queimado', value: 18, kg: 477 },
  { name: 'Formato irregular', value: 15, kg: 398 },
  { name: 'Outros', value: 10, kg: 265 },
]

export const oeeHistorico: ChartData[] = [
  { name: 'Jan', oee: 72.5, disponibilidade: 89.0, performance: 85.2, qualidade: 95.6 },
  { name: 'Fev', oee: 73.8, disponibilidade: 90.1, performance: 85.8, qualidade: 95.5 },
  { name: 'Mar', oee: 74.2, disponibilidade: 90.5, performance: 86.0, qualidade: 95.4 },
  { name: 'Abr', oee: 75.0, disponibilidade: 90.8, performance: 86.5, qualidade: 95.6 },
  { name: 'Mai', oee: 75.8, disponibilidade: 91.0, performance: 87.0, qualidade: 95.7 },
  { name: 'Jun', oee: 76.2, disponibilidade: 91.2, performance: 87.3, qualidade: 95.8 },
  { name: 'Jul', oee: 76.8, disponibilidade: 91.5, performance: 87.6, qualidade: 95.8 },
  { name: 'Ago', oee: 77.2, disponibilidade: 91.8, performance: 87.9, qualidade: 95.7 },
  { name: 'Set', oee: 77.5, disponibilidade: 92.0, performance: 88.2, qualidade: 95.6 },
  { name: 'Out', oee: 77.9, disponibilidade: 92.1, performance: 88.4, qualidade: 95.7 },
  { name: 'Nov', oee: 78.2, disponibilidade: 92.2, performance: 88.5, qualidade: 95.8 },
  { name: 'Dez', oee: 78.5, disponibilidade: 92.3, performance: 88.7, qualidade: 95.8 },
]

export const rendimentoPorLinha: ChartData[] = [
  { name: 'Linha 1 - Francês', rendimento: 97.8, meta: 97.0 },
  { name: 'Linha 2 - Forma', rendimento: 96.5, meta: 97.0 },
  { name: 'Linha 3 - Doces', rendimento: 97.2, meta: 96.5 },
  { name: 'Linha 4 - Especiais', rendimento: 96.8, meta: 96.0 },
]

// ==========================================
// ESTOQUE / ARMAZENAGEM
// ==========================================
export const estoqueKPIs: KPI[] = [
  { id: 'valor_estoque', label: 'Valor em Estoque', value: 485620, unit: 'R$', change: -2.3, trend: 'up', description: 'Capital investido em produtos' },
  { id: 'giro_estoque', label: 'Giro de Estoque', value: 12, unit: 'dias', change: -2, trend: 'up', description: 'Tempo médio para vender o estoque' },
  { id: 'acuracia', label: 'Acurácia', value: 98.5, unit: '%', change: 0.8, trend: 'up', description: 'Precisão do inventário físico vs sistema' },
  { id: 'cobertura', label: 'Cobertura Média', value: 8.5, unit: 'dias', change: 0.5, trend: 'neutral', description: 'Dias de venda garantidos' },
  { id: 'vencidos', label: 'Produtos Vencidos', value: 0.3, unit: '%', change: -0.1, trend: 'up', description: 'Perdas por validade expirada' },
  { id: 'avarias', label: 'Avarias', value: 0.8, unit: '%', change: -0.2, trend: 'up', description: 'Perdas por danos físicos' },
]

export const giroEstoqueCategoria: ChartData[] = [
  { name: 'Pão Francês', giro: 8, cobertura: 8, valor: 125400 },
  { name: 'Pão de Forma', giro: 12, cobertura: 12, valor: 98200 },
  { name: 'Pão Doce', giro: 10, cobertura: 10, valor: 87500 },
  { name: 'Bisnaguinha', giro: 14, cobertura: 14, valor: 65800 },
  { name: 'MP - Farinha', giro: 6, cobertura: 6, valor: 58720 },
  { name: 'MP - Outros', giro: 8, cobertura: 8, valor: 50000 },
]

export const produtosVencimento: ChartData[] = [
  { name: 'Vence em 1 dia', quantidade: 2340, valor: 8190, criticidade: 'alta' },
  { name: 'Vence em 2 dias', quantidade: 4520, valor: 15820, criticidade: 'media' },
  { name: 'Vence em 3 dias', quantidade: 6780, valor: 23730, criticidade: 'baixa' },
  { name: 'Vence em 4-5 dias', quantidade: 12450, valor: 43575, criticidade: 'normal' },
]

export const avariasEstoque: ChartData[] = [
  { name: 'Embalagem rasgada', value: 42, causa: 'Manuseio' },
  { name: 'Produto amassado', value: 28, causa: 'Armazenamento' },
  { name: 'Umidade', value: 18, causa: 'Ambiente' },
  { name: 'Outros', value: 12, causa: 'Diversos' },
]

// ==========================================
// COMERCIAL / VENDAS
// ==========================================
export const comercialKPIs: KPI[] = [
  { id: 'faturamento', label: 'Faturamento', value: 2847500, unit: 'R$', change: 12.5, trend: 'up', description: 'Receita total do período' },
  { id: 'volume_vendas', label: 'Volume Vendas', value: 142350, unit: 'kg', change: 9.2, trend: 'up', description: 'Quantidade vendida em kg' },
  { id: 'ticket_medio', label: 'Ticket Médio', value: 2284, unit: 'R$', change: 3.1, trend: 'up', description: 'Valor médio por pedido' },
  { id: 'margem', label: 'Margem Contribuição', value: 28.7, unit: '%', change: 1.2, trend: 'up', description: 'Lucro após custos variáveis' },
  { id: 'clientes_ativos', label: 'Clientes Ativos', value: 1247, unit: '', change: 45, trend: 'up', description: 'Compraram nos últimos 30 dias' },
  { id: 'churn', label: 'Churn Rate', value: 2.8, unit: '%', change: -0.5, trend: 'up', description: 'Taxa de clientes perdidos' },
  { id: 'novos_clientes', label: 'Novos Clientes', value: 78, unit: '', change: 12, trend: 'up', description: 'Primeira compra no período' },
  { id: 'clientes_recuperados', label: 'Recuperados', value: 23, unit: '', change: 5, trend: 'up', description: 'Voltaram a comprar' },
]

export const vendaPorRegiao: ChartData[] = [
  { name: 'Zona Norte', valor: 854250, percent: 30.0, clientes: 374 },
  { name: 'Zona Sul', valor: 711875, percent: 25.0, clientes: 312 },
  { name: 'Centro', valor: 569500, percent: 20.0, clientes: 250 },
  { name: 'Zona Leste', valor: 427125, percent: 15.0, clientes: 187 },
  { name: 'Zona Oeste', valor: 284750, percent: 10.0, clientes: 124 },
]

export const mixProdutos: ChartData[] = [
  { name: 'Pão Francês', atual: 40.1, ideal: 38.0, margem: 25.5 },
  { name: 'Pão de Forma', atual: 22.0, ideal: 24.0, margem: 32.0 },
  { name: 'Pão Doce', atual: 15.0, ideal: 16.0, margem: 35.8 },
  { name: 'Bisnaguinha', atual: 12.6, ideal: 12.0, margem: 28.5 },
  { name: 'Especiais', atual: 10.3, ideal: 10.0, margem: 42.0 },
]

export const topVendedores: ChartData[] = [
  { name: 'Carlos Silva', valor: 342500, meta: 320000, atingimento: 107.0 },
  { name: 'Maria Santos', valor: 298750, meta: 300000, atingimento: 99.6 },
  { name: 'João Oliveira', valor: 285400, meta: 280000, atingimento: 101.9 },
  { name: 'Ana Costa', valor: 267800, meta: 260000, atingimento: 103.0 },
  { name: 'Pedro Lima', valor: 245320, meta: 250000, atingimento: 98.1 },
]

export const clientesFaixaFaturamento: ChartData[] = [
  { name: 'Acima R$ 10k', quantidade: 87, percent: 7.0, valor: 1423750 },
  { name: 'R$ 5k - R$ 10k', quantidade: 156, percent: 12.5, valor: 702375 },
  { name: 'R$ 2k - R$ 5k', quantidade: 312, percent: 25.0, valor: 427125 },
  { name: 'R$ 1k - R$ 2k', quantidade: 374, percent: 30.0, valor: 213562 },
  { name: 'Abaixo R$ 1k', quantidade: 318, percent: 25.5, valor: 80688 },
]

// ==========================================
// LOGÍSTICA & DISTRIBUIÇÃO
// ==========================================
export const logisticaKPIs: KPI[] = [
  { id: 'otif', label: 'OTIF', value: 94.7, unit: '%', change: 1.5, trend: 'up' },
  { id: 'entrega_prazo', label: 'Entrega no Prazo', value: 96.2, unit: '%', change: 0.8, trend: 'up' },
  { id: 'pedidos_completos', label: 'Pedidos Completos', value: 98.3, unit: '%', change: 0.5, trend: 'up' },
  { id: 'custo_entrega', label: 'Custo por Entrega', value: 18.50, unit: 'R$', change: -1.2, trend: 'up' },
  { id: 'custo_km', label: 'Custo por Km', value: 2.85, unit: 'R$', change: -0.15, trend: 'up' },
  { id: 'avarias_logistica', label: 'Avarias Logística', value: 0.5, unit: '%', change: -0.1, trend: 'up' },
  { id: 'devolucoes', label: 'Devoluções', value: 1.2, unit: '%', change: -0.3, trend: 'up' },
  { id: 'reentregas', label: 'Reentregas', value: 2.1, unit: '%', change: -0.4, trend: 'up' },
]

export const otifHistorico: ChartData[] = [
  { name: 'Jan', otif: 91.2, prazo: 93.5, completo: 97.5 },
  { name: 'Fev', otif: 91.8, prazo: 94.0, completo: 97.6 },
  { name: 'Mar', otif: 92.3, prazo: 94.2, completo: 97.8 },
  { name: 'Abr', otif: 92.8, prazo: 94.5, completo: 98.0 },
  { name: 'Mai', otif: 93.2, prazo: 95.0, completo: 98.0 },
  { name: 'Jun', otif: 93.5, prazo: 95.2, completo: 98.1 },
  { name: 'Jul', otif: 93.8, prazo: 95.5, completo: 98.1 },
  { name: 'Ago', otif: 94.0, prazo: 95.7, completo: 98.2 },
  { name: 'Set', otif: 94.2, prazo: 95.8, completo: 98.2 },
  { name: 'Out', otif: 94.4, prazo: 96.0, completo: 98.2 },
  { name: 'Nov', otif: 94.5, prazo: 96.1, completo: 98.3 },
  { name: 'Dez', otif: 94.7, prazo: 96.2, completo: 98.3 },
]

export const custoLogisticoPorRota: ChartData[] = [
  { name: 'Rota 1 - Centro', custo: 892, entregas: 48, custoEntrega: 18.58, km: 320 },
  { name: 'Rota 2 - Norte', custo: 1245, entregas: 62, custoEntrega: 20.08, km: 450 },
  { name: 'Rota 3 - Sul', custo: 1128, entregas: 58, custoEntrega: 19.45, km: 410 },
  { name: 'Rota 4 - Leste', custo: 987, entregas: 52, custoEntrega: 18.98, km: 360 },
  { name: 'Rota 5 - Oeste', custo: 856, entregas: 45, custoEntrega: 19.02, km: 310 },
]

export const motivosDevolucao: ChartData[] = [
  { name: 'Produto danificado', value: 32, percent: 32 },
  { name: 'Cliente ausente', value: 28, percent: 28 },
  { name: 'Pedido errado', value: 18, percent: 18 },
  { name: 'Atraso na entrega', value: 12, percent: 12 },
  { name: 'Outros', value: 10, percent: 10 },
]

export const performanceVeiculos: ChartData[] = [
  { name: 'Veículo 01', entregas: 892, capacidade: 92.5, custo: 4250, km: 8420 },
  { name: 'Veículo 02', entregas: 876, capacidade: 90.8, custo: 4180, km: 8150 },
  { name: 'Veículo 03', entregas: 854, capacidade: 88.5, custo: 4320, km: 8680 },
  { name: 'Veículo 04', entregas: 842, capacidade: 91.2, custo: 4050, km: 7920 },
  { name: 'Veículo 05', entregas: 828, capacidade: 87.5, custo: 4480, km: 8950 },
]

// ==========================================
// FINANCEIRO / CONTROLADORIA
// ==========================================
export const financeiroKPIs: KPI[] = [
  { id: 'receita_liquida', label: 'Receita Líquida', value: 2562750, unit: 'R$', change: 11.8, trend: 'up' },
  { id: 'margem_bruta', label: 'Margem Bruta', value: 32.4, unit: '%', change: 2.1, trend: 'up' },
  { id: 'margem_liquida', label: 'Margem Líquida', value: 12.8, unit: '%', change: 1.5, trend: 'up' },
  { id: 'ebitda', label: 'EBITDA', value: 398250, unit: 'R$', change: 15.2, trend: 'up' },
  { id: 'inadimplencia', label: 'Inadimplência', value: 3.2, unit: '%', change: -0.5, trend: 'up' },
  { id: 'pmr', label: 'PMR', value: 28, unit: 'dias', change: -2, trend: 'up' },
  { id: 'pmp', label: 'PMP', value: 35, unit: 'dias', change: 3, trend: 'up' },
  { id: 'ciclo_financeiro', label: 'Ciclo Financeiro', value: 5, unit: 'dias', change: -3, trend: 'up' },
]

export const fluxoCaixa: ChartData[] = [
  { name: 'Jan', entradas: 2150000, saidas: 1892000, saldo: 258000 },
  { name: 'Fev', entradas: 2280000, saidas: 1985000, saldo: 295000 },
  { name: 'Mar', entradas: 2450000, saidas: 2120000, saldo: 330000 },
  { name: 'Abr', entradas: 2380000, saidas: 2085000, saldo: 295000 },
  { name: 'Mai', entradas: 2520000, saidas: 2180000, saldo: 340000 },
  { name: 'Jun', entradas: 2610000, saidas: 2250000, saldo: 360000 },
  { name: 'Jul', entradas: 2490000, saidas: 2175000, saldo: 315000 },
  { name: 'Ago', entradas: 2720000, saidas: 2340000, saldo: 380000 },
  { name: 'Set', entradas: 2680000, saidas: 2315000, saldo: 365000 },
  { name: 'Out', entradas: 2790000, saidas: 2395000, saldo: 395000 },
  { name: 'Nov', entradas: 2530000, saidas: 2205000, saldo: 325000 },
  { name: 'Dez', entradas: 2847500, saidas: 2449250, saldo: 398250 },
]

export const despesasPorCentroCusto: ChartData[] = [
  { name: 'Matéria-Prima', valor: 892450, percent: 36.4 },
  { name: 'Mão de Obra', valor: 542800, percent: 22.2 },
  { name: 'Logística', valor: 285400, percent: 11.6 },
  { name: 'Energia/Utilidades', valor: 178500, percent: 7.3 },
  { name: 'Manutenção', valor: 125600, percent: 5.1 },
  { name: 'Comercial/Marketing', valor: 142375, percent: 5.8 },
  { name: 'Administrativo', valor: 185200, percent: 7.6 },
  { name: 'Outros', valor: 96925, percent: 4.0 },
]

export const dreResumo: ChartData[] = [
  { name: 'Receita Bruta', valor: 2847500, percent: 100 },
  { name: '(-) Impostos', valor: -284750, percent: -10.0 },
  { name: 'Receita Líquida', valor: 2562750, percent: 90.0 },
  { name: '(-) CPV', valor: -1730658, percent: -60.8 },
  { name: 'Lucro Bruto', valor: 832092, percent: 29.2 },
  { name: '(-) Despesas Op.', valor: -433842, percent: -15.2 },
  { name: 'EBITDA', valor: 398250, percent: 14.0 },
  { name: '(-) Deprec./Amort.', valor: -35000, percent: -1.2 },
  { name: 'Lucro Operacional', valor: 363250, percent: 12.8 },
]

export const contasReceberVencer: ChartData[] = [
  { name: 'Vencido > 30 dias', valor: 45250, percent: 5.2, clientes: 28 },
  { name: 'Vencido 15-30 dias', valor: 38420, percent: 4.4, clientes: 35 },
  { name: 'Vencido 1-15 dias', valor: 52180, percent: 6.0, clientes: 48 },
  { name: 'A vencer 1-7 dias', valor: 285400, percent: 32.8, clientes: 245 },
  { name: 'A vencer 8-15 dias', valor: 248500, percent: 28.5, clientes: 312 },
  { name: 'A vencer 16-30 dias', valor: 201250, percent: 23.1, clientes: 287 },
]

// ==========================================
// UTILITÁRIOS
// ==========================================
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

