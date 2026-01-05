# 📊 Relatório de Mapeamento - Página de Produção

## ✅ Comparação: KPIs da Página vs Mapeamento no Agente

### 1. KPIs Principais (Cards)

| # | KPI na Página | ID | Mapeado em `kpi-scorer.ts`? | Label em `kpi-labels.ts`? | Status |
|---|---------------|----|------------------------------|---------------------------|--------|
| 1 | **Produção Total** | `producao_total` | ✅ SIM | ✅ SIM | ✅ OK |
| 2 | **OEE** | `oee` | ✅ SIM | ✅ SIM | ✅ OK |
| 3 | **Disponibilidade** | `disponibilidade` | ✅ SIM | ✅ SIM | ✅ OK |
| 4 | **Performance** | `performance` | ✅ SIM | ✅ SIM | ✅ OK |
| 5 | **Qualidade** | `qualidade` | ✅ SIM | ✅ SIM | ✅ OK |
| 6 | **Rendimento Médio** | `rendimento` | ✅ SIM | ✅ SIM | ✅ OK |
| 7 | **Perdas Processo** | `perdas_processo` | ✅ SIM | ✅ SIM | ✅ OK |
| 8 | **MTBF** | `mtbf` | ✅ SIM | ✅ SIM | ✅ OK |

**Resultado**: ✅ **8/8 KPIs principais mapeados**

---

### 2. Indicadores Adicionais (Cards Especiais)

| # | Indicador na Página | ID Sugerido | Mapeado? | Status |
|---|---------------------|-------------|----------|--------|
| 1 | **MTTR** (Tempo médio de reparo) | `mttr` | ❌ NÃO | ⚠️ **FALTANDO** |
| 2 | **Temperatura Forno** | `temperatura_forno` | ❌ NÃO | ⚠️ **FALTANDO** |
| 3 | **pH da Massa** | `ph_massa` | ❌ NÃO | ⚠️ **FALTANDO** |
| 4 | **Umidade** | `umidade` | ❌ NÃO | ⚠️ **FALTANDO** |

**Resultado**: ⚠️ **0/4 indicadores adicionais mapeados**

---

### 3. Gráficos e Visualizações

| # | Gráfico/Visualização | Dados | Mapeado? | Detecção Especial? | Status |
|---|----------------------|-------|----------|---------------------|--------|
| 1 | **Evolução OEE** (histórico) | `oeeHistorico` | ✅ SIM | ✅ SIM (`isOEEEvolutionQuestion` implícito) | ✅ OK |
| 2 | **Perdas de Produção** (pizza) | `perdasProducao` | ✅ SIM (via `perdas_processo`) | ❌ NÃO | ⚠️ **Parcial** |
| 3 | **Produtividade por Turno** | `produtividadeTurno` | ❌ NÃO | ❌ NÃO | ❌ **FALTANDO** |
| 4 | **Rendimento por Linha** | `rendimentoPorLinha` | ✅ SIM (via `rendimento`) | ✅ SIM (`isWorstLineQuestion`) | ✅ OK |

**Resultado**: ⚠️ **2/4 gráficos totalmente mapeados**

---

### 4. Detecções Especiais Implementadas

| # | Detecção Especial | Função | Status |
|---|-------------------|--------|--------|
| 1 | **OEE por Linha Específica** | `isSpecificLineOEEQuestion()` | ✅ Implementado |
| 2 | **Pior Linha (Rendimento)** | `isWorstLineQuestion()` | ✅ Implementado |
| 3 | **Evolução de OEE/Indicadores** | Lógica inline no `agentProducao` | ✅ Implementado |
| 4 | **Produtividade por Turno** | ❌ NÃO | ❌ **FALTANDO** |

**Resultado**: ⚠️ **3/4 detecções especiais implementadas**

---

## ❌ KPIs/Indicadores FALTANDO no Mapeamento

### 1. **Produtividade por Turno** (`produtividade_turno`)
- **Dados disponíveis**: `produtividadeTurno` no `pageContext`
- **O que falta**:
  - Adicionar `produtividade_turno` em `KPI_KEYWORDS` no `kpi-scorer.ts`
  - Adicionar label em `kpi-labels.ts`
  - Implementar detecção especial (se necessário)
  - Adicionar lógica no `agentProducao` para responder sobre turnos

**Palavras-chave sugeridas**:
- `['produtividade', 'produtividade por turno', 'turno', 'turnos', 'volume por turno', 'kg por turno']`

---

### 2. **MTTR** (`mttr`)
- **Dados disponíveis**: Exibido na página (2.5h), mas não está no `pageContext`
- **O que falta**:
  - Adicionar `mttr` em `KPI_KEYWORDS` no `kpi-scorer.ts`
  - Adicionar label em `kpi-labels.ts`
  - Adicionar `mttr` ao `pageContext` (se necessário)

**Palavras-chave sugeridas**:
- `['mttr', 'tempo médio de reparo', 'tempo medio de reparo', 'tempo de reparo', 'manutenção', 'manutencao']`

---

### 3. **Indicadores de Qualidade** (Temperatura, pH, Umidade)
- **Dados disponíveis**: Exibidos na página, mas não estão no `pageContext`
- **O que falta**:
  - Decidir se são KPIs separados ou parte de "Qualidade"
  - Se separados: adicionar em `KPI_KEYWORDS` e `kpi-labels.ts`
  - Adicionar ao `pageContext` (se necessário)

**Observação**: Estes podem ser tratados como parte do KPI "Qualidade" existente, ou como KPIs separados.

---

## 📋 Resumo Geral

| Categoria | Total | Mapeados | Faltando | % Completo |
|-----------|-------|----------|----------|------------|
| **KPIs Principais** | 8 | 8 | 0 | ✅ 100% |
| **Indicadores Adicionais** | 4 | 0 | 4 | ❌ 0% |
| **Gráficos/Visualizações** | 4 | 2 | 2 | ⚠️ 50% |
| **Detecções Especiais** | 4 | 3 | 1 | ⚠️ 75% |
| **TOTAL** | **20** | **13** | **7** | ⚠️ **65%** |

---

## 🎯 Recomendações Prioritárias

### Prioridade ALTA 🔴
1. **Adicionar `produtividade_turno`** ao mapeamento
   - É um gráfico principal na página
   - Dados já disponíveis no `pageContext`
   - Usuários podem perguntar sobre turnos

### Prioridade MÉDIA 🟡
2. **Adicionar `mttr`** ao mapeamento
   - Indicador importante de manutenção
   - Complementa `mtbf`

### Prioridade BAIXA 🟢
3. **Decidir sobre indicadores de qualidade** (Temperatura, pH, Umidade)
   - Podem ser tratados como parte de "Qualidade" ou KPIs separados
   - Dados precisam ser adicionados ao `pageContext`

---

## ✅ Conclusão

O agente está **65% completo** em relação aos indicadores da página de Produção. 

**Pontos fortes**:
- ✅ Todos os 8 KPIs principais estão mapeados
- ✅ Detecções especiais para OEE e Rendimento funcionando
- ✅ Evolução de indicadores implementada

**Pontos de melhoria**:
- ❌ Falta mapear "Produtividade por Turno" (prioritário)
- ❌ Falta mapear "MTTR"
- ⚠️ Indicadores de qualidade (Temperatura, pH, Umidade) não estão no `pageContext`

