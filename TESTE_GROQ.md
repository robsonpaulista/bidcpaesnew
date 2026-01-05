# 🧪 Como Testar a Configuração do Groq

## ✅ Checklist de Configuração

1. **Arquivo `.env` criado na raiz do projeto:**
   ```env
   VITE_LLM_PROVIDER=groq
   VITE_LLM_API_KEY=sua_chave_groq_aqui
   VITE_LLM_MODEL=llama-3.1-8b-instant
   ```

2. **Servidor reiniciado** após criar/editar o `.env`

3. **API Key do Groq válida** (obtida em https://console.groq.com/)

## 🔍 Como Verificar se Está Funcionando

### 1. Abra o Console do Navegador (F12)

Quando você abrir o chat, você verá logs como:

```
🔧 Configuração LLM
  Provider: groq
  API Key configurada: ✅ Sim
  Model: llama-3.1-8b-instant
  Variáveis de ambiente:
    VITE_LLM_PROVIDER: groq
    VITE_LLM_API_KEY: ***xxxx
    VITE_LLM_MODEL: llama-3.1-8b-instant

🧪 Teste de Configuração LLM
  Configurado: ✅
  Provider: groq
  API Key: ✅
  ✅ Teste bem-sucedido!
  Intenção mapeada: analyze_revenue_trend
  Confiança: 0.91
  Entidades: { periodo: "dezembro" }
```

### 2. Faça uma Pergunta no Chat

Ao fazer uma pergunta, você verá:

```
🔍 Mapeando pergunta com LLM:
  provider: groq
  hasApiKey: true
  question: qual a oscilação do faturamento...

🚀 Usando Groq para mapeamento...

📥 Resposta bruta do Groq: {"intent":"analyze_revenue_trend","confidence":0.91...

✅ Groq mapeou:
  intent: analyze_revenue_trend
  confidence: 0.91
  entities: { periodo: "dezembro" }
```

### 3. Se Estiver Usando Fallback

Se você ver:

```
⚠️ Usando fallback (keywords) - LLM não configurado
```

Ou:

```
❌ Erro no mapeamento LLM, usando fallback: [erro]
```

**Possíveis causas:**
- API key não configurada ou inválida
- Variáveis de ambiente não carregadas (precisa reiniciar servidor)
- Rate limit do Groq atingido (30 req/min)
- Erro na API do Groq

## 🐛 Troubleshooting

### Problema: "API key não configurada"

**Solução:**
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Verifique se as variáveis começam com `VITE_`
3. Reinicie o servidor (`npm run dev`)

### Problema: "Groq API error: 401 Unauthorized"

**Solução:**
- API key inválida ou expirada
- Obtenha uma nova key em https://console.groq.com/keys

### Problema: "Groq API error: 429 Too Many Requests"

**Solução:**
- Rate limit atingido (30 req/min no plano gratuito)
- Aguarde 1 minuto e tente novamente

### Problema: Sempre usa fallback

**Solução:**
1. Verifique no console se as variáveis estão sendo lidas
2. Certifique-se de que `VITE_LLM_PROVIDER=groq` (não 'local')
3. Certifique-se de que `VITE_LLM_API_KEY` tem valor

## ✅ Teste Rápido

1. Abra o projeto
2. Abra o console do navegador (F12)
3. Abra o chat widget
4. Verifique os logs no console
5. Faça uma pergunta e veja se usa Groq ou fallback

## 📊 Diferença entre Groq e Fallback

**Com Groq:**
- Mapeamento semântico mais inteligente
- Extrai entidades automaticamente
- Melhor compreensão de contexto

**Com Fallback (keywords):**
- Funciona, mas menos preciso
- Baseado em palavras-chave
- Menos inteligente, mas sempre disponível

---

**O sistema sempre funciona, mesmo sem Groq!** Mas com Groq fica muito mais inteligente. 🚀






