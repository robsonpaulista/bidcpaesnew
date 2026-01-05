# 🔒 Correções de Segurança Críticas - LLM Mapper

## 🚨 Problema Identificado

O código estava rodando no **frontend (Vite)**, expondo a API key do Groq:
- ❌ `VITE_LLM_API_KEY` é injetada no bundle do cliente
- ❌ Qualquer pessoa pode inspecionar e reutilizar a key
- ❌ Perda de governança (rate limit, cache central, auditoria)

## ✅ Solução Implementada

### 1. Backend (Vercel Serverless Functions)

Criada a estrutura de API routes:
- `api/orchestrator/ask.ts` - Serverless function do Vercel
- Roda no **backend** (seguro)
- API key fica em `process.env.GROQ_API_KEY` (não exposta)

### 2. Frontend Atualizado

- `src/services/orchestrator/api.ts` agora chama `/api/orchestrator/ask`
- Remove execução local da orquestração
- Fallback apenas em desenvolvimento

### 3. Correções Críticas no Parser

#### A) Confidence (nullish coalescing)
```typescript
// ANTES (ERRADO):
confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8))

// DEPOIS (CORRETO):
const rawC = parsed.confidence ?? 0.8
const c = Number(rawC)
confidence: Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 0.8
```

#### B) Parse JSON (sem regex primeiro)
```typescript
// ANTES: regex primeiro
const jsonMatch = content.match(/\{[\s\S]*\}/)

// DEPOIS: JSON.parse direto (já força JSON com response_format)
try {
  parsed = JSON.parse(content)
} catch {
  // Fallback regex apenas se necessário
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  ...
}
```

#### C) Validação de Entities
```typescript
// Valida que entities é objeto válido
const entities = (typeof parsed.entities === 'object' && parsed.entities !== null && !Array.isArray(parsed.entities))
  ? parsed.entities
  : {}
```

### 4. Timeout e AbortController

Adicionado timeout de 3 segundos:
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 3000)
```

## 📋 Configuração no Vercel

### Variáveis de Ambiente

No Vercel Dashboard → Settings → Environment Variables:

```
GROQ_API_KEY=gsk_...
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
```

**IMPORTANTE**: 
- ❌ NÃO use `VITE_LLM_API_KEY` (expõe no frontend)
- ✅ Use `GROQ_API_KEY` ou `LLM_API_KEY` (seguro no backend)

### Deploy

```bash
vercel deploy
```

O Vercel automaticamente detecta a pasta `api/` e cria Serverless Functions.

## 🔍 Verificação

1. **Frontend não tem acesso à key**:
   - Inspecione o bundle: `dist/assets/*.js`
   - Procure por "gsk_" ou "GROQ_API_KEY"
   - Não deve encontrar nada

2. **Backend tem acesso**:
   - Logs do Vercel Functions
   - `process.env.GROQ_API_KEY` existe no backend

3. **API funciona**:
   - Teste: `POST /api/orchestrator/ask`
   - Deve retornar resposta da orquestração

## ⚠️ Próximos Passos (Recomendados)

1. **Cache no Backend**: Redis (Upstash) ou Supabase
2. **Auditoria**: Log de todas as chamadas LLM (provider/model/latency)
3. **Rate Limiting**: Por usuário/IP no backend
4. **Normalização de Entidades**: Função `normalizeEntities()` no maestro

## 📝 Arquivos Modificados

- ✅ `api/orchestrator/ask.ts` (novo)
- ✅ `src/services/orchestrator/llm-mapper.ts` (correções)
- ✅ `src/services/orchestrator/api.ts` (chama API)
- ✅ `vercel.json` (configuração de functions)



