# 📋 Documentação: Funcionalidades da Página de Compras

## 🎯 Visão Geral

Este documento descreve todas as funcionalidades implementadas para o agente de **Compras & Fornecedores**, que devem ser replicadas para as demais páginas do sistema.

---

## 🔍 1. DETECÇÕES ESPECIAIS (Ordem de Prioridade)

### 1.1. Preço Específico de Insumo (PASSO 0.1)
**Quando detecta**: Perguntas sobre preço de um insumo específico (ex: "qual o preço de compra do Fermento?")

**Lógica**:
- Função: `isSpecificInputPriceQuestion()` em `kpi-scorer.ts`
- Detecta palavras-chave: "preço", "preco", "qual o preço", "quanto custa", "valor"
- **IMPORTANTE**: Retorna `false` se menciona evolução/período/tendência (deve usar série temporal)
- Busca na `tabelaPrecos` do `pageContext`
- Retorna preço atual + variação vs período anterior

**Exemplo de pergunta**: "qual o preço de compra do Leite?"

---

### 1.2. Evolução de Preços (PASSO 0.2)
**Quando detecta**: Perguntas sobre evolução de preços em um período (ex: "evolução de jan a ago do preço da Farinha")

**Lógica**:
- Detecta palavras-chave de evolução: "evolução", "tendência", "período", "histórico", "série", "gráfico", "me mostre"
- Detecta meses mencionados (isolados, não parte de outras palavras)
- Detecta conectores de período: "a", "até"
- Detecta "preço"/"preços" (com regex `/pre.*?os/i` para capturar variações de encoding)
- Detecta insumo específico: farinha, margarina, fermento, etc.
- Busca em `seriePrecos` (evolucaoPrecos) do `pageContext`
- Extrai período (ex: "jan a ago" → Jan, Fev, Mar, ..., Ago)
- Calcula estatísticas: inicial, final, variação, média, min, max
- Adiciona TODAS as evidências mês a mês do período

**Exemplo de pergunta**: "me mostre os preços de compra do fermento de fevereiro a maio"

---

### 1.3. Pior Insumo (PASSO 0.3)
**Quando detecta**: Perguntas sobre "pior insumo", "vilão do mês", "mais caro pra comprar"

**Lógica**:
- Função: `isWorstInputQuestion()` em `kpi-scorer.ts`
- Palavras-chave: "pior", "vilão", "vilao", "mais caro pra comprar"
- Busca na `tabelaPrecos` do `pageContext`
- Filtra "Outros" e pega top 1 por maior aumento de preço
- Retorna insumo com maior variação positiva

**Exemplo de pergunta**: "qual o vilão do mês nas compras?"

---

### 1.4. Dependência de Fornecedores
**Quando detecta**: Perguntas sobre "de quais fornecedores compramos mais?", "dependência", "volume de compras"

**Lógica**:
- KPI: `dependencia_fornecedores` em `kpi-scorer.ts`
- Palavras-chave: "dependência", "dependencia", "volume de compras", "compramos mais", "maior fornecedor"
- Busca em `rankingFornecedores` do `pageContext`
- Ordena por `dependencia` (maior primeiro)
- Retorna top 3 fornecedores com maior dependência
- Adiciona recomendação se dependência total > 70%

**Exemplo de pergunta**: "de quais fornecedores compramos mais?"

---

## 📊 2. KPIs SUPORTADOS

### 2.1. Catálogo de KPIs
- `custo_total_mp`: Custo Total MP
- `otd_fornecedores`: OTD Fornecedores
- `fill_rate`: Fill Rate
- `lead_time_medio`: Lead Time Médio
- `cobertura_estoque_mp`: Cobertura Estoque MP
- `nao_conformidades`: Não Conformidades
- `dependencia_fornecedores`: Dependência / Volume de Compras por Fornecedor

### 2.2. Sistema de Scoring
- Arquivo: `kpi-scorer.ts`
- Função: `scoreKPIs()` - calcula scores baseado em keywords
- Função: `selectMainKPIFromScores()` - seleciona KPI principal ou identifica ambiguidade
- Pesos: exact (5), primary (3), secondary (2), context (1)

---

## 🔄 3. RECUPERAÇÃO DE CONTEXTO

### 3.1. Follow-up Questions
**Quando detecta**: Perguntas curtas como "e da margarina?", "e do leite?"

**Lógica**:
- Arquivo: `context-recovery.ts`
- Função: `isFollowUpQuestion()` - detecta padrões como "e da", "e do", "e o", "e a"
- Função: `extractInputFromFollowUp()` - extrai nome do insumo
- Reconstrói pergunta baseada no padrão da última pergunta não follow-up
- Exemplo: "preço de compra do Fermento" + "e da margarina?" → "preço de compra da margarina"

### 3.2. Respostas a Clarificações
**Quando detecta**: Usuário responde a uma clarificação (ex: "Custo" após lista de indicadores)

**Lógica**:
- Função: `isKpiSelection()` - detecta seleção de KPI
- Busca última resposta do assistente que pediu clarificação
- Se pergunta anterior era follow-up, busca pergunta original
- Reconstrói pergunta completa com contexto
- **IMPORTANTE**: Se pergunta original era sobre preço específico, mantém contexto (ignora KPI selecionado)

---

## 📝 4. DISTRIBUIÇÃO DE CONTEÚDO

### 4.1. Resumo Executivo (Executive Summary)
- Arquivo: `maestro.ts` → `generateExecutiveSummary()`
- Para evolução de preços: mensagem padrão sem duplicar conteúdo
- Formato: "Análise identificou X causa(s) principal(is). [Resumo]. Evidência: [primeira evidência]."

### 4.2. Principais Causas (Top Causes)
- Para evolução de preços: agrupa título + todas as estatísticas (inicial, final, variação, média, min, max)
- Para outros casos: limita a 3 causas
- Formato: lista com bullets (•)

### 4.3. Evidências (Numerical Evidence)
- Para evolução de preços: mostra TODAS as evidências do período (sem limite)
- Para outros casos: limita a 5 evidências
- Formato: "Métrica: Valor"

---

## 🗂️ 5. ESTRUTURA DE DADOS

### 5.1. PageContext (compras)
```typescript
{
  kpis: Array<{id, label, value, unit, change, trend}>,
  tabelaPrecos: Array<{name, value, variacao, unidade}>,
  rankingFornecedores: Array<{name, otd, fillRate, qualidade, dependencia}>,
  seriePrecos: Array<{name, farinha?, margarina?, fermento?}>
}
```

### 5.2. AgentResponse
```typescript
{
  agent: 'compras_fornecedores',
  confidence: number,
  findings: string[],
  evidence: Array<{metric, value, comparison?, source}>,
  recommendations: string[],
  limitations: string[],
  thoughtProcess: {
    kpiPrincipal?: string,
    area: string,
    dataSource: string,
    kpiConfidence: number
  }
}
```

---

## 🔧 6. FUNÇÕES AUXILIARES

### 6.1. Formatação
- `formatValueWithUnit()`: formata valores com unidade (ex: "R$ 4,85 por kg")
- `formatCurrency()`: formata moeda
- `formatNumber()`: formata números com casas decimais

### 6.2. Validação
- `checkEvidenceForKPI()`: verifica se há evidência mínima para um KPI
- `generateClarificationMessage()`: gera mensagem de clarificação com indicadores sugeridos
- `filterOthers()`: filtra agrupamento "Outros" de listas

---

## 📋 7. CHECKLIST PARA REPLICAÇÃO

Para replicar nas demais páginas, você precisará:

### ✅ Detecções Especiais
- [ ] Implementar detecções específicas da área (equivalente a PASSO 0.1, 0.2, 0.3)
- [ ] Criar funções de detecção no `kpi-scorer.ts` ou arquivo específico
- [ ] Definir ordem de prioridade das detecções

### ✅ KPIs
- [ ] Definir catálogo de KPIs da área
- [ ] Adicionar keywords para cada KPI no `KPI_KEYWORDS`
- [ ] Mapear KPIs para labels em `kpi-labels.ts`

### ✅ PageContext
- [ ] Criar função `getPageContext()` para a área
- [ ] Definir estrutura de dados específica da área
- [ ] Mapear dados mockados para PageContext

### ✅ Recuperação de Contexto
- [ ] Adaptar `isFollowUpQuestion()` para termos específicos da área
- [ ] Adaptar `extractInputFromFollowUp()` para entidades da área
- [ ] Adaptar `isKpiSelection()` para KPIs da área

### ✅ Distribuição de Conteúdo
- [ ] Ajustar `generateExecutiveSummary()` para casos especiais da área
- [ ] Ajustar lógica de `topCauses` e `numericalEvidence` no `maestro.ts`
- [ ] Garantir que evidências completas sejam mostradas quando necessário

### ✅ Frontend
- [ ] Remover limites de exibição (`.slice()`) quando necessário
- [ ] Garantir `whitespace-pre-wrap` para preservar formatação
- [ ] Testar exibição de todas as evidências

---

## 🎯 8. PONTOS DE ATENÇÃO

### ⚠️ Ordem de Prioridade
As detecções especiais devem ser executadas ANTES do scoring normal de KPIs, na ordem:
1. Preço específico (PASSO 0.1)
2. Evolução de preços (PASSO 0.2)
3. Pior insumo (PASSO 0.3)
4. Scoring normal de KPIs

### ⚠️ Detecção de Evolução vs Preço Pontual
- Se menciona período/meses → evolução (série temporal)
- Se não menciona período → preço pontual (tabela atual)

### ⚠️ Normalização de Strings
- Usar regex `/pre.*?os/i` para capturar "preço"/"preços" com variações de encoding
- Normalizar com `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` quando necessário

### ⚠️ Isolamento de Meses
- Verificar se mês está isolado (não parte de outra palavra)
- Exemplo: "mar" em "margarina" não deve ser detectado como mês

### ⚠️ Limites de Exibição
- Remover `.slice()` no frontend quando for série temporal
- Manter limites apenas para casos genéricos (evitar sobrecarga)

---

## 📚 9. ARQUIVOS PRINCIPAIS

### Backend
- `src/services/orchestrator/agents/index.ts` → `agentComprasFornecedores()`
- `src/services/orchestrator/agents/kpi-scorer.ts` → scoring e detecções
- `src/services/orchestrator/agents/evidence-checker.ts` → validação de evidências
- `src/services/orchestrator/page-context.ts` → `getPageContext()`
- `src/services/orchestrator/context-recovery.ts` → recuperação de contexto
- `src/services/orchestrator/maestro.ts` → consolidação e distribuição

### Frontend
- `src/components/ChatWidget.tsx` → interface do chat
- `src/services/orchestrator/kpi-labels.ts` → labels dos KPIs

### Dados
- `src/services/mockData.ts` → dados mockados (evolucaoPrecos, custoMateriasPrimas, etc.)

---

## 🎉 10. FUNCIONALIDADES IMPLEMENTADAS

✅ Detecção de preço específico de insumo  
✅ Detecção de evolução de preços com período  
✅ Detecção de "pior insumo" / "vilão do mês"  
✅ Detecção de dependência de fornecedores  
✅ Recuperação de contexto para follow-ups  
✅ Recuperação de contexto para clarificações  
✅ Distribuição correta entre Principais Causas e Evidências  
✅ Exibição completa de todas as evidências do período  
✅ Resumo executivo sem duplicação  
✅ Normalização de strings para variações de encoding  
✅ Isolamento de meses (evitar falsos positivos)  
✅ Sistema de scoring de KPIs  
✅ Mensagens de clarificação com indicadores sugeridos  

---

**Última atualização**: Hoje  
**Status**: ✅ Completo e testado para página de Compras


