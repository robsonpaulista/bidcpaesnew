# 🚀 Correções Críticas para Produção

## ✅ Implementado

### 1. Cache Persistente (Redis ou Fallback)

**Problema**: Cache em memória (`Map`) não é confiável em serverless (cold starts, múltiplas instâncias).

**Solução**:
- ✅ Cache Redis (Upstash) como primário
- ✅ Fallback em memória (best-effort)
- ✅ TTL de 5 minutos
- ✅ Normalização de chaves

**Arquivo**: `src/services/orchestrator/cache.ts`

**Configuração no Vercel**:
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Uso**:
```typescript
import { getCachedMapping, setCachedMapping } from './cache'

// Lê cache
const cached = await getCachedMapping(question, context)
if (cached) return cached

// Salva cache
await setCachedMapping(question, context, result)
```

### 2. Rate Limiting no Endpoint

**Problema**: Endpoint `/api/orchestrator/ask` exposto e pode ser abusado.

**Solução**:
- ✅ Rate limit por IP (fallback)
- ✅ Rate limit por userId quando existir (melhor)
- ✅ Upstash Rate Limit (produção)
- ✅ Fallback em memória
- ✅ Headers de rate limit (`X-RateLimit-*`)

**Arquivo**: `src/services/orchestrator/rate-limit.ts`

**Configuração**:
- 30 requisições por minuto (configurável)
- Identificador: IP ou userId (header `X-User-Id` ou `X-App-Token`)

**Implementado em**: `api/orchestrator/ask.ts`

### 3. Sanitização/Normalização de Entidades

**Problema**: LLM pode retornar entidades malformadas:
- `periodo: "dezembro do ano retrasado"`
- `produto: "flocão!!!"`
- `linha: "linha 1; drop table"`

**Solução**:
- ✅ Normalização de strings (remove caracteres perigosos)
- ✅ Validação contra catálogos (KPIs, produtos, linhas, áreas)
- ✅ Fuzzy matching para produtos
- ✅ Extração de período (mês/ano)
- ✅ Penalidade de confiança se entidades inválidas
- ✅ Warnings adicionados a `dataLimitations`

**Arquivo**: `src/services/orchestrator/entity-normalizer.ts`

**Catálogos** (em produção, viriam do banco):
- `VALID_KPIS`: margem, oee, otif, etc.
- `VALID_PRODUTOS`: flocão, farinha, etc.
- `VALID_LINHAS`: Linha 1, Linha 2, etc.
- `VALID_AREAS`: financeiro, comercial, etc.

**Uso**:
```typescript
import { normalizeEntities } from './entity-normalizer'

const result = normalizeEntities(mappingResult.entities)
// result.entities: entidades normalizadas
// result.warnings: avisos de entidades inválidas
// result.confidencePenalty: penalidade (0-0.3)
```

### 4. Budget por Request

**Problema**: Sem limites, pode explodir custo/latência.

**Solução**:
- ✅ `MAX_AGENTS_PER_REQUEST = 3`
- ✅ `MAX_FUNCTIONS_TOTAL = 8`
- ✅ `GLOBAL_TIMEOUT_MS = 4000` (4 segundos)
- ✅ `FUNCTION_TIMEOUT_MS = 800` (800ms por função)
- ✅ Validação antes de executar
- ✅ Timeout por função (Promise.race)
- ✅ Timeout global (AbortController)

**Implementado em**: `src/services/orchestrator/maestro.ts`

**Auditoria**:
```typescript
audit.budget = {
  agentsUsed: 2,
  maxAgents: 3,
  functionsUsed: 5,
  maxFunctions: 8
}
```

## 📋 Configuração no Vercel

### Variáveis de Ambiente

```
# LLM
GROQ_API_KEY=gsk_...
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Rate Limit (usa mesmo Redis do Upstash)
# (já configurado acima)
```

### Setup Upstash Redis

1. Acesse: https://upstash.com/
2. Crie um banco Redis
3. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
4. Configure no Vercel Dashboard → Settings → Environment Variables

## 🔍 Verificação

### 1. Cache Funcionando

```bash
# Teste local (sem Redis, usa memória)
npm run dev

# Teste produção (com Redis)
vercel deploy
```

### 2. Rate Limiting Funcionando

```bash
# Teste: 31 requisições em 1 minuto
for i in {1..31}; do
  curl -X POST http://localhost:3000/api/orchestrator/ask \
    -H "Content-Type: application/json" \
    -d '{"question":"test"}'
done

# 31ª deve retornar 429
```

### 3. Normalização Funcionando

```typescript
// Teste
const result = normalizeEntities({
  produto: "flocão!!!",
  periodo: "dezembro do ano retrasado",
  linha: "linha 1; drop table"
})

// Deve retornar:
// - entities.produto: "flocão" (normalizado)
// - entities.periodo: "dezembro" (extraído)
// - entities.linha: "Linha 1 - Francês" (validado)
// - warnings: ["Período não reconhecido: ..."]
```

### 4. Budget Funcionando

```typescript
// Teste: plano com 10 funções deve falhar
const plan = getInvestigationPlan('general_overview', '...', {})
// Se plan.length > 8, deve lançar erro
```

## ⚠️ Próximos Passos (Opcional)

1. **Catálogos do Banco**: Mover `VALID_*` para queries SQL
2. **Rate Limit Avançado**: Usar `@upstash/ratelimit` (mais robusto)
3. **Cache Avançado**: Cache de respostas completas (não só mapping)
4. **Auditoria Completa**: Log de todas as chamadas LLM (provider/model/latency)

## 📝 Arquivos Criados/Modificados

- ✅ `src/services/orchestrator/cache.ts` (novo)
- ✅ `src/services/orchestrator/rate-limit.ts` (novo)
- ✅ `src/services/orchestrator/entity-normalizer.ts` (novo)
- ✅ `src/services/orchestrator/llm-mapper.ts` (integra cache)
- ✅ `src/services/orchestrator/maestro.ts` (normalização + budget)
- ✅ `api/orchestrator/ask.ts` (rate limiting)



