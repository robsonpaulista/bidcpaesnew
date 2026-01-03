# 🔐 Variáveis de Ambiente - Vercel

## 📋 Lista Completa de Variáveis

### ✅ OBRIGATÓRIAS (para funcionamento básico)

#### 1. Supabase (Frontend + Backend)
```env
# Frontend (VITE_ prefixo - expostas no bundle)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend (sem VITE_ - seguras, apenas serverless)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Onde encontrar:**
- Supabase Dashboard → Settings → API
- `anon/public` = chave pública (pode ir no frontend)
- `service_role` = chave secreta (APENAS backend, nunca no frontend!)

---

#### 2. LLM (Groq) - Backend
```env
# API Key do Groq (para mapeamento de intenções)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcional: Configurações do LLM
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant
```

**Onde encontrar:**
- https://console.groq.com/keys
- Crie uma API Key e copie

---

#### 3. Proteção de Endpoints
```env
# Token para proteger /api/orchestrator/run-routines
ROUTINES_AUTH_TOKEN=seu_token_secreto_aqui
```

**Como gerar:**
```bash
# No terminal (Linux/Mac)
openssl rand -hex 32

# Ou use um gerador online
# https://randomkeygen.com/
```

**Exemplo:** `ROUTINES_AUTH_TOKEN=abc123xyz789_secreto_qualquer_32_chars`

---

### ⚙️ OPCIONAIS (para funcionalidades avançadas)

#### 4. Upstash Redis (Cache + Rate Limiting)
```env
# Cache persistente (substitui Map em memória)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxx

# Nota: Se não configurar, usa fallback em memória (funciona, mas não persiste)
```

**Onde encontrar:**
- https://console.upstash.com/
- Crie um banco Redis
- Copie REST URL e REST Token

---

## 🎯 Configuração no Vercel

### Passo a Passo

1. **Acesse o Dashboard do Vercel**
   - https://vercel.com/dashboard
   - Selecione seu projeto

2. **Vá em Settings → Environment Variables**

3. **Adicione cada variável:**
   - **Name**: Nome da variável (ex: `VITE_SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione onde aplicar
     - ✅ **Production** (obrigatório)
     - ✅ **Preview** (recomendado)
     - ✅ **Development** (opcional, para testar localmente)

4. **Salve e faça redeploy**
   - Após adicionar variáveis, faça um novo deploy
   - Ou aguarde o próximo deploy automático

---

## 📝 Checklist de Configuração

### Mínimo para Funcionar
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GROQ_API_KEY`
- [ ] `ROUTINES_AUTH_TOKEN`

### Para Funcionalidades Completas
- [ ] `UPSTASH_REDIS_REST_URL` (cache persistente)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (cache persistente)
- [ ] `LLM_PROVIDER` (opcional, padrão: groq)
- [ ] `LLM_MODEL` (opcional, padrão: llama-3.1-8b-instant)

---

## 🔍 Verificação

### Como Testar se Está Configurado

1. **No Vercel Dashboard:**
   - Settings → Environment Variables
   - Verifique se todas as variáveis obrigatórias estão presentes

2. **No Logs do Deploy:**
   - Deployments → Selecione um deploy → Logs
   - Procure por erros relacionados a variáveis não encontradas

3. **No Console do Navegador:**
   - Abra DevTools → Console
   - Procure por mensagens de "Supabase não configurado" ou similares

---

## ⚠️ Importante

### Segurança

1. **NUNCA** commite variáveis no código
   - ✅ Use `.env` local (já está no `.gitignore`)
   - ✅ Configure no Vercel Dashboard

2. **Separação Frontend/Backend:**
   - `VITE_*` = Frontend (expostas no bundle)
   - Sem `VITE_` = Backend (seguras, apenas serverless)

3. **Chaves Secretas:**
   - `SUPABASE_SERVICE_ROLE_KEY` = ⚠️ SECRETO (nunca no frontend!)
   - `GROQ_API_KEY` = ⚠️ SECRETO (nunca no frontend!)
   - `ROUTINES_AUTH_TOKEN` = ⚠️ SECRETO

---

## 🚀 Exemplo Completo

```env
# ==========================================
# SUPABASE (Obrigatório)
# ==========================================
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# GROQ LLM (Obrigatório)
# ==========================================
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# PROTEÇÃO (Obrigatório)
# ==========================================
ROUTINES_AUTH_TOKEN=abc123xyz789_secreto_qualquer_32_chars_minimo

# ==========================================
# UPSTASH REDIS (Opcional - para cache)
# ==========================================
UPSTASH_REDIS_REST_URL=https://default-xxxxx-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxx
```

---

## 📚 Documentação Relacionada

- `CONFIGURACAO_SUPABASE.md` - Setup completo do Supabase
- `SUPABASE_SETUP.md` - Guia detalhado
- `.github/workflows/daily-routines.yml` - Configuração do GitHub Actions

---

## ❓ Problemas Comuns

### "Supabase não configurado"
- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
- Certifique-se de que fez redeploy após adicionar variáveis

### "Erro ao executar rotinas: Unauthorized"
- Verifique se `ROUTINES_AUTH_TOKEN` está configurado
- Certifique-se de usar o mesmo token no GitHub Actions (se configurar)

### "LLM não funciona"
- Verifique se `GROQ_API_KEY` está configurada
- Certifique-se de que a key está válida e não expirou

### "Cache não persiste"
- Configure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`
- Sem isso, usa fallback em memória (funciona, mas não persiste entre deploys)

