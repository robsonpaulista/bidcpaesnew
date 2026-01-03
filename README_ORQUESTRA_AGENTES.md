# 🤖 Orquestra de Agentes de IA - BI DC Pães

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Como Funciona](#como-funciona)
4. [Agentes Especialistas](#agentes-especialistas)
5. [Fluxo Completo de Processamento](#fluxo-completo-de-processamento)
6. [Princípios Fundamentais](#princípios-fundamentais)
7. [Segurança e Enforcement de Políticas](#segurança-e-enforcement-de-políticas)
8. [Funções Semânticas](#funções-semânticas)
9. [Sistema de Intenções](#sistema-de-intenções)
10. [Limites e Controles de Intenções](#limites-e-controles-de-intenções)
11. [Consolidação de Respostas](#consolidação-de-respostas)
12. [Sistema de Confiança](#sistema-de-confiança)
13. [Sistema de Alertas](#sistema-de-alertas)
14. [Sistema de Casos Operacionais](#sistema-de-casos-operacionais)
15. [Contrato de Interação do Usuário](#contrato-de-interação-do-usuário)
16. [Cache e Rate Limiting](#cache-e-rate-limiting)
17. [Deep Links e Validação](#deep-links-e-validação)

---

## 🎯 Visão Geral

A **Orquestra de Agentes de IA** é uma camada de inteligência operacional que complementa o BI tradicional da DC Pães. Ela não substitui o BI, mas adiciona capacidades de:

- **Análise inteligente** de indicadores
- **Investigações automáticas** de causas raiz
- **Recomendações acionáveis** baseadas em dados
- **Alertas proativos** sobre desvios críticos
- **Sínteses executivas** em linguagem natural

### O Que a Orquestra Faz

1. **Interpreta perguntas** em linguagem natural sobre indicadores
2. **Investiga automaticamente** usando múltiplos agentes especialistas
3. **Consolida respostas** com evidências, causas e ações
4. **Gera alertas** quando detecta desvios críticos
5. **Fornece links** para validação no BI tradicional

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/services/orchestrator/
├── types.ts              # Tipos TypeScript e contratos
├── adapter.ts            # Adapter de dados (Mock → SQL futuro)
├── maestro.ts            # Orquestrador principal (Maestro)
├── intentions.ts         # Definições de intenções de negócio
├── llm-mapper.ts         # Mapeador LLM (pergunta → intenção) - RODA NO BACKEND
├── agents/
│   └── index.ts          # Agentes especialistas
├── api.ts                # Serviço de API (chama /api/orchestrator/ask)
└── alerts.ts             # Rotinas de alertas automáticos

api/orchestrator/          # Vercel Serverless Functions (BACKEND)
└── ask.ts                # POST /api/orchestrator/ask - Orquestração segura
```

### Componentes Principais

#### 1. **Maestro (Orquestrador)**
- **Responsabilidade**: Coordena todo o processo de investigação
- **Localização**: `maestro.ts`
- **Função principal**: `orchestrate(request: AskRequest)`

#### 2. **LLM Mapper**
- **Responsabilidade**: Mapeia pergunta em linguagem natural → intenção de negócio
- **Localização**: `llm-mapper.ts` (roda no **backend** via Vercel Serverless Functions)
- **Função principal**: `mapQuestionToIntentionWithLLM(question, context)`
- **⚠️ Segurança**: API key do Groq fica em `process.env.GROQ_API_KEY` (não exposta no frontend)

#### 3. **Agentes Especialistas**
- **Responsabilidade**: Analisam domínios específicos (custos, produção, etc.)
- **Localização**: `agents/index.ts`
- **Tipos**: 7 agentes especializados

#### 4. **Data Adapter**
- **Responsabilidade**: Abstrai acesso a dados (atualmente Mock, futuro SQL)
- **Localização**: `adapter.ts`
- **Funções**: Funções semânticas padronizadas

#### 5. **Sistema de Intenções**
- **Responsabilidade**: Define planos de investigação por intenção
- **Localização**: `intentions.ts`
- **Função principal**: `getInvestigationPlan(intention, question, context)`

---

## ⚙️ Como Funciona

### Fluxo Simplificado

```
1. Usuário faz pergunta
   ↓
2. LLM mapeia → Intenção + Entidades
   ↓
3. Maestro busca plano pré-definido da intenção
   ↓
4. Maestro executa plano (chama funções semânticas)
   ↓
5. Agentes especialistas analisam dados
   ↓
6. Maestro consolida respostas
   ↓
7. Retorna síntese + causas + evidências + ações
```

### Exemplo Prático

**Pergunta do usuário:**
> "Por que a margem do flocão caiu em dezembro?"

**Passo 1 - Mapeamento LLM:**
```json
{
  "intent": "analyze_margin_decline",
  "confidence": 0.95,
  "entities": {
    "kpi": "margem",
    "produto": "flocão",
    "periodo": "dezembro"
  }
}
```

**Passo 2 - Plano de Investigação:**
O Maestro busca o plano pré-definido para `analyze_margin_decline`:
- `get_kpis_overview(period: "dezembro")`
- `get_margin_by_product(period: "dezembro")`
- `get_cost_breakdown(product: "flocão", period: "dezembro")`

**Passo 3 - Execução:**
- Aciona agentes: `custos_margem`, `comercial`
- Cada agente chama funções semânticas via `DataAdapter`
- Agentes analisam dados e geram `findings`, `evidence`, `recommendations`

**Passo 4 - Consolidação:**
O Maestro consolida as respostas:
- **Síntese executiva**: "Análise identificou 2 causas principais. Margem do flocão caiu 3.2% vs período anterior..."
- **Top 3 causas**: Lista priorizada de causas prováveis
- **Evidências numéricas**: Dados que suportam as causas
- **Ações sugeridas**: Recomendações acionáveis
- **Links de validação**: Links para páginas do BI

---

## 👥 Agentes Especialistas

A orquestra possui **7 agentes especialistas**, cada um focado em um domínio específico:

### 1. **Agente: Custos & Margem** (`custos_margem`)

**O que faz:**
- Analisa margens por produto
- Identifica produtos com margem abaixo do ideal
- Faz breakdown de custos (MP, MO, energia, etc.)
- Detecta aumentos anômalos de custos

**Como faz:**
1. Chama `get_margin_by_product(period)` para obter margens
2. Identifica produtos com margem < 28%
3. Se produto específico mencionado, chama `get_cost_breakdown(product, period)`
4. Analisa se custo de MP > 65% do total
5. Gera `findings`, `evidence` e `recommendations`

**Exemplo de resposta:**
```typescript
{
  agent: 'custos_margem',
  confidence: 75,
  findings: [
    '3 produtos com margem abaixo de 28%',
    'Custo de matéria-prima representa 68% do total'
  ],
  evidence: [
    { metric: 'Margem Flocão', value: '25.3%', comparison: 'Meta: 28%' }
  ],
  recommendations: [
    'Revisar negociações com fornecedores de MP',
    'Investigar aumento de custos ou redução de preços'
  ]
}
```

### 2. **Agente: Compras & Fornecedores** (`compras_fornecedores`)

**O que faz:**
- Analisa performance de fornecedores (OTD, qualidade)
- Detecta variações de preço
- Analisa sazonalidade de matérias-primas
- Identifica padrões de compra

**Como faz:**
1. Se pergunta sobre sazonalidade, chama `get_raw_material_seasonality(period)`
2. Analisa oscilação de preços por matéria-prima
3. Identifica melhor/pior mês para compras
4. Se fornecedor específico, chama `get_supplier_variation(input, period)`
5. Detecta fornecedores com OTD < 90% ou variação > 3%

**Exemplo de resposta:**
```typescript
{
  agent: 'compras_fornecedores',
  confidence: 80,
  findings: [
    'Padrão sazonal moderado: oscilação média de 12.5%',
    'Farinha de Trigo: Q2 apresenta pico de 8.3% vs média anual'
  ],
  evidence: [
    { metric: 'Farinha - Oscilação', value: '15.2%', comparison: 'Melhor: Março (R$ 4.20), Pior: Junho (R$ 4.85)' }
  ],
  recommendations: [
    'Considerar compras antecipadas nos meses de menor preço',
    'Negociar contratos de longo prazo para Farinha de Trigo'
  ]
}
```

### 3. **Agente: Produção** (`producao`)

**O que faz:**
- Analisa OEE (Overall Equipment Effectiveness)
- Identifica perdas por linha
- Detecta causas de perdas (massa mole, queimado, etc.)
- Avalia eficiência de linhas

**Como faz:**
1. Chama `get_oee(line, period)` para OEE
2. Chama `get_losses_by_line(period)` para perdas
3. Analisa causas de perdas por linha
4. Identifica linhas com OEE < 80% ou perdas > 3%
5. Correlaciona perdas com OEE

**Exemplo de resposta:**
```typescript
{
  agent: 'producao',
  confidence: 85,
  findings: [
    'OEE abaixo de 80% na Linha 1',
    'Perdas de 1.6% na Linha 1 (927 kg)'
  ],
  evidence: [
    { metric: 'OEE Linha 1', value: '78.5%', comparison: 'Meta: 80%' },
    { metric: 'Perdas Linha 1', value: '927 kg', comparison: '1.6% do total' }
  ],
  recommendations: [
    'Investigar causas de massa mole (35% das perdas)',
    'Revisar parâmetros de temperatura do forno'
  ]
}
```

### 4. **Agente: Estoque & Logística** (`estoque_logistica`)

**O que faz:**
- Analisa OTIF (On Time In Full)
- Avalia acurácia de estoque
- Analisa cobertura de estoque
- Detecta problemas de logística
- Analisa custo por rota e eficiência de veículos

**Como faz:**
1. Chama `get_otif(period)` para performance de entrega
2. Chama `get_stock_coverage(product, period)` se produto específico
3. Chama `get_route_cost(period)` para análise de rotas
4. Chama `get_vehicle_performance(period)` para análise de frota
5. Identifica rotas/veículos com baixa eficiência
6. Calcula ponto de equilíbrio entre rotas

**Exemplo de resposta:**
```typescript
{
  agent: 'estoque_logistica',
  confidence: 75,
  findings: [
    'OTIF abaixo de 95%',
    'Rota 2 com custo por entrega 15% acima da média'
  ],
  evidence: [
    { metric: 'OTIF', value: '94.7%', comparison: 'Meta: 95%' },
    { metric: 'Custo médio por entrega', value: 'R$ 12.50', comparison: 'Melhor: Rota 1 (R$ 10.80)' }
  ],
  recommendations: [
    'Otimizar roteamento da Rota 2',
    'Revisar capacidade de veículos'
  ]
}
```

### 5. **Agente: Comercial** (`comercial`)

**O que faz:**
- Analisa faturamento e receita
- Compara mix de vendas (atual vs ideal)
- Identifica tendências de receita
- Analisa métricas de clientes (churn, ticket médio)

**Como faz:**
1. Chama `get_revenue_monthly(period)` para análise de receita
2. Chama `get_sales_mix(period)` para mix de produtos
3. Calcula oscilação, melhor/pior mês, tendências
4. Compara mix atual vs ideal
5. Identifica produtos com margem alta mas baixa participação

**Exemplo de resposta:**
```typescript
{
  agent: 'comercial',
  confidence: 90,
  findings: [
    'Oscilação de 8.5% no faturamento mensal',
    'Melhor mês: Outubro (R$ 2.85M), Pior: Janeiro (R$ 2.62M)'
  ],
  evidence: [
    { metric: 'Oscilação mensal', value: '8.5%', comparison: 'Média: R$ 2.73M' },
    { metric: 'Melhor mês', value: 'Outubro', comparison: 'R$ 2.85M' }
  ],
  recommendations: [
    'Investigar sazonalidade do faturamento',
    'Ajustar mix para produtos de maior margem'
  ]
}
```

### 6. **Agente: Financeiro** (`financeiro`)

**O que faz:**
- Analisa inadimplência
- Avalia PMR (Prazo Médio de Recebimento)
- Monitora indicadores financeiros
- Detecta problemas de fluxo de caixa

**Como faz:**
1. Chama `get_kpis_overview(period, unit: "financeiro")`
2. Analisa KPIs financeiros (inadimplência, PMR, etc.)
3. Identifica desvios críticos
4. Correlaciona com outros indicadores

**Exemplo de resposta:**
```typescript
{
  agent: 'financeiro',
  confidence: 70,
  findings: [
    'Inadimplência acima de 3%',
    'PMR aumentou 2 dias'
  ],
  evidence: [
    { metric: 'Inadimplência', value: '3.2%', comparison: 'Meta: < 3%' }
  ],
  recommendations: [
    'Revisar política de crédito',
    'Acelerar cobrança de contas a receber'
  ]
}
```

### 7. **Agente: Auditor** (`auditor`)

**O que faz:**
- Valida consistência de dados
- Verifica integridade das análises
- Gera relatórios de auditoria

**Status**: Em desenvolvimento

---

## 🔄 Fluxo Completo de Processamento

### 1. Recebimento da Pergunta

```typescript
// Frontend envia pergunta
const request: AskRequest = {
  question: "Por que a margem do flocão caiu em dezembro?",
  context: {
    area: "financeiro",  // Opcional: contexto da página atual
    unit: "financeiro"
  }
}
```

### 2. Mapeamento LLM

O **LLM Mapper** recebe a pergunta e retorna **APENAS**:

```typescript
{
  intent: "analyze_margin_decline",
  confidence: 0.95,
  entities: {
    kpi: "margem",
    produto: "flocão",
    periodo: "dezembro"
  }
}
```

**⚠️ IMPORTANTE**: O LLM **NÃO decide**:
- ❌ Qual plano usar
- ❌ Quais funções chamar
- ❌ Quais agentes acionar
- ❌ Como estruturar a resposta

O LLM **APENAS mapeia** pergunta → intenção + entidades.

#### 🔒 Segurança: Roda no Backend

O mapeamento LLM roda no **backend** (Vercel Serverless Function):
- ✅ API key do Groq em `process.env.GROQ_API_KEY` (não exposta)
- ✅ Timeout de 3 segundos (AbortController)
- ✅ Validação robusta de resposta JSON
- ✅ Correção crítica: `confidence ?? 0.8` (não `|| 0.8`) para não inflacionar confiança quando `confidence = 0`

#### Correções Críticas Implementadas

1. **Parse JSON**: Tenta `JSON.parse()` direto primeiro (já força JSON com `response_format`)
2. **Confidence**: Usa nullish coalescing (`??`) em vez de `||` para não tratar `0` como falsy
3. **Validação de Entities**: Garante que `entities` é objeto válido
4. **Timeout**: AbortController com 3 segundos para evitar requisições penduradas

#### 🔒 Segurança: Roda no Backend

O mapeamento LLM roda no **backend** (Vercel Serverless Function):
- ✅ API key do Groq em `process.env.GROQ_API_KEY` (não exposta)
- ✅ Timeout de 3 segundos (AbortController)
- ✅ Validação robusta de resposta JSON
- ✅ Correção crítica: `confidence ?? 0.8` (não `|| 0.8`) para não inflacionar confiança quando `confidence = 0`

#### Correções Críticas Implementadas

1. **Parse JSON**: Tenta `JSON.parse()` direto primeiro (já força JSON com `response_format`)
2. **Confidence**: Usa nullish coalescing (`??`) em vez de `||` para não tratar `0` como falsy
3. **Validação de Entities**: Garante que `entities` é objeto válido
4. **Timeout**: AbortController com 3 segundos para evitar requisições penduradas

### 3. Busca do Plano de Investigação

O **Maestro** busca o plano pré-definido para a intenção:

```typescript
// intentions.ts define o plano
const plan = getInvestigationPlan(
  "analyze_margin_decline",
  question,
  { ...context, ...entities }
)

// Retorna:
[
  {
    step: 1,
    agent: "custos_margem",
    function: "get_kpis_overview",
    parameters: { period: "dezembro", unit: "financeiro" }
  },
  {
    step: 2,
    agent: "custos_margem",
    function: "get_margin_by_product",
    parameters: { period: "dezembro" }
  },
  {
    step: 3,
    agent: "custos_margem",
    function: "get_cost_breakdown",
    parameters: { product: "flocão", period: "dezembro" }
  }
]
```

### 4. Execução do Plano

O **Maestro** executa o plano:

```typescript
// 1. Identifica agentes únicos
const selectedAgents = ["custos_margem", "comercial"]

// 2. Aciona agentes em paralelo
const agentPromises = selectedAgents.map(agentType =>
  agents[agentType](question, { ...context, ...entities })
)

// 3. Aguarda respostas
const agentResponses = await Promise.all(agentPromises)
```

### 5. Processamento dos Agentes

Cada agente:

1. **Recebe** a pergunta e contexto
2. **Chama funções semânticas** via `DataAdapter`:
   ```typescript
   const marginData = await DataAdapter.get_margin_by_product("dezembro")
   const costData = await DataAdapter.get_cost_breakdown("flocão", "dezembro")
   const kpis = await DataAdapter.get_kpis_overview("dezembro", "financeiro")
   ```

3. **Analisa dados** e gera:
   - `findings`: Descobertas principais
   - `evidence`: Evidências numéricas
   - `recommendations`: Ações sugeridas
   - `limitations`: Limitações dos dados

4. **Retorna** `AgentResponse`:
   ```typescript
   {
     agent: "custos_margem",
     confidence: 75,
     findings: ["3 produtos com margem abaixo de 28%"],
     evidence: [
       { metric: "Margem Flocão", value: "25.3%", comparison: "Meta: 28%" }
     ],
     recommendations: ["Revisar negociações com fornecedores"],
     limitations: ["Dados baseados em período mensal"]
   }
   ```

### 6. Consolidação de Respostas

O **Maestro** consolida as respostas dos agentes:

```typescript
const synthesis = consolidateResponses(
  question,
  plan,
  agentResponses,
  intentionDef
)
```

**Processo de consolidação:**

1. **Filtra por relevância**: Remove findings/evidence não relevantes à intenção
2. **Prioriza**: Ordena causas por confiança e relevância
3. **Extrai top 3 causas**: Seleciona as principais causas
4. **Extrai evidências**: Prioriza evidências relevantes (máx. 5)
5. **Extrai ações**: Filtra e prioriza recomendações (máx. 5)
6. **Gera síntese executiva**: Texto resumido em linguagem natural
7. **Gera links de validação**: Links para páginas do BI

**Resultado:**
```typescript
{
  executive: "Análise identificou 2 causas principais. Margem do flocão caiu 3.2% vs período anterior...",
  topCauses: [
    { cause: "Custo de matéria-prima aumentou 5%", confidence: 85 },
    { cause: "Mix de vendas deslocado para produtos de menor margem", confidence: 75 }
  ],
  numericalEvidence: [
    { metric: "Margem Flocão", value: "25.3%", unit: "%", context: "Meta: 28%" },
    { metric: "Custo MP", value: "68%", unit: "%", context: "do custo total" }
  ],
  suggestedActions: [
    { action: "Revisar negociações com fornecedores de MP", priority: "high" },
    { action: "Ajustar mix para produtos de maior margem", priority: "medium" }
  ],
  validationLinks: [
    { label: "Financeiro", path: "/financeiro", kpi: "margem_bruta" }
  ]
}
```

### 7. Cálculo de Confiança

O **Maestro** calcula confiança final:

```typescript
const confidence = calculateConfidence(
  agentResponses,
  businessIntention,
  intentionDef,
  llmConfidence
)
```

**Fatores considerados:**
- Confiança do mapeamento LLM (0-100)
- Qualidade das respostas dos agentes
- Quantidade de evidências coletadas
- Relevância das evidências à intenção

---

### 8. Auditoria

Todas as decisões são registradas:

```typescript
const audit = {
  functionsCalled: [
    { function: "get_margin_by_product", parameters: {...}, timestamp: "..." }
  ],
  duration: 1250, // ms
  cost: 0.003, // estimado
  mapping: {
    intent: "analyze_margin_decline",
    confidence: 0.95,
    entities: {...}
  }
}
```

### 9. Resposta Final

```typescript
const response: OrchestratorResponse = {
  id: "orch_1234567890_abc123",
  timestamp: "2024-01-15T10:30:00Z",
  question: "Por que a margem do flocão caiu em dezembro?",
  plan: { ... },
  synthesis: { ... },
  agentResponses: [ ... ],
  confidence: 82,
  audit: { ... }
}
```

---

## 🎯 Princípios Fundamentais

### Regra de Ouro: **LLM NÃO DECIDE NADA**

#### ❌ LLM NÃO PODE:
- Decidir o plano de investigação
- Escolher quais queries executar
- Criar lógica de negócio
- Decidir quais agentes acionar
- Decidir a estrutura da resposta

#### ✅ LLM APENAS:
- Mapeia pergunta → intenção de negócio
- Extrai entidades (kpi, produto, período, etc.)
- Retorna confiança do mapeamento

#### ✅ ORQUESTRADOR (Código) DECIDE:
- Qual plano usar (baseado na intenção)
- Quais funções chamar (definidas no plano)
- Quais agentes acionar (definidos na intenção)
- Como estruturar a resposta (definido na intenção)
- Toda a lógica de negócio

### Outros Princípios

✅ **SQL é a fonte da verdade**  
✅ **IA não executa ações irreversíveis**  
✅ **Sem SQL livre gerado por IA em produção**  
✅ **Toda resposta precisa de evidência**  
✅ **Tudo é auditável**

---

## 🔒 Segurança e Enforcement de Políticas

### ⚠️ Arquitetura Segura: Backend vs Frontend

**IMPORTANTE**: A orquestração roda no **backend** (Vercel Serverless Functions), não no frontend.

#### Por quê?

- ❌ **Frontend expõe**: Qualquer variável `VITE_*` é injetada no bundle do cliente
- ❌ **Risco**: API keys podem vazar, serem inspecionadas e reutilizadas
- ✅ **Backend seguro**: API keys ficam em `process.env` (não expostas)

#### Estrutura Implementada

```
Frontend (Vite)
  ↓ fetch('/api/orchestrator/ask')
Backend (Vercel Serverless Function)
  ↓ api/orchestrator/ask.ts
  ↓ orchestrate() → llm-mapper.ts
  ↓ mapWithGroq() → process.env.GROQ_API_KEY (SEGURO)
```

#### Configuração de Variáveis de Ambiente

**No Vercel Dashboard → Settings → Environment Variables:**

```
✅ GROQ_API_KEY=gsk_sua_chave_aqui
✅ LLM_PROVIDER=groq
✅ LLM_MODEL=llama-3.1-8b-instant
```

**❌ NÃO use:**
```
❌ VITE_LLM_API_KEY (expõe no frontend)
❌ VITE_GROQ_API_KEY (expõe no frontend)
```

#### Verificação de Segurança

1. **Frontend não tem acesso à key**:
   - Inspecione o bundle: `dist/assets/*.js`
   - Procure por "gsk_" ou "GROQ_API_KEY"
   - Não deve encontrar nada

2. **Backend tem acesso**:
   - Logs do Vercel Functions
   - `process.env.GROQ_API_KEY` existe no backend

---

### Regra Técnica: "Sem SQL Livre"

A orquestra implementa **enforcement técnico** para garantir que nenhum SQL seja gerado livremente:

#### 1. Allowlist de Funções Semânticas

**Implementação:**
- Cada intenção define `requiredFunctions` e `optionalFunctions`
- O Maestro **valida** que apenas funções da allowlist são chamadas
- Qualquer tentativa de chamar função não catalogada é **bloqueada**

```typescript
// No maestro.ts - Validação automática
const allowedFunctions = [
  ...intentionDef.requiredFunctions,
  ...intentionDef.optionalFunctions
]

// Valida cada step do plano
investigationSteps.forEach(step => {
  if (!allowedFunctions.includes(step.function)) {
    throw new Error(`Função ${step.function} não permitida para intenção ${businessIntention}`)
  }
})
```

#### 2. RBAC (Role-Based Access Control)

**Perfis de Usuário:**
- **Diretoria**: Acesso a todas as intenções e funções
- **Analista**: Acesso a análises e relatórios (sem ações)
- **Comercial**: Acesso apenas a intenções comerciais
- **Operacional**: Acesso a intenções de produção/estoque

**Implementação Futura:**
```typescript
interface UserProfile {
  role: 'diretoria' | 'analista' | 'comercial' | 'operacional'
  allowedIntentions: BusinessIntention[]
  allowedFunctions: string[]
}

// Validação no maestro
function validateUserAccess(user: UserProfile, intention: BusinessIntention): boolean {
  return user.allowedIntentions.includes(intention)
}
```

#### 3. Read-Only e Sem Joins Livres

**Quando migrar para SQL:**
- Usar **views** e **stored procedures** para cada função semântica
- Credencial de banco **read-only** (sem INSERT/UPDATE/DELETE)
- **Sem joins livres**: Cada função tem query pré-definida
- Validação de parâmetros para prevenir SQL injection

**Exemplo:**
```sql
-- View pré-definida (não gerada dinamicamente)
CREATE VIEW vw_margin_by_product AS
SELECT 
  product_name,
  period,
  margin,
  revenue,
  cost
FROM products_margin
WHERE period = :period;

-- Função semântica chama a view
SELECT * FROM vw_margin_by_product WHERE period = ?
```

#### 4. Bloqueio de Funções Não Catalogadas

**Mecanismo:**
- Catálogo central de funções permitidas: `DataAdapter`
- Agentes **não podem** chamar funções diretamente
- Todas as chamadas passam pelo `DataAdapter`
- Log de tentativas de acesso não autorizado

```typescript
// DataAdapter valida função antes de executar
export const DataAdapter = {
  get_kpis_overview: async (...) => { /* ... */ },
  get_margin_by_product: async (...) => { /* ... */ },
  // ... apenas funções catalogadas
}

// Agente tenta chamar função não catalogada → ERRO
// await DataAdapter.get_unauthorized_function() // ❌ Não existe
```

---

## 🎭 Sistema de Intenções

## 🔧 Funções Semânticas

Os agentes **não acessam tabelas diretamente**. Eles chamam **funções semânticas** padronizadas:

### Lista de Funções

| Função | Descrição | Parâmetros |
|--------|-----------|------------|
| `get_kpis_overview` | Visão geral de KPIs | `period`, `unit?`, `line?` |
| `get_margin_by_product` | Margem por produto | `period` |
| `get_cost_breakdown` | Breakdown de custos | `product`, `period` |
| `get_losses_by_line` | Perdas por linha | `period` |
| `get_oee` | OEE de uma linha | `line`, `period` |
| `get_supplier_variation` | Variação de fornecedores | `input`, `period` |
| `get_stock_coverage` | Cobertura de estoque | `product`, `period` |
| `get_otif` | OTIF (On Time In Full) | `period` |
| `get_sales_mix` | Mix de vendas | `period`, `channel?` |
| `get_revenue_monthly` | Receita mensal | `period` |
| `get_route_cost` | Custo por rota | `period` |
| `get_vehicle_performance` | Performance de veículos | `period` |
| `get_raw_material_seasonality` | Sazonalidade de MP | `period` |

### Vantagens

1. **Abstração**: Agentes não precisam saber estrutura do banco
2. **Manutenibilidade**: Mudanças no banco não afetam agentes
3. **Testabilidade**: Fácil mockar para testes
4. **Migração**: Trocar Mock por SQL é transparente

### Implementação Atual

**Fase Atual (Mock):**
- `adapter.ts` implementa funções com dados mockados
- Simula delays de consulta (300-400ms)
- Retorna dados realistas baseados em `mockData.ts`

**Fase Futura (SQL):**
- Substituir `AdapterMock` por `AdapterSQL`
- Criar views/procedures SQL para cada função
- **Contratos não mudam** (mesmas assinaturas)

---

## 🎭 Sistema de Intenções

### O Que São Intenções?

Intenções são **categorias de perguntas de negócio** pré-definidas. Cada intenção tem:

- **ID único**: Ex: `analyze_margin_decline`
- **Nome descritivo**: "Analisar Queda de Margem"
- **Keywords**: Palavras-chave para detecção
- **Agentes**: Quais agentes usar
- **Funções requeridas**: Quais funções semânticas chamar
- **Funções opcionais**: Funções adicionais se necessário
- **Estrutura de saída**: O que esperar na resposta

### Intenções Disponíveis

| ID | Nome | Agentes | Funções Principais |
|---|------|---------|-------------------|
| `analyze_revenue_trend` | Analisar Tendência de Receita | `comercial` | `get_revenue_monthly`, `get_kpis_overview` |
| `analyze_margin_decline` | Analisar Queda de Margem | `custos_margem`, `comercial` | `get_margin_by_product`, `get_cost_breakdown` |
| `analyze_losses` | Analisar Perdas | `producao`, `estoque_logistica` | `get_losses_by_line`, `get_kpis_overview` |
| `analyze_supplier_performance` | Analisar Performance de Fornecedores | `compras_fornecedores` | `get_supplier_variation`, `get_raw_material_seasonality` |
| `analyze_production_efficiency` | Analisar Eficiência de Produção | `producao` | `get_oee`, `get_kpis_overview` |
| `analyze_stock_accuracy` | Analisar Acurácia de Estoque | `estoque_logistica` | `get_kpis_overview`, `get_stock_coverage` |
| `analyze_delivery_performance` | Analisar Performance de Entrega | `estoque_logistica` | `get_otif`, `get_kpis_overview` |
| `analyze_logistics_cost` | Analisar Custo Logístico | `estoque_logistica` | `get_route_cost`, `get_vehicle_performance` |
| `analyze_sales_mix` | Analisar Mix de Vendas | `comercial` | `get_sales_mix`, `get_margin_by_product` |
| `analyze_financial_health` | Analisar Saúde Financeira | `financeiro` | `get_kpis_overview` |
| `analyze_customer_metrics` | Analisar Métricas de Clientes | `comercial` | `get_kpis_overview` |
| `compare_periods` | Comparar Períodos | Múltiplos | `get_kpis_overview` |
| `identify_root_cause` | Identificar Causa Raiz | Múltiplos | `get_kpis_overview` |
| `suggest_improvements` | Sugerir Melhorias | Múltiplos | `get_kpis_overview` |
| `general_overview` | Visão Geral | Múltiplos | `get_kpis_overview` |

### Como Funciona o Mapeamento

1. **LLM recebe pergunta** + lista de intenções disponíveis
2. **LLM analisa** e retorna intenção mais adequada
3. **Fallback**: Se LLM não disponível, usa mapeamento por keywords
4. **Contexto**: Considera área atual (página) para melhorar precisão

### Exemplo de Definição

```typescript
analyze_margin_decline: {
  id: 'analyze_margin_decline',
  name: 'Analisar Queda de Margem',
  description: 'Investiga causas de redução de margem (custos, preços, mix)',
  keywords: ['margem', 'lucro', 'custo', 'queda', 'redução', 'declínio'],
  agents: ['custos_margem', 'comercial'],
  requiredFunctions: ['get_margin_by_product', 'get_cost_breakdown', 'get_kpis_overview'],
  optionalFunctions: ['get_sales_mix'],
  expectedOutput: {
    findings: true,
    evidence: true,
    recommendations: true,
    comparisons: true
  }
}
```

---

## ⚠️ Limites e Controles de Intenções

### Intenções Genéricas: Riscos e Mitigações

As intenções genéricas (`identify_root_cause`, `suggest_improvements`, `general_overview`) são úteis, mas apresentam riscos em produção:

#### Riscos Identificados

1. **Respostas vagas**: Podem gerar análises genéricas sem valor
2. **Planos grandes demais**: Alto custo e latência
3. **Risco de "inventar causa"**: Sem evidência suficiente

#### Mitigações Implementadas

##### 1. Limite de Passos por Intenção

```typescript
// Máximo de 5 funções para intenções genéricas
const MAX_STEPS_GENERIC = 5
const MAX_STEPS_SPECIFIC = 10

function getInvestigationPlan(intention: BusinessIntention, ...) {
  const steps = /* ... */
  
  // Limita intenções genéricas
  if (isGenericIntention(intention)) {
    return steps.slice(0, MAX_STEPS_GENERIC)
  }
  
  return steps.slice(0, MAX_STEPS_SPECIFIC)
}
```

##### 2. Regra de Confiança Baixa

Se confiança do mapeamento < 60%:
- **Não retorna resposta genérica**
- **Sugere 2-3 intenções específicas** para o usuário escolher
- **Pede esclarecimento** sobre o que realmente quer analisar

```typescript
if (mappingResult.confidence < 0.6 && isGenericIntention(intention)) {
  return {
    needsClarification: true,
    suggestedIntentions: [
      { id: 'analyze_margin_decline', name: 'Analisar Queda de Margem' },
      { id: 'analyze_revenue_trend', name: 'Analisar Tendência de Receita' }
    ],
    message: 'Sua pergunta pode ter múltiplas interpretações. Qual análise você prefere?'
  }
}
```

##### 3. Planos Curtos e Estritos

Intenções genéricas têm planos **limitados e focados**:

```typescript
general_overview: {
  // Apenas 1 função requerida (não múltiplas)
  requiredFunctions: ['get_kpis_overview'],
  optionalFunctions: [], // Sem opcionais para evitar expansão
  maxSteps: 1 // Limite rígido
}
```

##### 4. Validação de Evidência Mínima

Antes de retornar resposta:
- Verifica se há **pelo menos 2 evidências numéricas**
- Se não houver, retorna mensagem de "dados insuficientes"
- Não inventa causas sem evidência

```typescript
if (evidence.length < 2 && isGenericIntention(intention)) {
  return {
    insufficientData: true,
    message: 'Não há evidências suficientes para uma análise confiável. Tente ser mais específico.'
  }
}
```

---

## 📊 Sistema de Confiança

### Escala Padronizada

A orquestra usa escala **0-100** para confiança:

- **0-59**: Baixa confiança
- **60-79**: Confiança moderada
- **80-100**: Alta confiança

### Regras de Resposta Baseadas em Confiança

#### > 80: Afirmar com Segurança

```typescript
if (confidence > 80) {
  // Pode afirmar causas com segurança
  executive = `Análise identificou ${topCauses.length} causas principais. ${mainCause.cause}.`
}
```

#### 60-80: Usar Linguagem de Probabilidade

```typescript
if (confidence >= 60 && confidence <= 80) {
  // Usa linguagem de probabilidade
  executive = `Análise sugere que ${mainCause.cause} é provável causa. Evidência: ${evidence[0].metric} ${evidence[0].value}.`
}
```

#### < 60: Responder com Limitações

```typescript
if (confidence < 60) {
  // Responde com limitações e pede mais dados
  executive = `Análise preliminar indica possíveis causas, mas há limitações nos dados disponíveis.`
  synthesis.dataLimitations.push('Dados insuficientes para conclusão definitiva')
  synthesis.suggestedActions.push('Solicitar dados adicionais ou período mais específico')
}
```

### Regra: "Sem Evidência Suficiente"

**Não retorna "causa provável" se não houver evidência numérica mínima:**

```typescript
const MIN_EVIDENCE_REQUIRED = 2

if (evidence.length < MIN_EVIDENCE_REQUIRED) {
  // Não inventa causa
  return {
    executive: 'Análise não identificou evidências suficientes para determinar causas.',
    topCauses: [], // Vazio, não inventa
    dataLimitations: ['Evidências numéricas insuficientes'],
    confidence: Math.min(confidence, 50) // Limita confiança
  }
}
```

### Cálculo de Confiança Final

```typescript
function calculateConfidence(
  agentResponses: AgentResponse[],
  intention: BusinessIntention,
  intentionDef: IntentionDefinition,
  llmConfidence: number
): number {
  // Base: confiança do LLM (0-100)
  let confidence = (llmConfidence || 0.5) * 100
  
  // Ajuste por qualidade dos agentes
  const avgAgentConfidence = agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length
  confidence = (confidence + avgAgentConfidence) / 2
  
  // Penaliza se poucas evidências
  const totalEvidence = agentResponses.reduce((sum, r) => sum + r.evidence.length, 0)
  if (totalEvidence < 2) {
    confidence *= 0.7 // Reduz 30%
  }
  
  // Penaliza intenções genéricas
  if (isGenericIntention(intention)) {
    confidence *= 0.9 // Reduz 10%
  }
  
  return Math.round(Math.min(100, Math.max(0, confidence)))
}
```

---

## 🔀 Consolidação de Respostas

### Processo de Consolidação

O **Maestro** consolida respostas de múltiplos agentes em uma resposta única:

#### 1. Filtragem por Relevância

Remove findings/evidence não relevantes à intenção:

```typescript
// Exemplo: Para analyze_revenue_trend
// Remove: findings sobre margem, custos, compras
// Mantém: findings sobre receita, faturamento, evolução
```

#### 2. Priorização

Ordena por:
- Relevância à intenção
- Confiança do agente
- Quantidade de evidências

#### 3. Extração de Top 3 Causas

```typescript
topCauses = [
  { cause: "Custo de MP aumentou 5%", confidence: 85 },
  { cause: "Mix deslocado para produtos de menor margem", confidence: 75 },
  { cause: "Redução de preço de venda", confidence: 65 }
]
```

#### 4. Extração de Evidências

Prioriza evidências relevantes (máx. 5):

```typescript
numericalEvidence = [
  { metric: "Margem Flocão", value: "25.3%", unit: "%", context: "Meta: 28%" },
  { metric: "Custo MP", value: "68%", unit: "%", context: "do custo total" }
]
```

#### 5. Geração de Síntese Executiva

Texto resumido em linguagem natural:

```typescript
executive = "Análise identificou 2 causas principais. Margem do flocão caiu 3.2% vs período anterior. Evidência: Margem Flocão 25.3% (Meta: 28%)."
```

#### 6. Geração de Links de Validação

Links para páginas do BI baseados na intenção (ver seção [Deep Links](#deep-links-e-validação)):

```typescript
validationLinks = [
  { 
    label: "Financeiro", 
    path: "/financeiro?focus=margem_bruta&period=dezembro&produto=flocao",
    kpi: "margem_bruta" 
  },
  { 
    label: "Comercial", 
    path: "/comercial?focus=mix_produtos&period=dezembro",
    kpi: "mix_produtos" 
  }
]
```

#### 7. Estrutura de Ações Sugeridas (Não Executadas)

**Importante**: Ações são **sugestões**, não execuções automáticas.

```typescript
suggestedActions = [
  {
    action: "Revisar negociações com fornecedores de MP",
    priority: "high",
    owner: "Compras", // Responsável sugerido
    estimatedImpact: "Redução potencial de 3-5% no custo de MP", // Se houver base
    requiresApproval: true // Sempre requer aprovação humana
  },
  {
    action: "Ajustar mix para produtos de maior margem",
    priority: "medium",
    owner: "Comercial",
    estimatedImpact: "Aumento potencial de 2% na margem bruta",
    requiresApproval: true
  }
]
```

**Regras:**
- ✅ Todas as ações são **sugestões** (não executadas)
- ✅ Incluem **responsável sugerido** quando possível
- ✅ Incluem **impacto esperado** quando há base numérica
- ✅ Sempre requerem **aprovação humana** antes de executar

---

## 🚨 Sistema de Alertas

### Como Funciona

O sistema de alertas monitora KPIs automaticamente e gera alertas quando detecta desvios:

#### 1. Configuração de Limiares

```typescript
const thresholds = [
  { kpi: 'margem', area: 'Financeiro', warning: 30, critical: 28, direction: 'below' },
  { kpi: 'oee', area: 'Produção', warning: 80, critical: 75, direction: 'below' },
  { kpi: 'otif', area: 'Logística', warning: 95, critical: 92, direction: 'below' }
]
```

#### 2. Detecção de Desvios

```typescript
// Para cada threshold:
1. Busca valor atual do KPI
2. Compara com limiares (warning, critical)
3. Se desvio detectado:
   - Calcula severidade (P0, P1, P2)
   - Estima impacto
   - Gera causa provável
   - Cria alerta
```

#### 3. Classificação de Severidade

- **P0 (Crítico)**: Valor abaixo/acima do limiar crítico
- **P1 (Alto)**: Valor abaixo/acima do limiar de warning
- **P2 (Médio)**: Desvios menores

#### 4. Geração de Causa Provável

```typescript
// Exemplo para margem:
probableCause = "Possível aumento no custo de matéria-prima ou redução no preço de venda"
```

#### 5. Estimativa de Impacto

```typescript
// Exemplo para margem:
impact = "Impacto financeiro estimado de R$ 85.425 no período"
```

### Execução

**Atualmente**: Função manual (`runAlertRoutine()`)

**Futuro**: Cron job ou scheduler que executa periodicamente

### Anti-Ruído: Prevenção de Alertas Excessivos ✅

**Implementado**: Em produção, o maior problema é **alerta demais**. A orquestra implementa:

#### 1. Cooldown (Não Repetir em 24h) ✅

**Implementado**: Não gera o mesmo alerta se já foi gerado nas últimas 24h:

```typescript
// src/services/orchestrator/alerts.ts
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 horas

function isInCooldown(kpiId: string): boolean {
  const history = alertHistory.get(kpiId)
  if (!history) return false
  
  const timeSinceLastAlert = Date.now() - history.lastAlertTimestamp
  return timeSinceLastAlert < COOLDOWN_MS
}

// Verifica antes de gerar alerta
if (isInCooldown(kpi.id)) {
  return null // Não gera alerta duplicado
}
```

#### 2. Detecção por Tendência (3 Pontos Seguidos) ✅

**Implementado**: Só alerta se houver 3 pontos seguidos abaixo/acima do limiar:

```typescript
// src/services/orchestrator/alerts.ts
function checkTrend(kpiId: string, value: number, threshold: Threshold): boolean {
  const history = alertHistory.get(kpiId)
  
  if (!history) {
    // Primeira vez - inicializa histórico
    alertHistory.set(kpiId, {
      kpiId,
      lastAlertTimestamp: 0,
      recentValues: [value]
    })
    return false
  }
  
  // Adiciona valor atual
  history.recentValues.push(value)
  
  // Mantém apenas últimos 3 valores
  if (history.recentValues.length > 3) {
    history.recentValues.shift()
  }
  
  // Precisa de 3 valores para detectar tendência
  if (history.recentValues.length < 3) {
    return false
  }
  
  // Verifica se todos os 3 valores estão abaixo/acima do limiar
  const allBelowThreshold = history.recentValues.every(v => {
    if (threshold.direction === 'below') {
      return v < threshold.critical
    } else {
      return v > threshold.critical
    }
  })
  
  return allBelowThreshold
}

// Para P1, só alerta se for tendência (3 pontos seguidos)
// Para P0, alerta imediatamente
const isTrend = checkTrend(kpi.id, value, threshold)
if (!isTrend && severity === 'P1') {
  return null // Não é tendência, apenas flutuação
}
```

#### 3. Snooze e Acknowledge ✅

**Implementado**: Funções prontas (precisa integração no frontend):

```typescript
// src/services/orchestrator/types.ts
interface IntelligentAlert {
  // ... campos existentes
  snoozedUntil?: string // Usuário silenciou até esta data
  acknowledgedBy?: string // Usuário que reconheceu
  acknowledgedAt?: string
  dataQuality?: 'complete' | 'incomplete' | 'suspicious'
}

// src/services/orchestrator/alerts.ts
export function snoozeAlert(alertId: string, hours: number): void {
  // Em produção, isso atualizaria no banco de dados
  const snoozeUntil = new Date()
  snoozeUntil.setHours(snoozeUntil.getHours() + hours)
  alert.snoozedUntil = snoozeUntil.toISOString()
}

export function acknowledgeAlert(alertId: string, userId: string): void {
  // Em produção, isso atualizaria no banco de dados
  alert.status = 'acknowledged'
  alert.acknowledgedBy = userId
  alert.acknowledgedAt = new Date().toISOString()
}
```

**Funcionalidades:**
- ✅ Usuário pode **snoozar** alerta por X horas/dias (função implementada)
- ✅ Usuário pode **acknowledge** (reconhecer) alerta (função implementada)
- ⚠️ UI para snooze/acknowledge ainda não implementada (funções prontas)

#### 4. Qualidade do Dado ✅

**Implementado**: Validação de qualidade antes de gerar alerta:

```typescript
// src/services/orchestrator/alerts.ts
function validateDataQuality(kpi: { id: string; value: number | string }): 'complete' | 'incomplete' | 'suspicious' {
  // Verifica se valor é válido
  if (typeof kpi.value !== 'number' || isNaN(kpi.value) || !isFinite(kpi.value)) {
    return 'incomplete'
  }
  
  // Verifica se valor está em range razoável
  if (kpi.unit === '%' && (kpi.value < 0 || kpi.value > 100)) {
    return 'suspicious'
  }
  
  // Verifica se valor é muito extremo
  if (kpi.value < -1000 || kpi.value > 10000000) {
    return 'suspicious'
  }
  
  return 'complete'
}

// Não gera alerta se dado incompleto ou suspeito
const dataQuality = validateDataQuality(kpi)
if (dataQuality !== 'complete') {
  return null // Não gera alerta com dado ruim
}
```

#### 5. Agrupamento de Alertas Similares ✅

**Implementado**: Agrupa alertas do mesmo tipo automaticamente:

```typescript
// src/services/orchestrator/alerts.ts
function groupSimilarAlerts(alerts: IntelligentAlert[]): IntelligentAlert[] {
  // Agrupa alertas do mesmo KPI e severidade
  const grouped = new Map<string, IntelligentAlert[]>()
  
  for (const alert of alerts) {
    const key = `${alert.indicator.id}_${alert.severity}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(alert)
  }
  
  // Se há múltiplos alertas do mesmo tipo, agrupa em um único alerta
  const result: IntelligentAlert[] = []
  
  for (const [key, group] of grouped.entries()) {
    if (group.length === 1) {
      result.push(group[0])
    } else {
      // Agrupa múltiplos alertas similares
      const firstAlert = group[0]
      const count = group.length
      
      result.push({
        ...firstAlert,
        probableCause: `${firstAlert.probableCause} (${count} ocorrências similares)`,
        impact: {
          ...firstAlert.impact,
          estimated: `${firstAlert.impact.estimated} (${count} alertas similares detectados)`
        }
      })
    }
  }
  
  return result
}
```

---

## 📋 Sistema de Casos Operacionais

### O Que São Casos?

Casos são **investigações estruturadas** que transformam análises da orquestra em **operações reais** com validação humana.

### Estrutura de um Caso

```typescript
interface OperationalCase {
  id: string
  title: string
  timestamp: string
  status: 'aberto' | 'em_investigacao' | 'validado' | 'resolvido'
  source: 'alert' | 'manual' | 'routine' // Origem do caso
  
  // Hipóteses levantadas pela orquestra
  hypotheses: Array<{
    id: string
    hypothesis: string
    confidence: number
    status: 'pending' | 'confirmed' | 'rejected' // Validação humana
    evidence: string[]
  }>
  
  // Dados consultados (auditoria)
  dataConsulted: Array<{
    function: string
    parameters: Record<string, unknown>
    timestamp: string
    result: unknown
  }>
  
  // Evidências coletadas
  evidence: Array<{
    id: string
    type: 'metric' | 'trend' | 'comparison'
    description: string
    value: number | string
    source: string
  }>
  
  // Checklist de validação humana
  validationChecklist: Array<{
    id: string
    item: string
    checked: boolean
    checkedBy?: string
    checkedAt?: string
  }>
  
  // Resposta original da orquestra
  orchestratorResponse?: OrchestratorResponse
  
  // Metadados
  assignee?: string // Responsável pelo caso
  tags?: string[] // Tags para organização
  relatedKpis?: string[] // KPIs relacionados
  relatedEntities?: Record<string, string> // Entidades (produto, período, etc.)
}
```

### Fluxo de um Caso

1. **Criação**: Caso criado a partir de:
   - Alerta detectado
   - Pergunta do usuário que gerou investigação
   - Rotina automática

2. **Investigação**: Orquestra gera:
   - Hipóteses
   - Evidências
   - Dados consultados

3. **Validação Humana**: Usuário:
   - Valida/rejeita hipóteses
   - Marca checklist
   - Adiciona comentários

4. **Resolução**: Caso marcado como resolvido quando:
   - Hipóteses validadas
   - Ações tomadas
   - Problema resolvido

### Histórico de Validações

Todas as validações humanas são registradas:

```typescript
interface ValidationHistory {
  timestamp: string
  user: string
  action: 'hypothesis_confirmed' | 'hypothesis_rejected' | 'checklist_checked'
  details: {
    hypothesisId?: string
    checklistId?: string
    comment?: string
  }
}
```

### Exemplo de Caso

```typescript
{
  id: "case_1234567890",
  title: "Queda de Margem - Flocão (Dezembro)",
  status: "em_investigacao",
  source: "alert",
  hypotheses: [
    {
      id: "hyp_1",
      hypothesis: "Custo de matéria-prima aumentou 5%",
      confidence: 85,
      status: "pending",
      evidence: ["Margem Flocão: 25.3% (Meta: 28%)", "Custo MP: 68% do total"]
    }
  ],
  validationChecklist: [
    {
      id: "check_1",
      item: "Verificar variação de preço de MP com fornecedores",
      checked: false
    },
    {
      id: "check_2",
      item: "Validar dados de custo no sistema",
      checked: true,
      checkedBy: "João Silva",
      checkedAt: "2024-01-15T10:30:00Z"
    }
  ],
  assignee: "Maria Santos",
  tags: ["margem", "flocão", "custo"],
  relatedKpis: ["margem_bruta", "custo_mp"],
  relatedEntities: {
    produto: "flocão",
    periodo: "dezembro"
  }
}
```

---

## 📊 Estrutura de Dados

### AskRequest (Entrada)

```typescript
interface AskRequest {
  question: string
  context?: {
    area?: string      // Área atual (home, compras, producao, etc.)
    unit?: string      // Unidade de negócio
    line?: string      // Linha de produção
    product?: string   // Produto específico
  }
}
```

### OrchestratorResponse (Saída)

```typescript
interface OrchestratorResponse {
  id: string
  timestamp: string
  question: string
  plan: InvestigationPlan
  synthesis: {
    executive: string
    topCauses: Array<{ cause: string; confidence: number }>
    numericalEvidence: Array<{ metric: string; value: string; unit?: string }>
    suggestedActions: Array<{ 
      action: string
      priority: 'high' | 'medium' | 'low'
      owner?: string // Responsável sugerido
      estimatedImpact?: string // Impacto esperado
      requiresApproval: boolean // Sempre true
    }>
    validationLinks: Array<{ label: string; path: string; kpi?: string }>
    dataLimitations: string[]
  }
  agentResponses: AgentResponse[]
  confidence: number
  audit: {
    functionsCalled: Array<{ function: string; parameters: object; timestamp: string }>
    duration: number
    cost: number
    mapping: { intent: string; confidence: number; entities: object }
  }
}
```

### AgentResponse

```typescript
interface AgentResponse {
  agent: AgentType
  confidence: number
  findings: string[]
  evidence: Array<{
    metric: string
    value: string | number
    comparison?: string
    source: string
  }>
  recommendations: string[]
  limitations: string[]
}
```

---

## 🖱️ Contrato de Interação do Usuário

### Endpoints da API

#### 1. Assistente (Chat)

**Endpoint**: `POST /api/orchestrator/ask`

**Request:**
```typescript
{
  question: string
  context?: {
    area?: string
    unit?: string
    line?: string
    product?: string
  }
}
```

**Response:** `OrchestratorResponse`

**Uso no Frontend:**
```typescript
// Tela Assistente (ChatWidget)
const response = await askOrchestrator({
  question: "Por que a margem caiu?",
  context: { area: "financeiro" }
})
```

#### 2. Alertas Inteligentes

**Endpoint**: `GET /api/orchestrator/alerts`

**Query Params:**
- `severity?: 'P0' | 'P1' | 'P2'`
- `status?: 'new' | 'acknowledged' | 'resolved'`
- `area?: string`

**Response:** `IntelligentAlert[]`

**Uso no Frontend:**
```typescript
// Tela Alertas
const alerts = await getAlerts({ severity: 'P0' })
```

#### 3. Casos Operacionais

**Endpoints:**
- `GET /api/orchestrator/cases` - Lista casos
- `GET /api/orchestrator/cases/:id` - Detalhes do caso
- `POST /api/orchestrator/cases/:id/validate` - Validar caso

**Uso no Frontend:**
```typescript
// Tela Casos
const cases = await getCases()
const case_ = await getCase(caseId)
await validateCase({ caseId, hypothesisId, validated: true })
```

### Ações do Usuário Após Resposta

Após receber uma resposta da orquestra, o usuário pode:

#### 1. **Abrir Caso**

```typescript
// Converte resposta da orquestra em caso operacional
const createCaseFromResponse = (response: OrchestratorResponse) => {
  return {
    title: `Investigação: ${response.question}`,
    orchestratorResponse: response,
    hypotheses: response.synthesis.topCauses.map(c => ({
      hypothesis: c.cause,
      confidence: c.confidence,
      status: 'pending'
    })),
    // ...
  }
}
```

#### 2. **Ver Evidências no BI** (Deep Links)

```typescript
// Clique em "Ver no BI" → Navega com filtros aplicados
response.synthesis.validationLinks.forEach(link => {
  // Navega para link.path com filtros
  navigate(link.path) // Ex: /financeiro?focus=margem_bruta&period=dezembro
})
```

#### 3. **Gerar Relatório**

```typescript
// Exporta resposta como PDF/Excel
const exportReport = (response: OrchestratorResponse) => {
  // Gera relatório com:
  // - Síntese executiva
  // - Top causas
  // - Evidências
  // - Ações sugeridas
}
```

#### 4. **Criar Ticket** (Manual)

```typescript
// Integração com sistema de tickets (futuro)
const createTicket = (response: OrchestratorResponse) => {
  return {
    title: response.question,
    description: response.synthesis.executive,
    priority: response.confidence > 80 ? 'high' : 'medium',
    // ...
  }
}
```

### Fluxo Completo de Interação

```
1. Usuário faz pergunta no chat
   ↓
2. Orquestra retorna resposta
   ↓
3. Usuário pode:
   - ✅ Abrir Caso (investigação estruturada)
   - ✅ Ver no BI (deep link com filtros)
   - ✅ Gerar Relatório (PDF/Excel)
   - ✅ Criar Ticket (integração futura)
   - ✅ Fazer nova pergunta relacionada
```

---

## 🔗 Deep Links e Validação

### Padrão de Deep Links

Os links de validação seguem um **padrão consistente** com query parameters:

#### Formato

```
/{area}?focus={kpi}&period={periodo}&{entidade}={valor}
```

#### Exemplos

```typescript
// Financeiro com foco em margem
"/financeiro?focus=margem_bruta&period=dezembro&produto=flocao"

// Comercial com foco em mix
"/comercial?focus=mix_produtos&period=dezembro"

// Produção com foco em OEE
"/producao?focus=oee&period=dezembro&line=Linha%201"

// Compras com foco em OTD
"/compras?focus=otd&period=dezembro&fornecedor=Farinha%20Trigo"
```

#### Implementação no Backend ✅

**Implementado**: Função `generateDeepLink` no Maestro:

```typescript
// src/services/orchestrator/maestro.ts
function generateDeepLink(
  label: string,
  path: string,
  kpi?: string,
  context?: Record<string, unknown>
): { label: string; path: string; kpi?: string } {
  const params = new URLSearchParams()
  
  if (kpi) {
    params.set('focus', kpi)
  }
  
  // Adiciona parâmetros do contexto
  if (context?.periodo) {
    params.set('period', String(context.periodo))
  } else if (context?.period) {
    params.set('period', String(context.period))
  }
  
  if (context?.produto) {
    params.set('produto', String(context.produto))
  }
  
  if (context?.line || context?.linha) {
    params.set('line', String(context.line || context.linha))
  }
  
  if (context?.fornecedor) {
    params.set('fornecedor', String(context.fornecedor))
  }
  
  // Constrói path com query params
  const queryString = params.toString()
  const fullPath = queryString ? `${path}?${queryString}` : path
  
  return {
    label,
    path: fullPath,
    kpi
  }
}

// Uso
const link = generateDeepLink('Financeiro', '/financeiro', 'margem_bruta', {
  period: 'dezembro',
  produto: 'flocao'
})
// Resultado: { label: 'Financeiro', path: '/financeiro?focus=margem_bruta&period=dezembro&produto=flocao', kpi: 'margem_bruta' }
```

#### Aplicação de Filtros no Frontend ✅

**Implementado**: As páginas do BI leem os query parameters e aplicam filtros automaticamente usando o hook `useDeepLinkFilters`:

```typescript
// Hook customizado: src/hooks/useDeepLinkFilters.ts
import { useDeepLinkFilters, useHighlightKPI } from '../hooks/useDeepLinkFilters'

// Na página Financeiro (e outras páginas)
const Financeiro = () => {
  // Lê filtros da URL automaticamente
  const filters = useDeepLinkFilters()
  const highlightedKpi = useHighlightKPI(filters.focusKpi)
  
  // Aplica período se vier do deep link
  const [selectedPeriod, setSelectedPeriod] = useState(filters.period)
  
  useEffect(() => {
    if (filters.period) {
      setSelectedPeriod(filters.period)
    }
  }, [filters.period])
  
  // KPIs são destacados automaticamente
  return (
    <div>
      {financeiroKPIs.map((kpi) => {
        const isHighlighted = highlightedKpi === kpi.id
        return (
          <div
            key={kpi.id}
            id={`kpi-${kpi.id}`}
            className={isHighlighted ? 'transition-all duration-300' : ''}
          >
            <KPICard {...kpi} variant={isHighlighted ? 'highlight' : 'default'} />
          </div>
        )
      })}
    </div>
  )
}
```

**Funcionalidades**:
- ✅ Lê `focus`, `period`, `produto`, `line`, `fornecedor` da URL
- ✅ Destaca KPI automaticamente quando `focus` está presente
- ✅ Faz scroll automático para o KPI destacado
- ✅ Aplica ring visual temporário (3 segundos)
- ✅ Integrado em todas as páginas principais (Financeiro, Comercial, Produção, Compras, Estoque, Logística)

---

## 💾 Cache e Rate Limiting

### Cache do LLM Mapper ✅

**Implementado**: Para evitar custos e latência, o mapeamento LLM é **cacheado** (TTL de 5 minutos):

#### Implementação

```typescript
interface CacheEntry {
  question: string // Pergunta normalizada
  context: Record<string, unknown>
  result: LLMMappingResult
  timestamp: number
  ttl: number // Time to live (5 minutos)
}

const cache = new Map<string, CacheEntry>()

function normalizeQuestion(question: string): string {
  // Remove espaços extras, lowercase, remove pontuação
  return question.toLowerCase().trim().replace(/[^\w\s]/g, '')
}

function getCacheKey(question: string, context?: Record<string, unknown>): string {
  const normalized = normalizeQuestion(question)
  const contextStr = JSON.stringify(context || {})
  return `${normalized}::${contextStr}`
}

export async function mapQuestionToIntentionWithLLM(
  question: string,
  context?: Record<string, unknown>
): Promise<LLMMappingResult> {
  const cacheKey = getCacheKey(question, context)
  const cached = cache.get(cacheKey)
  
  // Verifica se cache é válido (TTL de 5 minutos)
  if (cached && (Date.now() - cached.timestamp < cached.ttl)) {
    if (import.meta.env.DEV) {
      console.log('💾 Cache hit:', cacheKey.substring(0, 50))
    }
    return cached.result
  }
  
  // Cache miss - chama LLM
  const result = await mapWithLLM(question, context)
  
  // Salva no cache
  cache.set(cacheKey, {
    question: normalizeQuestion(question),
    context: context || {},
    result,
    timestamp: Date.now(),
    ttl: 5 * 60 * 1000 // 5 minutos
  })
  
  return result
}
```

### Rate Limiting por Usuário

**Implementação Futura:**

```typescript
interface RateLimit {
  userId: string
  requests: number
  windowStart: number
  limit: number // Ex: 30 req/min
}

const rateLimits = new Map<string, RateLimit>()

function checkRateLimit(userId: string): boolean {
  const limit = rateLimits.get(userId) || {
    userId,
    requests: 0,
    windowStart: Date.now(),
    limit: 30 // 30 req/min
  }
  
  // Reset se janela expirou (1 minuto)
  if (Date.now() - limit.windowStart > 60 * 1000) {
    limit.requests = 0
    limit.windowStart = Date.now()
  }
  
  if (limit.requests >= limit.limit) {
    return false // Rate limit excedido
  }
  
  limit.requests++
  rateLimits.set(userId, limit)
  return true
}
```

### Fallback Automático

Se LLM falhar ou rate limit excedido:

```typescript
try {
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit excedido')
  }
  
  return await mapWithLLM(question, context)
} catch (error) {
  // Sempre tem fallback
  console.warn('⚠️ LLM falhou, usando fallback (keywords):', error)
  
  // Registra no audit que foi fallback
  audit.mapping.fallback = true
  audit.mapping.fallbackReason = error.message
  
  return mapWithKeywords(question, context)
}
```

---

## 🚀 Uso Prático

### No Frontend ✅

O frontend **sempre chama a API do backend** (seguro):

```typescript
import { askOrchestrator } from './services/orchestrator/api'

// Fazer pergunta (chama /api/orchestrator/ask no backend)
const response = await askOrchestrator({
  question: "Por que a margem do flocão caiu em dezembro?",
  context: {
    area: "financeiro"
  }
})

// Usar resposta
console.log(response.synthesis.executive)
console.log(response.synthesis.topCauses)
console.log(response.synthesis.numericalEvidence)
console.log(response.synthesis.suggestedActions)
```

**Implementação interna** (`src/services/orchestrator/api.ts`):

```typescript
export async function askOrchestrator(request: AskRequest): Promise<OrchestratorResponse> {
  // Sempre chama a API do backend (Vercel Serverless Function)
  const response = await fetch('/api/orchestrator/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return await response.json()
}
```

### No Chat Widget

O `ChatWidget` usa automaticamente a orquestra:

```typescript
// ChatWidget.tsx
const response = await askOrchestrator({
  question: input,
  context: {
    area: currentArea  // Detecta automaticamente da rota
  }
})
```

### No Backend (Vercel Serverless Function)

A função `api/orchestrator/ask.ts` executa a orquestração:

```typescript
// api/orchestrator/ask.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validação
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Executa orquestração (API key segura em process.env.GROQ_API_KEY)
  const { orchestrate } = await import('../../src/services/orchestrator/maestro')
  const response = await orchestrate(req.body)
  
  res.status(200).json(response)
}
```

---

## 🔮 Próximos Passos

### Fase Atual (Mock)
- ✅ Estrutura completa implementada
- ✅ Agentes funcionando com dados mockados
- ✅ UI completa e integrada
- ✅ Sistema de intenções funcionando
- ✅ Consolidação de respostas implementada

### Fase Pós-Migração (SQL)
1. Criar views/procedures SQL para cada função semântica
2. Substituir `AdapterMock` por `AdapterSQL`
3. Manter os mesmos contratos (sem refatoração estrutural)
4. Testar com dados reais

### Status de Implementação

⚠️ **IMPORTANTE**: Este README documenta a **arquitetura completa** e o que **deveria** estar implementado. Nem todas as funcionalidades estão implementadas no código.

**Consulte [STATUS_IMPLEMENTACAO.md](./STATUS_IMPLEMENTACAO.md) para detalhes do que está implementado vs documentado.**

#### Implementado ✅
- ✅ Estrutura base (Maestro, Agentes, Intenções)
- ✅ Sistema de confiança completo (regras por faixa: 0-59, 60-80, 80-100)
- ✅ Consolidação de respostas
- ✅ Sistema de alertas completo com anti-ruído
- ✅ Links de validação com query parameters
- ✅ Deep links aplicados no frontend (hook `useDeepLinkFilters`)
- ✅ Fallback automático para keywords
- ✅ Sistema de casos operacionais (estrutura)
- ✅ Allowlist de funções (validação técnica)
- ✅ Limites de intenções genéricas (MAX_STEPS)
- ✅ Cache do LLM mapper (TTL 5 minutos)
- ✅ Validação de evidência mínima
- ✅ Anti-ruído em alertas (cooldown, tendência, qualidade do dado, agrupamento)
- ✅ Ações sugeridas completas (`owner`, `estimatedImpact`, `requiresApproval`)

#### Parcialmente Implementado 🟡
- 🟡 UI para snooze/acknowledge (funções implementadas, falta interface no frontend)
- 🟡 RBAC (perfis de usuário) - estrutura básica, falta sistema completo
- 🟡 Cache persistente (atualmente em memória, ideal: Redis/Supabase)

#### Apenas Documentado ❌
- ❌ Rate limiting por usuário (depende de sistema de usuários)
- ❌ Auditoria completa de chamadas LLM (provider/model/latency)

#### Planejado 📋
- 📋 Rotinas automáticas com cron jobs
- 📋 Integração com LLM real (OpenAI, Anthropic, Groq)
- 📋 Cache de respostas completas
- 📋 Agrupamento de alertas similares
- 📋 Exportação de relatórios (PDF/Excel)
- 📋 Dashboard de meta-KPIs da orquestra
- 📋 Histórico de perguntas e respostas

---

## 📝 Conclusão

A **Orquestra de Agentes de IA** é uma arquitetura robusta e governável que:

✅ **Complementa** o BI tradicional com inteligência  
✅ **Investiga automaticamente** causas de problemas  
✅ **Fornece evidências** para todas as respostas  
✅ **É auditável** e previsível  
✅ **Não depende** de "criatividade" do LLM  
✅ **É manutenível** e extensível  

**BI mostra números.**  
**Orquestra explica, investiga e prioriza.**  
**Humanos decidem.**

---

## 📚 Referências

- [ORQUESTRA_README.md](./ORQUESTRA_README.md) - README original
- [PRINCIPIOS_ARQUITETURA.md](./PRINCIPIOS_ARQUITETURA.md) - Princípios fundamentais
- [ARQUITETURA_INTENCOES.md](./ARQUITETURA_INTENCOES.md) - Arquitetura de intenções

