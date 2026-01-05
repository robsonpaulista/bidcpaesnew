# 🗄️ Configuração do Supabase

## 📋 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse: https://supabase.com/
2. Crie uma conta (se não tiver)
3. Crie um novo projeto
4. Anote:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **API Key** (anon key) - Settings → API → anon/public key
   - **Service Role Key** - Settings → API → service_role key (⚠️ secreto!)

### 2. Executar Schema SQL

1. No Supabase Dashboard → SQL Editor
2. Copie o conteúdo de `supabase/schema.sql`
3. Cole e execute
4. Verifique se as tabelas foram criadas:
   - `alerts`
   - `events`
   - `cases`
   - `case_hypotheses`
   - `case_validation_checklist`
   - `case_validation_history`
   - `briefings`

### 3. Configurar Variáveis de Ambiente

#### No Vercel Dashboard → Settings → Environment Variables:

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key - SECRETO!)

# Proteção do endpoint de rotinas
ROUTINES_AUTH_TOKEN=seu_token_secreto_aqui
```

**⚠️ IMPORTANTE**: 
- `SUPABASE_SERVICE_ROLE_KEY` é **SECRETO** - nunca exponha no frontend
- `ROUTINES_AUTH_TOKEN` protege o endpoint `/api/orchestrator/run-routines`

### 4. Instalar Dependência (Opcional)

Se quiser usar o cliente oficial do Supabase:

```bash
npm install @supabase/supabase-js
```

**Nota**: O código funciona sem isso (usa fetch direto), mas o cliente oficial é mais robusto.

### 5. Testar Conexão

```bash
# Teste local (com variáveis de ambiente)
npm run dev

# Verifique no console se aparece:
# ✅ Supabase inicializado
```

### 6. Configurar GitHub Actions (Opcional)

1. No GitHub → Settings → Secrets and variables → Actions
2. Adicione:
   - `VERCEL_URL`: URL do seu deploy (ex: `https://seu-app.vercel.app`)
   - `ROUTINES_AUTH_TOKEN`: Mesmo token configurado no Vercel

3. O workflow `.github/workflows/daily-routines.yml` executará automaticamente

## 🔍 Verificação

### 1. Testar Endpoint de Rotinas

```bash
# Manual (com token)
curl -X POST "https://seu-app.vercel.app/api/orchestrator/run-routines" \
  -H "Authorization: Bearer seu_token_aqui"
```

### 2. Verificar Dados no Supabase

No Supabase Dashboard → Table Editor:
- Verifique se `alerts` tem registros
- Verifique se `events` tem registros
- Verifique se `briefings` tem registros

### 3. Testar Frontend

- Home: Deve mostrar "Resumo do Dia"
- Header: Sino deve mostrar eventos
- Páginas: Devem mostrar `InsightsPanel`

## 📊 Estrutura das Tabelas

### alerts
- Armazena alertas gerados automaticamente
- Campos: severity, indicator, variation, impact, etc.

### events
- Feed de atividades dos agentes
- Tipos: alert_created, case_created, routine_executed, etc.

### cases
- Casos operacionais (investigações)
- Relacionado com: case_hypotheses, case_validation_checklist

### briefings
- Resumo do dia gerado automaticamente
- Um registro por dia (date UNIQUE)

## 🔒 Segurança

- **RLS (Row Level Security)**: Desabilitado por padrão
- **Service Role Key**: Apenas no backend (Vercel)
- **Anon Key**: Pode ir no frontend (apenas leitura se RLS habilitado)

## 🚀 Próximos Passos

1. Habilitar RLS quando necessário
2. Criar políticas de acesso por usuário
3. Adicionar índices adicionais conforme uso
4. Configurar backups automáticos



