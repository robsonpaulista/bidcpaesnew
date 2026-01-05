# 🛠️ Configuração para Desenvolvimento Local

## ✅ Funciona em Desenvolvimento!

O sistema foi configurado para funcionar tanto em **desenvolvimento local** quanto em **produção**.

## 📋 O que funciona em DEV

### ✅ Funciona sem Vercel:
- **Frontend completo** (React + Vite)
- **Orquestrador local** (fallback automático)
- **Conexão com Supabase** (usa variáveis do `.env`)
- **Componentes UI** (DailyBriefing, EventsFeed, InsightsPanel)
- **Chat com agente** (usa fallback local se API não disponível)

### ⚠️ Requer Vercel (ou ajuste manual):
- **Endpoints de API** (`/api/orchestrator/*`)
  - Mas tem **fallback automático** para desenvolvimento!

## 🚀 Como rodar em desenvolvimento

### 1. Configure o `.env`

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (opcional para dev)

# LLM (obrigatório para chat funcionar)
GROQ_API_KEY=ou LLM_API_KEY=...

# Proteção (opcional para dev)
ROUTINES_AUTH_TOKEN=seu_token_aqui
```

**Importante**: No Vite, variáveis do frontend precisam ter prefixo `VITE_`!

### 2. Instale dependências

```bash
npm install
```

### 3. Rode o servidor de desenvolvimento

```bash
npm run dev
```

### 4. Acesse

```
http://localhost:5173
```

## 🔄 Como funciona o fallback

### Frontend → API
- **Produção**: Chama `/api/orchestrator/ask` (Vercel Function)
- **Desenvolvimento**: Se API falhar, usa `orchestrate()` local

### Briefing e Eventos
- **Produção**: Chama `/api/orchestrator/briefing` e `/api/orchestrator/events`
- **Desenvolvimento**: Se API falhar, busca diretamente do Supabase (usando anon key)

### Supabase
- Funciona igual em DEV e PROD
- Usa as variáveis do `.env` (ou `VITE_*` no frontend)

## 🧪 Testar endpoints localmente

### Opção 1: Usar Vercel CLI (recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Rodar localmente
vercel dev
```

Isso vai rodar as serverless functions localmente também!

### Opção 2: Testar endpoints manualmente

Os componentes já têm fallback, mas se quiser testar os endpoints:

```bash
# Em outro terminal, simule a API
node -e "
import('http').then(({createServer}) => {
  createServer((req, res) => {
    if (req.url === '/api/orchestrator/briefing') {
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({date: '2024-01-01', summary: 'Teste'}))
    }
  }).listen(5174)
})
"
```

## 📝 Checklist de Desenvolvimento

- [ ] `.env` configurado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [ ] Schema SQL executado no Supabase
- [ ] `npm run dev` funcionando
- [ ] Home mostra "Resumo do Dia" (pode estar vazio se não houver briefing)
- [ ] Header mostra sino de eventos (pode estar vazio)
- [ ] Chat funciona (se `GROQ_API_KEY` configurado)

## 🎯 Diferenças DEV vs PROD

| Recurso | Desenvolvimento | Produção |
|---------|----------------|----------|
| API Endpoints | Fallback local | Vercel Functions |
| Supabase | `.env` local | Variáveis do Vercel |
| LLM Key | `.env` local | `process.env` no backend |
| Rate Limiting | In-memory | Upstash Redis |
| Cache | In-memory | Upstash Redis |

## 💡 Dicas

1. **Variáveis VITE_**: No frontend, use `VITE_*` para expor variáveis
2. **Service Role Key**: Não precisa em dev (só para escrita no Supabase)
3. **Mock Data**: Se Supabase não estiver configurado, alguns componentes mostram dados mock
4. **Console**: Veja os avisos no console sobre fallbacks

## 🐛 Troubleshooting

### "Supabase não configurado"
- Verifique se `VITE_SUPABASE_URL` está no `.env`
- Reinicie o servidor (`npm run dev`)

### "API não disponível"
- Normal em dev! O sistema usa fallback automático
- Se quiser testar endpoints, use `vercel dev`

### "Briefing vazio"
- Execute `/api/orchestrator/run-routines` manualmente (ou aguarde o cron)
- Ou crie um briefing manualmente no Supabase

---

**Resumo**: Tudo funciona em desenvolvimento! Os fallbacks garantem que você possa desenvolver sem precisar do Vercel rodando localmente.



