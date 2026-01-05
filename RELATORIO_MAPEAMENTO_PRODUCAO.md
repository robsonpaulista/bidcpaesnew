# 📊 Relatório de Mapeamento: Indicadores da Página de Produção

## 🎯 Objetivo
Mapear todos os indicadores, KPIs, gráficos e tabelas da página de Produção e comparar com:
1. O que o agente tem mapeado
2. O que foi repassado ao chat (contexto)

---

## 📋 1. INDICADORES NA PÁGINA DE PRODUÇÃO

### 1.1. KPIs Cards (8 indicadores principais)

| # | ID | Label | Valor | Unidade | Descrição | Fonte |
|---|----|----|----|----|----|----|
| 1 | `producao_total` | Produção Total | 145.820 | kg | Volume produzido no mês | `producaoKPIs[0]` |
| 2 | `oee` | OEE | 78.5 | % | Eficiência global dos equipamentos | `producaoKPIs[1]` |
| 3 | `disponibilidade` | Disponibilidade | 92.3 | % | Tempo que a máquina ficou operando | `producaoKPIs[2]` |
| 4 | `performance` | Performance | 88.7 | % | Velocidade real vs velocidade ideal | `producaoKPIs[3]` |
| 5 | `qualidade` | Qualidade | 95.8 | % | Produtos bons vs total produzido | `producaoKPIs[4]` |
| 6 | `rendimento` | Rendimento Médio | 97.2 | % | Aproveitamento da matéria-prima | `producaoKPIs[5]` |
| 7 | `perdas_processo` | Perdas Processo | 2.650 | kg | Refugos e retrabalhos | `producaoKPIs[6]` |
| 8 | `mtbf` | MTBF | 48 | h | Tempo médio entre falhas | `producaoKPIs[7]` |

**Fonte**: `src/services/mockData.ts` → `producaoKPIs`

---

### 1.2. OEE Destaque (Card Especial)

- **Título**: "OEE - Overall Equipment Effectiveness"
- **Fórmula**: Disponibilidade × Performance × Qualidade
- **OEE Total**: 78.5% (Meta: 85%)
- **Componentes**:
  - Disponibilidade: 92.3% (Tempo operando vs planejado)
  - Performance: 88.7% (Velocidade real vs ideal)
  - Qualidade: 95.8% (Produtos bons vs total)
- **Cálculo**: 92.3% × 88.7% × 95.8% = 78.5%
- **Fonte**: `src/pages/Producao.tsx` (hardcoded, mas valores vêm dos KPIs)

---

### 1.3. Gráficos

#### 1.3.1. Evolução OEE
- **Título**: "Evolução OEE"
- **Subtítulo**: "Histórico mensal dos componentes"
- **Tipo**: ComposedChart (Area + Line) (Recharts)
- **Dados**: `oeeHistorico` (12 meses: Jan a Dez)
- **Séries**:
  - OEE (área)
  - Disponibilidade (linha)
  - Performance (linha)
  - Qualidade (linha)
- **Fonte**: `src/services/mockData.ts` → `oeeHistorico`

#### 1.3.2. Perdas de Produção
- **Título**: "Perdas de Produção"
- **Subtítulo**: "Distribuição por tipo de defeito"
- **Tipo**: PieChart (Recharts)
- **Dados**: `perdasProducao`
- **Tipos de perdas**:
  1. Massa mole - 35% (927 kg)
  2. Massa dura - 22% (583 kg)
  3. Queimado - 18% (477 kg)
  4. Formato irregular - 15% (398 kg)
  5. Outros - 10% (265 kg)
- **Fonte**: `src/services/mockData.ts` → `perdasProducao`

#### 1.3.3. Produtividade por Turno
- **Título**: "Produtividade por Turno"
- **Subtítulo**: "Volume produzido vs meta (kg)"
- **Tipo**: BarChart horizontal (Recharts)
- **Dados**: `produtividadeTurno`
- **Turnos**:
  1. Turno 1 (6h-14h) - 52.840 kg (Meta: 50.000 kg, Eficiência: 105.7%)
  2. Turno 2 (14h-22h) - 48.920 kg (Meta: 50.000 kg, Eficiência: 97.8%)
  3. Turno 3 (22h-6h) - 44.060 kg (Meta: 45.000 kg, Eficiência: 97.9%)
- **Fonte**: `src/services/mockData.ts` → `produtividadeTurno`

#### 1.3.4. Rendimento por Linha
- **Título**: "Rendimento por Linha"
- **Subtítulo**: "Eficiência das linhas de produção"
- **Tipo**: ProgressBar (customizado)
- **Dados**: `rendimentoPorLinha`
- **Linhas**:
  1. Linha 1 - Francês - 97.8% (Meta: 97.0%)
  2. Linha 2 - Forma - 96.5% (Meta: 97.0%)
  3. Linha 3 - Doces - 97.2% (Meta: 96.5%)
  4. Linha 4 - Especiais - 96.8% (Meta: 96.0%)
- **Fonte**: `src/services/mockData.ts` → `rendimentoPorLinha`

---

### 1.4. Indicadores Adicionais (Cards Especiais)

#### 1.4.1. MTTR (Tempo Médio de Reparo)
- **Label**: "MTTR"
- **Valor**: 2.5h
- **Descrição**: "Tempo médio de reparo"
- **Fonte**: `src/pages/Producao.tsx` (hardcoded)

#### 1.4.2. Temperatura Forno
- **Label**: "Temperatura Forno"
- **Valor**: 180-220°C
- **Conformidade**: 98.5%
- **Fonte**: `src/pages/Producao.tsx` (hardcoded)

#### 1.4.3. pH da Massa
- **Label**: "pH da Massa"
- **Valor**: 5.2 - 5.8
- **Status**: "Dentro do padrão"
- **Fonte**: `src/pages/Producao.tsx` (hardcoded)

#### 1.4.4. Umidade
- **Label**: "Umidade"
- **Valor**: 38-42%
- **Conformidade**: 97.2%
- **Fonte**: `src/pages/Producao.tsx` (hardcoded)

---

## 🤖 2. O QUE O AGENTE TEM MAPEADO

### 2.1. KPIs Principais (Catálogo)

| # | ID | Label | Unidade | Status | Fonte |
|---|----|----|----|----|----|
| 1 | `producao_total` | Produção Total | kg | ✅ Mapeado | `kpi-scorer.ts` |
| 2 | `oee` | OEE | % | ✅ Mapeado | `kpi-scorer.ts` |
| 3 | `disponibilidade` | Disponibilidade | % | ✅ Mapeado | `kpi-scorer.ts` |
| 4 | `performance` | Performance | % | ✅ Mapeado | `kpi-scorer.ts` |
| 5 | `qualidade` | Qualidade | % | ✅ Mapeado | `kpi-scorer.ts` |
| 6 | `rendimento` | Rendimento Médio | % | ✅ Mapeado | `kpi-scorer.ts` |
| 7 | `perdas_processo` | Perdas Processo | kg | ✅ Mapeado | `kpi-scorer.ts` |
| 8 | `mtbf` | MTBF | h | ✅ Mapeado | `kpi-scorer.ts` |
| 9 | `mttr` | MTTR | h | ✅ Mapeado | `kpi-scorer.ts` |
| 10 | `produtividade_turno` | Produtividade por Turno | kg | ✅ Mapeado | `kpi-scorer.ts` |

**Fonte**: 
- `src/services/orchestrator/agents/kpi-scorer.ts` → `KPI_KEYWORDS`
- `src/services/orchestrator/agents/index.ts` → `agentProducao()`

---

### 2.2. Detecções Especiais

#### 2.2.1. OEE Específico de Linha (PASSO 0.1)
- **Função**: `isSpecificLineOEEQuestion()` em `kpi-scorer.ts`
- **Detecta**: Perguntas sobre OEE de uma linha específica
- **Exemplo**: "qual o OEE da Linha 1?"
- **Fonte de dados**: `pageContext.rendimentoLinhas` + `pageContext.kpis` (OEE geral)
- **Status**: ✅ Implementado

#### 2.2.2. Evolução de OEE/Indicadores (PASSO 0.2)
- **Detecta**: Perguntas sobre evolução de indicadores em um período
- **Exemplo**: "evolução do OEE de jan a ago"
- **Fonte de dados**: `pageContext.serieOEE` (oeeHistorico)
- **Suporta**:
  - OEE
  - Disponibilidade
  - Performance
  - Qualidade
  - Componentes (todos juntos)
- **Status**: ✅ Implementado

#### 2.2.3. Pior Linha (PASSO 0.3)
- **Função**: `isWorstLineQuestion()` em `kpi-scorer.ts`
- **Detecta**: Perguntas sobre "pior linha", "linha com menor rendimento"
- **Exemplo**: "qual a linha que rendeu menos?"
- **Fonte de dados**: `pageContext.rendimentoLinhas`
- **Status**: ✅ Implementado

---

### 2.3. Keywords Mapeadas (Sistema de Scoring)

**Fonte**: `src/services/orchestrator/agents/kpi-scorer.ts` → `KPI_KEYWORDS`

| KPI | Keywords Exact | Keywords Primary | Keywords Secondary |
|-----|---------------|------------------|-------------------|
| `oee` | oee | eficiência global, eficiência dos equipamentos | eficiência, efetividade |
| `disponibilidade` | disponibilidade | tempo operando, tempo funcionando, uptime | parada, paradas, downtime |
| `performance` | performance | velocidade, ritmo, cadência | rápido, lento, devagar |
| `qualidade` | qualidade | produtos bons, produtos aprovados | defeito, defeitos, refugo |
| `rendimento` | rendimento, rendimento médio | aproveitamento, utilização | matéria-prima, mp |
| `perdas_processo` | perdas processo, perdas de processo | perdas, perda, refugo, retrabalho | desperdício, massa mole, massa dura, queimado |
| `producao_total` | produção total, volume produzido | volume, quantidade produzida, kg produzido | produção |
| `mtbf` | mtbf, tempo médio entre falhas | falhas, quebras, manutenção | equipamento, equipamentos, máquina |
| `mttr` | mttr, tempo médio de reparo | tempo de reparo, tempo reparo, reparo | manutenção, conserto |
| `produtividade_turno` | produtividade por turno, produtividade turno | turno, turnos, volume por turno | produtividade, volume produzido |

---

## 💬 3. O QUE FOI REPASSADO AO CHAT (CONTEXTO)

### 3.1. PageContext (Estrutura)

**Fonte**: `src/services/orchestrator/page-context.ts` → `getPageContext('producao')`

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
  serieOEE: Array<{
    name: string
    oee?: number
    disponibilidade?: number
    performance?: number
    qualidade?: number
  }>,
  rendimentoLinhas: Array<{
    name: string
    rendimento: number
    meta: number
  }>,
  produtividadeTurnos: Array<{
    name: string
    valor: number
    meta: number
    eficiencia: number
  }>,
  perdasProducao: Array<{
    name: string
    value: number
    kg: number
  }>
}
```

---

### 3.2. Dados Repassados

#### 3.2.1. KPIs (8 cards)
✅ **Todos os 8 KPIs** são repassados via `pageContext.kpis`

#### 3.2.2. Série Histórica OEE
✅ **12 meses** são repassados via `pageContext.serieOEE`
- Inclui: OEE, Disponibilidade, Performance, Qualidade

#### 3.2.3. Rendimento por Linha
✅ **4 linhas** são repassadas via `pageContext.rendimentoLinhas`
- Inclui: Rendimento e Meta por linha

#### 3.2.4. Produtividade por Turno
✅ **3 turnos** são repassados via `pageContext.produtividadeTurnos`
- Inclui: Valor, Meta, Eficiência por turno

#### 3.2.5. Perdas de Produção
✅ **5 tipos de perdas** são repassados via `pageContext.perdasProducao`
- Inclui: Percentual e kg por tipo de perda

---

## ✅ 4. ANÁLISE DE COBERTURA

### 4.1. KPIs Cards

| Indicador | Na Página | No Agente | No Contexto | Status |
|-----------|-----------|-----------|-------------|--------|
| Produção Total | ✅ | ✅ | ✅ | ✅ **Coberto** |
| OEE | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Disponibilidade | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Performance | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Qualidade | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Rendimento Médio | ✅ | ✅ | ✅ | ✅ **Coberto** |
| Perdas Processo | ✅ | ✅ | ✅ | ✅ **Coberto** |
| MTBF | ✅ | ✅ | ✅ | ✅ **Coberto** |

**Resultado**: ✅ **100% coberto** (8/8)

---

### 4.2. OEE Destaque (Card Especial)

| Componente | Na Página | No Agente | No Contexto | Status |
|------------|-----------|-----------|-------------|--------|
| OEE Total | ✅ | ✅ (via KPI) | ✅ (via KPI) | ✅ **Coberto** |
| Disponibilidade | ✅ | ✅ (via KPI) | ✅ (via KPI) | ✅ **Coberto** |
| Performance | ✅ | ✅ (via KPI) | ✅ (via KPI) | ✅ **Coberto** |
| Qualidade | ✅ | ✅ (via KPI) | ✅ (via KPI) | ✅ **Coberto** |
| Fórmula OEE | ✅ | ❌ | ❌ | ⚠️ **Não coberto** (apenas visual) |

**Resultado**: ✅ **80% coberto** (4/5) - Fórmula é apenas visual

---

### 4.3. Gráficos

| Gráfico | Na Página | No Agente | No Contexto | Status |
|---------|-----------|-----------|-------------|--------|
| Evolução OEE | ✅ | ✅ (PASSO 0.2) | ✅ (serieOEE) | ✅ **Coberto** |
| Perdas de Produção | ✅ | ✅ (via perdas_processo) | ✅ (perdasProducao) | ✅ **Coberto** |
| Produtividade por Turno | ✅ | ✅ (produtividade_turno) | ✅ (produtividadeTurnos) | ✅ **Coberto** |
| Rendimento por Linha | ✅ | ✅ (via rendimento + PASSO 0.1, 0.3) | ✅ (rendimentoLinhas) | ✅ **Coberto** |

**Resultado**: ✅ **100% coberto** (4/4)

---

### 4.4. Indicadores Adicionais

| Indicador | Na Página | No Agente | No Contexto | Status |
|-----------|-----------|-----------|-------------|--------|
| MTTR | ✅ | ✅ | ⚠️ (hardcoded no agente) | ⚠️ **Parcial** |
| Temperatura Forno | ✅ | ❌ | ❌ | ❌ **NÃO COBERTO** |
| pH da Massa | ✅ | ❌ | ❌ | ❌ **NÃO COBERTO** |
| Umidade | ✅ | ❌ | ❌ | ❌ **NÃO COBERTO** |

**Resultado**: ⚠️ **25% coberto** (1/4)

**Observações**:
- **MTTR**: Está mapeado no agente, mas o valor é hardcoded (2.5h) no código do agente, não vem do contexto
- **Temperatura, pH, Umidade**: Estão hardcoded na página e não estão no `mockData.ts`, portanto não são repassados ao contexto nem mapeados no agente

---

### 4.5. Indicadores Derivados (das Tabelas/Gráficos)

#### 4.5.1. Perdas de Produção
- ✅ Tipos de perdas (massa mole, dura, queimado, etc.) → **Coberto** (via `perdas_processo`)
- ✅ Percentual por tipo → **Coberto** (via `perdasProducao`)
- ✅ Quantidade em kg por tipo → **Coberto** (via `perdasProducao`)

#### 4.5.2. Produtividade por Turno
- ✅ Volume por turno → **Coberto** (via `produtividade_turno`)
- ✅ Meta por turno → **Coberto** (via `produtividadeTurnos`)
- ✅ Eficiência por turno → **Coberto** (via `produtividadeTurnos`)
- ✅ Melhor/pior turno → **Coberto** (lógica no agente)

#### 4.5.3. Rendimento por Linha
- ✅ Rendimento por linha → **Coberto** (via `rendimento` + `rendimentoLinhas`)
- ✅ Meta por linha → **Coberto** (via `rendimentoLinhas`)
- ✅ Pior linha → **Coberto** (PASSO 0.3)
- ✅ OEE por linha → **Coberto** (PASSO 0.1)

---

## 📊 5. RESUMO EXECUTIVO

### 5.1. Cobertura Geral

| Categoria | Total | Coberto | Não Coberto | % Coberto |
|-----------|-------|---------|-------------|-----------|
| **KPIs Cards** | 8 | 8 | 0 | **100%** ✅ |
| **OEE Destaque** | 5 | 4 | 1 | **80%** ✅ |
| **Gráficos** | 4 | 4 | 0 | **100%** ✅ |
| **Indicadores Adicionais** | 4 | 1 | 3 | **25%** ⚠️ |
| **TOTAL** | **21** | **17** | **4** | **81%** |

---

### 5.2. Pontos Fortes

✅ **Todos os KPIs principais** estão mapeados e funcionais  
✅ **Gráficos** são acessíveis via contexto (serieOEE, perdasProducao, produtividadeTurnos, rendimentoLinhas)  
✅ **Detecções especiais** cobrem casos de uso importantes:
   - OEE específico de linha
   - Evolução de OEE/indicadores
   - Pior linha (rendimento)
   - Produtividade por turno
   - Perdas de produção

✅ **Análises específicas** implementadas:
   - Ranking de perdas
   - Comparação de turnos (melhor/pior)
   - Comparação de linhas
   - Relação MTBF/MTTR

---

### 5.3. Gaps Identificados

⚠️ **MTTR** (2.5h)
- Está mapeado no agente e funciona
- Mas o valor é hardcoded no código do agente (não vem do contexto)
- **Recomendação**: Adicionar MTTR ao `mockData.ts` e `pageContext` para ter dados dinâmicos

❌ **Temperatura Forno** (180-220°C, Conformidade: 98.5%)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

❌ **pH da Massa** (5.2 - 5.8)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

❌ **Umidade** (38-42%, Conformidade: 97.2%)
- Não está no `mockData.ts`
- Não está no `pageContext`
- Não está mapeado no agente
- **Recomendação**: Adicionar ao `mockData.ts` e `pageContext` se for um indicador importante

---

## 🔧 6. RECOMENDAÇÕES

### 6.1. Prioridade Alta

1. **Adicionar MTTR ao contexto**
   - Adicionar `mttr` ao `producaoKPIs` no `mockData.ts`
   - Atualizar `pageContext` para incluir MTTR
   - Remover valor hardcoded do agente

### 6.2. Prioridade Média

2. **Decidir sobre indicadores de qualidade**
   - Se "Temperatura Forno", "pH da Massa" e "Umidade" são indicadores importantes para o agente responder, adicionar ao `mockData.ts` e `pageContext`
   - Se não são importantes, manter como está (apenas visual)

3. **Melhorar detecção de indicadores derivados**
   - Adicionar keywords para "temperatura", "ph", "umidade" se forem adicionados ao contexto

### 6.3. Prioridade Baixa

4. **Documentar indicadores não cobertos**
   - Criar lista de indicadores que são apenas visuais e não precisam ser cobertos pelo agente

---

## 📝 7. CONCLUSÃO

O agente de Produção está **muito bem coberto** para os indicadores principais:
- ✅ Todos os 8 KPIs cards estão mapeados
- ✅ Gráficos são acessíveis via contexto
- ✅ Detecções especiais cobrem casos de uso importantes
- ✅ Análises específicas implementadas (perdas, turnos, linhas)

Os gaps são:
- ⚠️ **MTTR**: Mapeado mas valor hardcoded (deveria vir do contexto)
- ❌ **Indicadores de qualidade** (Temperatura, pH, Umidade): Não estão no contexto nem mapeados

**Status Geral**: ✅ **81% coberto** (17/21 indicadores principais)

---

**Data do Relatório**: Hoje  
**Versão**: 1.0  
**Autor**: Análise Automatizada
