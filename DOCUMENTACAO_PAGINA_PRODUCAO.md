# 📋 Documentação: Funcionalidades da Página de Produção

## 🎯 Visão Geral

Este documento descreve todas as funcionalidades implementadas para o agente de **Produção**, replicando a lógica da página de Compras.

---

## 🔍 1. DETECÇÕES ESPECIAIS (Ordem de Prioridade)

### 1.1. OEE Específico de Linha (PASSO 0.1)
**Quando detecta**: Perguntas sobre OEE de uma linha específica (ex: "qual o OEE da Linha 1?")

**Lógica**:
- Função: `isSpecificLineOEEQuestion()` em `kpi-scorer.ts`
- Detecta palavras-chave: "oee", "eficiência", "eficiencia", "qual o oee", "qual a eficiência"
- **IMPORTANTE**: Retorna `false` se menciona evolução/período/tendência (deve usar série temporal)
- Busca na `rendimentoLinhas` do `pageContext`
- Retorna OEE atual + variação vs período anterior + rendimento da linha

**Exemplo de pergunta**: "qual o OEE da Linha 1?"

---

### 1.2. Evolução de Indicadores (PASSO 0.2)
**Quando detecta**: Perguntas sobre evolução de indicadores em um período (ex: "evolução de jan a ago do OEE")

**Lógica**:
- Detecta palavras-chave de evolução: "evolução", "variação", "tendência", "período", "histórico", "série", "gráfico", "me mostre"
- Detecta meses mencionados (isolados, não parte de outras palavras)
- Detecta conectores de período: "a", "até"
- Detecta indicadores: OEE, disponibilidade, performance, qualidade, rendimento, perdas
- Busca em `serieOEE` (oeeHistorico) do `pageContext`
- Extrai período (ex: "jan a ago" → Jan, Fev, Mar, ..., Ago)
- Calcula estatísticas: inicial, final, variação, média, min, max
- Adiciona TODAS as evidências mês a mês do período

**Exemplo de pergunta**: "me mostre a evolução do OEE de fevereiro a maio"

---

### 1.3. Pior Linha (PASSO 0.3)
**Quando detecta**: Perguntas sobre "pior linha", "linha com pior rendimento", "vilão da produção"

**Lógica**:
- Função: `isWorstLineQuestion()` em `kpi-scorer.ts`
- Palavras-chave: "pior", "qual a pior", "menor", "pior linha", "linha com pior", "vilão", "vilao"
- Busca na `rendimentoLinhas` do `pageContext`
- Ordena por rendimento (menor primeiro)
- Retorna linha com menor rendimento

**Exemplo de pergunta**: "qual a pior linha de produção?"

---

## 📊 2. KPIs SUPORTADOS

### 2.1. Catálogo de KPIs
- `producao_total`: Produção Total
- `oee`: OEE
- `disponibilidade`: Disponibilidade
- `performance`: Performance
- `qualidade`: Qualidade
- `rendimento`: Rendimento Médio
- `perdas_processo`: Perdas Processo
- `mtbf`: MTBF

### 2.2. Sistema de Scoring
- Arquivo: `kpi-scorer.ts`
- Função: `scoreKPIs()` - calcula scores baseado em keywords
- Função: `selectMainKPIFromScores()` - seleciona KPI principal ou identifica ambiguidade
- Pesos: exact (5), primary (3), secondary (2), context (1)

---

## 🔄 3. RECUPERAÇÃO DE CONTEXTO

### 3.1. Follow-up Questions
**Quando detecta**: Perguntas curtas como "e da Linha 2?", "e do OEE?"

**Lógica**:
- Arquivo: `context-recovery.ts`
- Função: `isFollowUpQuestion()` - detecta padrões como "e da", "e do", "e o", "e a"
- Função: `extractInputFromFollowUp()` - extrai nome da linha/indicador
- Reconstrói pergunta baseada no padrão da última pergunta não follow-up
- Exemplo: "OEE da Linha 1" + "e da Linha 2?" → "OEE da Linha 2"

**Nota**: A recuperação de contexto para Produção ainda precisa ser adaptada para linhas e turnos.

---

## 📝 4. DISTRIBUIÇÃO DE CONTEÚDO

### 4.1. Resumo Executivo (Executive Summary)
- Arquivo: `maestro.ts` → `generateExecutiveSummary()`
- Para evolução de indicadores: mensagem padrão sem duplicar conteúdo
- Formato: "Análise identificou X causa(s) principal(is). [Resumo]. Evidência: [primeira evidência]."

### 4.2. Principais Causas (Top Causes)
- Para evolução de indicadores: agrupa título + todas as estatísticas (inicial, final, variação, média, min, max)
- Para outros casos: limita a 3 causas
- Formato: lista com bullets (•)

### 4.3. Evidências (Numerical Evidence)
- Para evolução de indicadores: mostra TODAS as evidências do período (sem limite)
- Para outros casos: limita a 5 evidências
- Formato: "Métrica: Valor"

---

## 🗂️ 5. ESTRUTURA DE DADOS

### 5.1. PageContext (producao)
```typescript
{
  kpis: Array<{id, label, value, unit, change, trend}>,
  serieOEE: Array<{name, oee?, disponibilidade?, performance?, qualidade?}>,
  rendimentoLinhas: Array<{name, rendimento, meta}>,
  produtividadeTurnos: Array<{name, valor, meta, eficiencia}>,
  perdasProducao: Array<{name, value, kg}>
}
```

### 5.2. AgentResponse
```typescript
{
  agent: 'producao',
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
- `formatValueWithUnit()`: formata valores com unidade (ex: "78,5%")
- `formatCurrency()`: formata moeda
- `formatNumber()`: formata números com casas decimais

### 6.2. Validação
- `checkEvidenceForKPI()`: verifica se há evidência mínima para um KPI (agora suporta KPIs de Produção)
- `generateClarificationMessage()`: gera mensagem de clarificação com indicadores sugeridos (inclui KPIs de Produção)

---

## 📋 7. CHECKLIST PARA REPLICAÇÃO

### ✅ Detecções Especiais
- [x] Implementar detecções específicas da área (PASSO 0.1, 0.2, 0.3)
- [x] Criar funções de detecção no `kpi-scorer.ts`
- [x] Definir ordem de prioridade das detecções

### ✅ KPIs
- [x] Definir catálogo de KPIs da área
- [x] Adicionar keywords para cada KPI no `KPI_KEYWORDS`
- [x] Mapear KPIs para labels em `kpi-labels.ts`

### ✅ PageContext
- [x] Criar função `getPageContext()` para a área
- [x] Definir estrutura de dados específica da área
- [x] Mapear dados mockados para PageContext

### ✅ Recuperação de Contexto
- [ ] Adaptar `isFollowUpQuestion()` para termos específicos da área (linhas, turnos)
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
1. OEE específico de linha (PASSO 0.1)
2. Evolução de indicadores (PASSO 0.2)
3. Pior linha (PASSO 0.3)
4. Scoring normal de KPIs

### ⚠️ Detecção de Evolução vs Indicador Pontual
- Se menciona período/meses → evolução (série temporal)
- Se não menciona período → indicador pontual (KPIs atuais)

### ⚠️ Normalização de Strings
- Usar regex para capturar variações de encoding
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
- `src/services/orchestrator/agents/index.ts` → `agentProducao()`
- `src/services/orchestrator/agents/kpi-scorer.ts` → scoring e detecções
- `src/services/orchestrator/agents/evidence-checker.ts` → validação de evidências
- `src/services/orchestrator/page-context.ts` → `getPageContext()`
- `src/services/orchestrator/context-recovery.ts` → recuperação de contexto
- `src/services/orchestrator/maestro.ts` → consolidação e distribuição

### Frontend
- `src/components/ChatWidget.tsx` → interface do chat
- `src/services/orchestrator/kpi-labels.ts` → labels dos KPIs

### Dados
- `src/services/mockData.ts` → dados mockados (oeeHistorico, rendimentoPorLinha, etc.)

---

## 🎉 10. FUNCIONALIDADES IMPLEMENTADAS

✅ Detecção de OEE específico de linha  
✅ Detecção de evolução de indicadores com período  
✅ Detecção de "pior linha"  
✅ Sistema de scoring de KPIs de Produção  
✅ PageContext completo para Produção  
✅ Labels de KPIs de Produção  
✅ Validação de evidências para KPIs de Produção  
✅ Mensagens de clarificação com indicadores de Produção  
✅ Metas de KPIs de Produção  

---

## ⚠️ 11. PENDÊNCIAS

- [ ] Adaptar context-recovery para linhas e turnos
- [ ] Ajustar generateExecutiveSummary no maestro.ts para evolução de indicadores
- [ ] Testar e validar todas as funcionalidades

---

**Última atualização**: Hoje  
**Status**: ✅ Estrutura completa implementada, pendente ajustes finais e testes

