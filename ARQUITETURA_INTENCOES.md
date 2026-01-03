# 🎯 Arquitetura Baseada em Intenções de Negócio

## Princípios Fundamentais

### ❌ Você NÃO deve:
- **Confiar só em termos-chave** - Detecção frágil e imprecisa
- **Deixar o agente decidir livremente** - Sem governança e previsibilidade
- **"Treinar" como chatbot genérico** - Sem estrutura de negócio

### ✅ Você DEVE:
- **Definir intenções de negócio** - Cada intenção tem propósito claro
- **Usar LLM para mapear perguntas → intenções** - Inteligência semântica
- **Usar planos pré-definidos por intenção** - Estrutura e previsibilidade
- **Permitir interpretação dentro de limites** - Governança e controle

## Arquitetura Implementada

### 1. Intenções de Negócio (`intentions.ts`)

Cada intenção é uma **unidade de negócio** bem definida:

```typescript
analyze_revenue_trend: {
  name: 'Analisar Tendência de Receita',
  agents: ['comercial'],
  requiredFunctions: ['get_revenue_monthly', 'get_kpis_overview'],
  expectedOutput: { findings: true, evidence: true, recommendations: true }
}
```

**Intenções Disponíveis:**
- `analyze_revenue_trend` - Análise de faturamento/receita
- `analyze_margin_decline` - Investigação de queda de margem
- `analyze_losses` - Identificação de perdas
- `analyze_supplier_performance` - Performance de fornecedores
- `analyze_production_efficiency` - Eficiência de produção (OEE)
- `analyze_stock_accuracy` - Acurácia de estoque
- `analyze_delivery_performance` - Performance de entrega (OTIF)
- `analyze_sales_mix` - Mix de vendas
- `analyze_financial_health` - Saúde financeira
- `compare_periods` - Comparação entre períodos
- `identify_root_cause` - Causa raiz (múltiplos agentes)
- `suggest_improvements` - Sugestões de melhorias
- `general_overview` - Visão geral

### 2. Mapeamento Pergunta → Intenção

**Atual:** Sistema híbrido (keywords + contexto)
- Conta matches de keywords
- Bonus por contexto da página
- Retorna intenção com maior score

**Futuro:** LLM para mapeamento semântico
```typescript
// Exemplo futuro com LLM
const intention = await llm.mapToIntention(question, availableIntentions)
```

### 3. Planos Pré-definidos

Cada intenção tem um **plano de investigação** estruturado:

```typescript
getInvestigationPlan('analyze_revenue_trend', question, context)
// Retorna:
[
  { step: 1, agent: 'comercial', function: 'get_kpis_overview', ... },
  { step: 2, agent: 'comercial', function: 'get_revenue_monthly', ... }
]
```

**Características:**
- Funções **requeridas** sempre executadas
- Funções **opcionais** apenas se contexto indicar
- Dependências entre passos
- Parâmetros pré-definidos

### 4. Execução Controlada

**Agentes NÃO decidem livremente:**
- Recebem a intenção de negócio
- Seguem o plano pré-definido
- Executam funções específicas
- Retornam evidências estruturadas

### 5. Consolidação Inteligente

A consolidação respeita a **estrutura esperada** da intenção:

```typescript
if (intentionDef.id === 'analyze_revenue_trend') {
  // Resumo específico para receita
  return `Análise do faturamento mensal: ${revenueEvidence}...`
}
```

## Fluxo Completo

```
1. Usuário pergunta: "qual a oscilação do faturamento?"
   ↓
2. mapQuestionToIntention() → 'analyze_revenue_trend'
   ↓
3. getInvestigationPlan() → [get_kpis_overview, get_revenue_monthly]
   ↓
4. Executa plano (agentes seguem, não decidem)
   ↓
5. Consolida respeitando estrutura da intenção
   ↓
6. Retorna resposta estruturada e auditável
```

## Vantagens

✅ **Previsibilidade** - Sempre sabe o que vai acontecer  
✅ **Governança** - Limites claros e auditáveis  
✅ **Manutenibilidade** - Fácil adicionar novas intenções  
✅ **Escalabilidade** - Pode usar LLM sem quebrar estrutura  
✅ **Confiabilidade** - Não é "curiosidade", é infraestrutura

## Próximos Passos

1. **Integrar LLM real** para mapeamento semântico
2. **Expandir intenções** conforme necessidades de negócio
3. **Adicionar validações** de limites por intenção
4. **Criar testes** por intenção (não por agente)

## Mapa: Intenção → Agentes → Funções

| Intenção | Agentes | Funções Requeridas |
|----------|---------|-------------------|
| `analyze_revenue_trend` | comercial | get_revenue_monthly, get_kpis_overview |
| `analyze_margin_decline` | custos_margem, comercial | get_margin_by_product, get_cost_breakdown |
| `analyze_losses` | producao, estoque_logistica | get_losses_by_line, get_kpis_overview |
| `analyze_stock_accuracy` | estoque_logistica | get_kpis_overview, get_stock_coverage (opcional) |
| `analyze_production_efficiency` | producao | get_oee, get_kpis_overview |

---

**Esta arquitetura transforma IA em infraestrutura confiável, não em curiosidade.**




