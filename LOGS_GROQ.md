# 📋 Logs do Console - Configuração Groq

## 🔍 Onde Encontrar os Logs

Abra o **Chrome DevTools** (F12) e vá na aba **Console**. Os logs aparecem quando:
1. Você abre o chat widget
2. Você faz uma pergunta no chat

---

## 📊 Logs que Você Deve Ver

### 1. 🔧 Configuração LLM (ao abrir o chat)

```
🔧 Configuração LLM
  Provider: groq
  API Key: ✅ gsk_***xxxxxx (XX caracteres)
  Model: llama-3.1-8b-instant
  Status: ✅ Configurado e pronto
  Variáveis de ambiente carregadas:
    VITE_LLM_PROVIDER: groq
    VITE_LLM_API_KEY: ***xxxx (XX chars)
    VITE_LLM_MODEL: llama-3.1-8b-instant
```

**O que significa:**
- ✅ **Provider:** Qual LLM está configurado (groq, gemini, local)
- ✅ **API Key:** Se a chave está presente (últimos caracteres mascarados)
- ✅ **Model:** Modelo que será usado
- ✅ **Status:** Se está pronto para usar ou usando fallback

---

### 2. 🧪 Teste de Configuração LLM (ao abrir o chat)

```
🧪 Teste de Configuração LLM
  Status: ✅ Configurado e funcionando
  Provider: groq
  API Key: ✅ Presente
  ✅ Teste bem-sucedido!
  Intenção mapeada: analyze_revenue_trend
  Confiança: 0.9
  Entidades: { periodo: "mensal", kpi: "faturamento mensal" }
```

**O que significa:**
- ✅ **Status:** Se o Groq está funcionando corretamente
- ✅ **API Key:** Se a chave foi encontrada
- ✅ **Teste bem-sucedido:** A API do Groq respondeu corretamente
- ✅ **Intenção mapeada:** Qual intenção foi identificada no teste
- ✅ **Confiança:** Nível de confiança (0.0 a 1.0)
- ✅ **Entidades:** Informações extraídas da pergunta

---

### 3. 🔍 Mapeando pergunta com LLM (ao fazer pergunta)

```
🔍 Mapeando pergunta com LLM: {
  provider: "groq",
  hasApiKey: true,
  question: "qual a oscilação do faturamento mensal..."
}
```

**O que significa:**
- Sistema está tentando mapear sua pergunta usando o Groq
- `hasApiKey: true` = API key encontrada
- `question` = Primeiros 50 caracteres da sua pergunta

---

### 4. 🚀 Usando Groq para mapeamento (durante processamento)

```
🚀 Usando Groq para mapeamento...
🌐 Enviando requisição para Groq API... {
  model: "llama-3.1-8b-instant",
  endpoint: "https://api.groq.com/openai/v1/chat/completions"
}
```

**O que significa:**
- Sistema está enviando requisição para a API do Groq
- Mostra qual modelo e endpoint estão sendo usados

---

### 5. 📥 Resposta bruta do Groq (resposta da API)

```
📥 Resposta bruta do Groq: {"intent":"analyze_revenue_trend","confidence":0.9,"entities":{"kpi":"faturamento mensal","periodo":"mensal"}}
```

**O que significa:**
- Resposta JSON retornada pelo Groq
- Ainda não processada (raw)

---

### 6. ✅ Groq mapeou (resultado processado)

```
✅ Groq mapeou: {
  intent: "analyze_revenue_trend",
  confidence: 0.9,
  entities: {
    periodo: "mensal",
    kpi: "faturamento mensal"
  }
}
```

**O que significa:**
- Resultado final do mapeamento
- `intent` = Intenção de negócio identificada
- `confidence` = Nível de confiança
- `entities` = Dados extraídos (produto, período, KPI, etc.)

---

## ⚠️ Logs de Erro

### Se API Key não estiver configurada:

```
🔧 Configuração LLM
  API Key: ❌ não configurada
  Status: ⚠️ Usando fallback (keywords)

🧪 Teste de Configuração LLM
  Status: ⚠️ Não configurado (usando fallback)
  API Key: ❌ Não encontrada
  💡 Configure VITE_LLM_PROVIDER e VITE_LLM_API_KEY no .env para usar LLM

⚠️ Usando fallback (keywords) - LLM não configurado
```

### Se API Key for inválida (401):

```
❌ Erro na API Groq: {
  status: 401,
  statusText: "Unauthorized",
  error: "Invalid API key"
}

⚠️ Erro no mapeamento LLM, usando fallback: Groq API error (401): Invalid API key
💡 Dica: Verifique se a API key do Groq está correta
```

### Se rate limit atingido (429):

```
❌ Erro na API Groq: {
  status: 429,
  statusText: "Too Many Requests"
}

⚠️ Erro no mapeamento LLM, usando fallback: Groq API error (429): Too Many Requests
💡 Dica: Rate limit atingido. Aguarde 1 minuto e tente novamente
```

---

## ✅ Checklist de Logs Corretos

Quando tudo está funcionando, você deve ver:

- [x] ✅ `Provider: groq`
- [x] ✅ `API Key: ✅ Presente`
- [x] ✅ `Status: ✅ Configurado e funcionando`
- [x] ✅ `✅ Teste bem-sucedido!`
- [x] ✅ `🚀 Usando Groq para mapeamento...`
- [x] ✅ `✅ Groq mapeou:` com intent e entidades

---

## 🔒 Segurança dos Logs

Os logs **NUNCA** mostram a API key completa:
- ✅ Mostram apenas os últimos 4-6 caracteres: `gsk_***xxxxxx`
- ✅ Mostram o comprimento total da key: `(XX caracteres)`
- ✅ É seguro compartilhar screenshots dos logs

---

## 📝 Notas Importantes

1. **Logs só aparecem em desenvolvimento:** Em produção (`npm run build`), os logs detalhados são removidos

2. **Fallback sempre funciona:** Mesmo se o Groq falhar, o sistema usa keywords e continua funcionando

3. **Rate limit do Groq:** Plano gratuito = 30 req/min. Se exceder, verá erro 429

4. **Cache do navegador:** Se mudar o `.env`, precisa reiniciar o servidor (`npm run dev`)

---

## 🆘 Troubleshooting Rápido

| Log | O que fazer |
|-----|-------------|
| `API Key: ❌ Não encontrada` | Configure `VITE_LLM_API_KEY` no `.env` |
| `Provider: local` | Configure `VITE_LLM_PROVIDER=groq` no `.env` |
| `Erro 401` | API key inválida. Gere nova key em https://console.groq.com/keys |
| `Erro 429` | Aguarde 1 minuto (rate limit) |
| `⚠️ Usando fallback` | Sistema funcionando, mas sem LLM (menos inteligente) |

---

**Todos os logs são apenas informativos. O sistema sempre funciona!** 🚀






