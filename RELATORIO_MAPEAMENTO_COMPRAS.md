# 📊 Relatório de Mapeamento: Indicadores da Página de Compras

## 🎯 Objetivo
Mapear todos os indicadores, KPIs, gráficos e tabelas da página de Compras e comparar com:
1. O que o agente tem mapeado
2. O que foi repassado ao chat (contexto)

---

## 📋 1. INDICADORES NA PÁGINA DE COMPRAS

### 1.1. KPIs Cards (6 indicadores principais)

| # | ID | Label | Valor | Unidade | Descrição | Fonte |
|---|----|----|----|----|----|----|
| 1 | `custo_mp` | Custo Total MP | 892.450 | R$ | Matéria-prima no mês | `comprasKPIs[0]` |
| 2 | `otd` | OTD Fornecedores | 91.3 | % | Entregas no prazo | `comprasKPIs[1]` |
| 3 | `fill_rate` | Fill Rate | 96.8 | % | % do pedido atendido | `comprasKPIs[2]` |
| 4 | `lead_time` | Lead Time Médio | 3.2 | dias | Tempo entre pedido e entrega | `comprasKPIs[3]` |
| 5 | `cobertura` | Cobertura Estoque MP | 8 | dias | Dias de estoque disponível | `comprasKPIs[4]` |
| 6 | `nao_conformidades` | Não Conformidades | 2.1 | % | Problemas de qualidade | `comprasKPIs[5]` |

**Fonte**: `src/services/mockData.ts` → `comprasKPIs`

---

### 1.2. Gráficos

#### 1.2.1. Evolução de Preços
- **Título**: "Evolução de Preços"
- **Subtítulo**: "Principais matérias-primas (R$/kg)"
- **Tipo**: LineChart (Recharts)
- **Dados**: `evolucaoPrecos` (12 meses: Jan a Dez)
- **Séries**:
  - Farinha de Trigo (R$/kg)
  - Margarina (R$/kg)
  - Fermento (R$/kg)
- **Fonte**: `src/services/mockData.ts` → `evolucaoPrecos`

#### 1.2.2. Performance Fornecedores
- **Título**: "Performance Fornecedores"
- **Subtítulo**: "Comparativo por indicador (OTD = entrega no prazo)"
- **Tipo**: BarChart horizontal (Recharts)
- **Dados**: `performanceFornecedores`
- **Indicadores exibidos**:
  - OTD (entrega) - %
  - Fill Rate (completude) - %
  - Qualidade - %
- **Fonte**: `src/services/mockData.ts` → `performanceFornecedores`

---

### 1.3. Tabelas

#### 1.3.1. Custo por Matéria-Prima
- **Título**: "Custo por Matéria-Prima"
- **Subtítulo**: "Preços atualizados"
- **Dados**: `custoMateriasPrimas`
- **Colunas**:
  - Matéria-Prima (nome)
  - Preço (valor/unidade)
  - Variação (%)
- **Insumos listados**:
  1. Farinha de Trigo - R$ 4,85/kg (+2.3%)
  2. Margarina - R$ 12,40/kg (-1.5%)
  3. Fermento - R$ 28,90/kg (+5.2%)
  4. Açúcar - R$ 3,95/kg (-0.8%)
  5. Sal - R$ 1,20/kg (0%)
  6. Ovos - R$ 0,65/un (+8.3%)
  7. Leite - R$ 5,20/L (+3.1%)
- **Fonte**: `src/services/mockData.ts` → `custoMateriasPrimas`

#### 1.3.2. Performance de Fornecedores
- **Título**: "Performance de Fornecedores"
- **Subtítulo**: "Indicadores de qualidade"
- **Dados**: `performanceFornecedores`
- **Colunas**:
  - Fornecedor (nome)
  - OTD (%)
  - Fill Rate (%)
  - Qualidade (%)
  - Dependência (%)
- **Fornecedores listados**:
  1. Moinho Estrela - OTD: 98%, Fill Rate: 99%, Qualidade: 97%, Dependência: 35%
  2. Distribuidora Sul - OTD: 92%, Fill Rate: 95%, Qualidade: 94%, Dependência: 25%
  3. Laticínios Serrano - OTD: 88%, Fill Rate: 92%, Qualidade: 96%, Dependência: 15%
  4. Açúcar Cristal - OTD: 95%, Fill Rate: 98%, Qualidade: 99%, Dependência: 12%
  5. Outros - OTD: 85%, Fill Rate: 90%, Qualidade: 91%, Dependência: 13%
- **Fonte**: `src/services/mockData.ts` → `performanceFornecedores`

---

### 1.4. Indicadores Adicionais (Cards de Destaque)

#### 1.4.1. Economia Gerada
- **Label**: "Economia gerada este mês"
- **Valor**: R$ 28.560
- **Descrição**: "Resultado de negociações e otimização de pedidos"
- **Subindicadores**:
  - Negociação: R$ 18.200
  - Consolidação: R$ 10.360
- **Fonte**: `src/pages/Compras.tsx` (hardcoded)

---

## 🤖 2. O QUE O AGENTE TEM MAPEADO

### 2.1. KPIs Principais (Catálogo)

| # | ID | Label | Unidade | Status | Fonte |
|---|----|----|----|----|----|
| 1 | `custo_total_mp` | Custo Total MP | R$ | ✅ Mapeado | `compras-structured.ts` |
| 2 | `otd_fornecedores` | OTD Fornecedores | % | ✅ Mapeado | `compras-structured.ts` |
| 3 | `fill_rate` | Fill Rate | % | ✅ Mapeado | `compras-structured.ts` |
| 4 | `lead_time_medio` | Lead Time Médio | dias | ✅ Mapeado | `compras-structured.ts` |
| 5 | `cobertura_estoque_mp` | Cobertura Estoque MP | dias | ✅ Mapeado | `compras-structured.ts` |
| 6 | `nao_conformidades` | Não Conformidades | % | ✅ Mapeado | `compras-structured.ts` |
| 7 | `dependencia_fornecedores` | Dependência / Volume de Compras | % | ✅ Mapeado | `kpi-scorer.ts` |

**Fonte**: 
- `src/services/orchestrator/agents/compras-structured.ts` → `KPI_CATALOG`
- `src/services/orchestrator/agents/kpi-scorer.ts` → `KPI_KEYWORDS`

---

### 2.2. Detecções Especiais

#### 2.2.1. Preço Específico de Insumo (PASSO 0.1)
- **Função**: `isSpecificInputPriceQuestion()` em `kpi-scorer.ts`
- **Detecta**: Perguntas sobre preço de um insumo específico
- **Exemplo**: "qual o preço de compra do Fermento?"
- **Fonte de dados**: `pageContext.tabelaPrecos`
- **Status**: ✅ Implementado

#### 2.2.2. Evolução de Preços (PASSO 0.2)
- **Detecta**: Perguntas sobre evolução de preços em um período
- **Exemplo**: "evolução de jan a ago do preço da Farinha"
- **Fonte de dados**: `pageContext.seriePrecos` (evolucaoPrecos)
- **Status**: ✅ Implementado

#### 2.2.3. Pior Insumo (PASSO 0.3)
- **Função**: `isWorstInputQuestion()` em `kpi-scorer.ts`
- **Detecta**: Perguntas sobre "pior insumo", "vilão do mês"
- **Exemplo**: "qual o vilão do mês nas compras?"
- **Fonte de dados**: `pageContext.tabelaPrecos`
- **Status**: ✅ Implementado

#### 2.2.4. Dependência de Fornecedores
- **KPI**: `dependencia_fornecedores`
- **Detecta**: Perguntas sobre "de quais fornecedores compramos mais?"
- **Fonte de dados**: `pageContext.rankingFornecedores`
- **Status**: ✅ Implementado

---

### 2.3. Keywords Mapeadas (Sistema de Scoring)

**Fonte**: `src/services/orchestrator/agents/kpi-scorer.ts` → `KPI_KEYWORDS`

| KPI | Keywords Exact | Keywords Primary | Keywords Secondary |
|-----|---------------|------------------|-------------------|
| `otd_fornecedores` | otd, on time delivery | atraso, prazo, pontualidade | - |
| `fill_rate` | fill rate | pedido incompleto, faltou item | completo, completude |
| `lead_time_medio` | lead time, lead time médio | tempo de entrega, quantos dias | prazo médio |
| `nao_conformidades` | qualidade, não conformidade | ruim, defeito, devolução | problema |
| `custo_total_mp` | custo total mp | caro, subiu, aumento | preço, custo |
| `cobertura_estoque_mp` | cobertura, cobertura estoque | dias de estoque | estoque |
| `dependencia_fornecedores` | dependência, volume de compras | compramos mais, maior fornecedor | mais compras |

---

## 💬 3. O QUE FOI REPASSADO AO CHAT (CONTEXTO)

### 3.1. PageContext (Estrutura)

**Fonte**: `src/services/orchestrator/page-context.ts` → `getPageContext('compras')`

```typescript
{
  kpis: Array<{
    id: string
    label: string
    value: number | string
    unit: string
    change?: number
    trend?: string
    description?: string
  }>,
  tabelaPrecos: Array<{
    name: string
    value: number
    variacao: number
    unidade: string
  }>,
  rankingFornecedores: Array<{
    name: string
    otd: number
    fillRate: number
    qualidade: number
    dependencia: number
  }>,
  seriePrecos: Array<{
    name: string
    farinha?: number
    margarina?: number
    fermento?: number
  }>
}
```

---

### 3.2. Dados Repassados

#### 3.2.1. KPIs (6 cards)
✅ **Todos os 6 KPIs** são repassados via `pageContext.kpis`

#### 3.2.2. Tabela de Preços
✅ **Todos os 7 insumos** são repassados via `pageContext.tabelaPrecos`

#### 3.2.3. Ranking de Fornecedores
✅ **Todos os 5 fornecedores** são repassados via `pageContext.rankingFornecedores`
- Inclui: OTD, Fill Rate, Qualidade, Dependência

#### 3.2.4. Série de Preços (Evolução)
✅ **12 meses** são repassados via `pageContext.seriePrecos`
- Inclui: Farinha, Margarina, Fermento

---

## ✅ 4. ANÁLISE DE COBERTURA

### 4.1. KPIs Cards

| Indicador | Na Página | No Agente | No Contexto | Status |
|-----------|-----------|-----------|-------------|--------|
| Custo Total MP | ✅ | ✅ | ✅ | ✅ **Coberto** |
| OTD Fornecedores | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Fill Rate | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Lead Time Médio | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Cobertura Estoque MP | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Não Conformidades | ✅ | ✅ | ✅ | ✅ **Coberto** |

**Resultado**: ✅ **100% coberto** (6/6)

---

### 4.2. Gráficos

| Gráfico | Na Página | No Agente | No Contexto | Status |
|---------|-----------|-----------|-------------|--------|
| Evolução de Preços | ✅ | ✅ (PASSO 0.2) | ✅ (seriePrecos) | ✅ **Coberto** |
| Performance Fornecedores | ✅ | ✅ (rankingFornecedores) | ✅ (rankingFornecedores) | ✅ **Coberto** |

**Resultado**: ✅ **100% coberto** (2/2)

---

### 4.3. Tabelas

| Tabela | Na Página | No Agente | No Contexto | Status |
|--------|-----------|-----------|-------------|--------|
| Custo por Matéria-Prima | ✅ | ✅ (PASSO 0.1, 0.3) | ✅ (tabelaPrecos) | ✅ **Coberto** |
| Performance de Fornecedores | ✅ | ✅ (dependencia_fornecedores) | ✅ (rankingFornecedores) | ✅ **Coberto** |

**Resultado**: ✅ **100% coberto** (2/2)

---

### 4.4. Indicadores Adicionais

| Indicador | Na Página | No Agente | No Contexto | Status |
|-----------|-----------|-----------|-------------|--------|
| Economia Gerada | ✅ | ❌ | ❌ | ⚠️ **NÃO COBERTO** |
| Negociação | ✅ | ❌ | ❌ | ⚠️ **NÃO COBERTO** |
| Consolidação | ✅ | ❌ | ❌ | ⚠️ **NÃO COBERTO** |

**Resultado**: ⚠️ **0% coberto** (0/3)

**Observação**: Estes indicadores estão hardcoded na página (`Compras.tsx`) e não estão no `mockData.ts`, portanto não são repassados ao contexto nem mapeados no agente.

---

### 4.5. Indicadores Derivados (das Tabelas)

#### 4.5.1. Tabela de Preços
- ✅ Preço atual de cada insumo → **Coberto** (PASSO 0.1)
- ✅ Variação de preço → **Coberto** (PASSO 0.1)
- ✅ Pior insumo (maior aumento) → **Coberto** (PASSO 0.3)
- ✅ Evolução temporal → **Coberto** (PASSO 0.2)

#### 4.5.2. Tabela de Fornecedores
- ✅ OTD por fornecedor → **Coberto** (via `otd_fornecedores`)
- ✅ Fill Rate por fornecedor → **Coberto** (via `fill_rate`)
- ✅ Qualidade por fornecedor → **Coberto** (via `nao_conformidades`)
- ✅ Dependência por fornecedor → **Coberto** (via `dependencia_fornecedores`)
- ✅ Ranking de fornecedores (piores OTD) → **Coberto** (lógica no agente)
- ✅ Ranking de fornecedores (piores qualidade) → **Coberto** (lógica no agente)

---

## 📊 5. RESUMO EXECUTIVO

### 5.1. Cobertura Geral

| Categoria | Total | Coberto | Não Coberto | % Coberto |
|-----------|-------|---------|-------------|-----------|
| **KPIs Cards** | 6 | 6 | 0 | **100%** ✅ |
| **Gráficos** | 2 | 2 | 0 | **100%** ✅ |
| **Tabelas** | 2 | 2 | 0 | **100%** ✅ |
| **Indicadores Adicionais** | 3 | 0 | 3 | **0%** ⚠️ |
| **TOTAL** | **13** | **10** | **3** | **77%** |

---

### 5.2. Pontos Fortes

✅ **Todos os KPIs principais** estão mapeados e funcionais  
✅ **Gráficos** são acessíveis via contexto (seriePrecos, rankingFornecedores)  
✅ **Tabelas** são acessíveis via contexto (tabelaPrecos, rankingFornecedores)  
✅ **Detecções especiais** cobrem casos de uso importantes:
   - Preço específico de insumo
   - Evolução de preços
   - Pior insumo do mês
   - Dependência de fornecedores

---

### 5.3. Gaps Identificados

⚠️ **Economia Gerada** (R$ 28.560)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

⚠️ **Negociação** (R$ 18.200)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

⚠️ **Consolidação** (R$ 10.360)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

---

## 🔧 6. RECOMENDAÇÕES

### 6.1. Prioridade Alta

1. **Decidir sobre indicadores adicionais**
   - Se "Economia Gerada", "Negociação" e "Consolidação" são indicadores importantes para o agente responder, adicionar ao `mockData.ts` e `pageContext`
   - Se não são importantes, manter como está (apenas visual)

### 6.2. Prioridade Média

2. **Melhorar detecção de indicadores derivados**
   - Adicionar keywords para "economia", "negociação", "consolidação" se forem adicionados ao contexto

3. **Documentar indicadores não cobertos**
   - Criar lista de indicadores que são apenas visuais e não precisam ser cobertos pelo agente

---

## 📝 7. CONCLUSÃO

O agente de Compras está **bem coberto** para os indicadores principais:
- ✅ Todos os 6 KPIs cards estão mapeados
- ✅ Gráficos são acessíveis via contexto
- ✅ Tabelas são acessíveis via contexto
- ✅ Detecções especiais cobrem casos de uso importantes

Os únicos gaps são os **indicadores adicionais** (Economia Gerada, Negociação, Consolidação) que estão hardcoded na página e não estão no contexto. Se estes indicadores forem importantes para o agente responder, devem ser adicionados ao `mockData.ts` e `pageContext`.

**Status Geral**: ✅ **77% coberto** (10/13 indicadores principais)

---

**Data do Relatório**: Hoje  
**Versão**: 1.0  
**Autor**: Análise Automatizada

