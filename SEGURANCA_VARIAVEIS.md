# 🔐 Segurança de Variáveis de Ambiente

## ⚠️ IMPORTANTE: Variáveis com `VITE_` são EXPOSTAS no Frontend

Qualquer variável com prefixo `VITE_` é **injetada no bundle do cliente** e pode ser vista por qualquer pessoa que inspecionar o código.

---

## ✅ SEGURO: Pode usar `VITE_` (Público)

### `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

**✅ SEGURO** - A chave `anon` do Supabase é **feita para ser pública**.

- É uma chave de **leitura pública** com permissões limitadas
- O Supabase usa **Row Level Security (RLS)** para proteger dados
- Mesmo que alguém veja a chave, não consegue acessar dados protegidos
- É o padrão do Supabase para aplicações frontend

**Onde usar:**
- Frontend (React/Vite)
- Bundle do cliente

---

## 🚫 NUNCA use `VITE_` (Secreto)

### ❌ `GROQ_API_KEY` / `LLM_API_KEY`

**🚫 NUNCA** coloque prefixo `VITE_` em chaves de API secretas!

- Chaves de API são **secretas** e devem ficar **apenas no backend**
- Se expostas, qualquer pessoa pode usar sua quota/cota
- Podem gerar custos não autorizados

**Como usar corretamente:**
```env
# ✅ CORRETO (Backend - Vercel)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# ❌ ERRADO (Nunca faça isso!)
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```

**Onde usar:**
- Apenas em **serverless functions** (`api/orchestrator/ask.ts`)
- Acesse via `process.env.GROQ_API_KEY` (não `import.meta.env`)

---

### ❌ `SUPABASE_SERVICE_ROLE_KEY`

**🚫 NUNCA** coloque prefixo `VITE_` na service role key!

- A service role key **bypassa todas as políticas RLS**
- Tem acesso total ao banco de dados
- É equivalente a ter acesso root

**Como usar corretamente:**
```env
# ✅ CORRETO (Backend - Vercel)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)

# ❌ ERRADO (Nunca faça isso!)
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Onde usar:**
- Apenas em **serverless functions** que precisam de acesso administrativo
- Acesse via `process.env.SUPABASE_SERVICE_ROLE_KEY`

---

### ❌ `ROUTINES_AUTH_TOKEN`

**🚫 NUNCA** coloque prefixo `VITE_` no token de autenticação!

- É usado para proteger endpoints administrativos
- Se exposto, qualquer pessoa pode executar rotinas automáticas

**Como usar corretamente:**
```env
# ✅ CORRETO (Backend - Vercel)
ROUTINES_AUTH_TOKEN=seu_token_secreto_32_chars

# ❌ ERRADO (Nunca faça isso!)
VITE_ROUTINES_AUTH_TOKEN=seu_token_secreto
```

---

## 📋 Resumo: O que vai onde

### Frontend (com `VITE_` - Público)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (anon key)
```

### Backend (sem `VITE_` - Secreto)
```env
# Mesmos valores do frontend (para serverless functions)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (anon key)

# Chaves secretas (APENAS backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
ROUTINES_AUTH_TOKEN=seu_token_secreto
```

---

## 🔍 Como Verificar se Está Seguro

### 1. Inspecione o Bundle

Após fazer build:
```bash
npm run build
```

Procure no arquivo `dist/assets/index-*.js`:
- ✅ Deve conter `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- ❌ **NÃO** deve conter `GROQ_API_KEY`
- ❌ **NÃO** deve conter `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **NÃO** deve conter `ROUTINES_AUTH_TOKEN`

### 2. Console do Navegador

Abra DevTools → Console → Network:
- ✅ Requests para Supabase devem usar `anon` key
- ❌ **NUNCA** deve aparecer `service_role` key
- ❌ **NUNCA** deve aparecer `GROQ_API_KEY`

---

## 🛡️ Arquitetura Segura

```
┌─────────────────┐
│   FRONTEND       │
│   (React/Vite)   │
│                  │
│  VITE_* apenas   │
│  (público)       │
└────────┬─────────┘
         │
         │ POST /api/orchestrator/ask
         │
         ▼
┌─────────────────┐
│   BACKEND       │
│   (Vercel)       │
│                  │
│  process.env.*  │
│  (secreto)       │
│                  │
│  - GROQ_API_KEY │
│  - SERVICE_KEY  │
└─────────────────┘
```

**Fluxo:**
1. Frontend chama `/api/orchestrator/ask` (sem chaves)
2. Backend usa `process.env.GROQ_API_KEY` (seguro)
3. Backend retorna resposta (sem expor chaves)

---

## ⚠️ Checklist de Segurança

Antes de fazer deploy:

- [ ] ✅ `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configuradas (seguro)
- [ ] ✅ `GROQ_API_KEY` configurada **SEM** `VITE_` (seguro)
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` configurada **SEM** `VITE_` (seguro)
- [ ] ✅ `ROUTINES_AUTH_TOKEN` configurado **SEM** `VITE_` (seguro)
- [ ] ❌ **NÃO** há `VITE_GROQ_API_KEY` no código
- [ ] ❌ **NÃO** há `VITE_SUPABASE_SERVICE_ROLE_KEY` no código
- [ ] ❌ **NÃO** há `VITE_ROUTINES_AUTH_TOKEN` no código

---

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)



