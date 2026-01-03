# 🚀 Configuração Rápida - Supabase

## ✅ O que foi implementado

1. **Schema SQL** (`supabase/schema.sql`)
   - Tabelas: `alerts`, `events`, `cases`, `briefings`
   - Índices e triggers automáticos

2. **Endpoints de API**
   - `/api/orchestrator/run-routines` - Executa rotinas diárias
   - `/api/orchestrator/briefing` - Retorna briefing do dia
   - `/api/orchestrator/events` - Feed de eventos

3. **Componentes UI**
   - `DailyBriefing` - Resumo do dia na Home
   - `EventsFeed` - Sino no Header com feed de atividades
   - `InsightsPanel` - Insights por área nas páginas

4. **GitHub Actions**
   - `.github/workflows/daily-routines.yml` - Cron diário

## 📝 Próximos Passos

### 1. Executar Schema no Supabase

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `supabase/schema.sql`
5. Execute (Run)

### 2. Configurar Variáveis no Vercel

No Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (anon/public key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key - SECRETO!)

# Proteção do endpoint
ROUTINES_AUTH_TOKEN=seu_token_secreto_aqui
```

**Onde encontrar as keys:**
- Supabase Dashboard → Settings → API
- `anon/public` = chave pública (pode ir no frontend)
- `service_role` = chave secreta (APENAS backend)

**Como gerar o ROUTINES_AUTH_TOKEN:**
- Você mesmo cria esse token! É uma string secreta qualquer
- Pode ser gerado com: `openssl rand -hex 32` (no terminal)
- Ou use um gerador online: https://randomkeygen.com/
- Exemplo: `ROUTINES_AUTH_TOKEN=abc123xyz789_secreto_qualquer`
- **Importante**: Use o mesmo token no Vercel E no GitHub Actions (se configurar)

### 3. Instalar Dependência (Opcional)

```bash
npm install @supabase/supabase-js
```

**Nota**: Funciona sem isso (usa fetch direto), mas o cliente oficial é melhor.

### 4. Configurar GitHub Actions (Opcional)

No GitHub → Settings → Secrets → Actions:

```env
VERCEL_URL=https://seu-app.vercel.app
ROUTINES_AUTH_TOKEN=mesmo_token_do_vercel
```

### 5. Testar

```bash
# Teste manual do endpoint
curl -X POST "https://seu-app.vercel.app/api/orchestrator/run-routines" \
  -H "Authorization: Bearer seu_token_aqui"
```

## 🎯 Resultado Esperado

- **Home**: Mostra "Resumo do Dia" com briefing automático
- **Header**: Sino mostra eventos em tempo real
- **Páginas**: Mostram `InsightsPanel` com alertas e recomendações da área
- **Rotinas**: Executam automaticamente 1x por dia (8h UTC)

## 📚 Documentação Completa

Veja `SUPABASE_SETUP.md` para detalhes completos.

