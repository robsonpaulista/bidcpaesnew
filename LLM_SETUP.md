# 🤖 Configuração de LLM Gratuita

## Opções Gratuitas Disponíveis

### 1. **Groq** (Recomendado ⭐)
- **Por quê:** Mais rápido, melhor para produção
- **Limite:** 30 requisições/minuto (gratuito)
- **Modelos:** Llama 3.1, Mixtral
- **Setup:**
  1. Acesse: https://console.groq.com/
  2. Crie conta gratuita
  3. Vá em "API Keys" e crie uma chave
  4. Configure no `.env`:
     ```
     VITE_LLM_PROVIDER=groq
     VITE_LLM_API_KEY=sua_chave_aqui
     VITE_LLM_MODEL=llama-3.1-8b-instant
     ```

### 2. **Hugging Face Inference API**
- **Por quê:** Open source, muitos modelos
- **Limite:** 1000 requisições/mês (gratuito)
- **Modelos:** DialoGPT, GPT-2, etc
- **Setup:**
  1. Acesse: https://huggingface.co/
  2. Crie conta gratuita
  3. Vá em Settings → Access Tokens
  4. Crie um token com permissão de leitura
  5. Configure no `.env`:
     ```
     VITE_LLM_PROVIDER=huggingface
     VITE_LLM_API_KEY=seu_token_aqui
     VITE_LLM_MODEL=microsoft/DialoGPT-medium
     ```

### 3. **Google Gemini**
- **Por quê:** Boa qualidade, da Google
- **Limite:** 15 requisições/minuto (gratuito)
- **Modelos:** gemini-pro
- **Setup:**
  1. Acesse: https://makersuite.google.com/app/apikey
  2. Crie uma API key
  3. Configure no `.env`:
     ```
     VITE_LLM_PROVIDER=gemini
     VITE_LLM_API_KEY=sua_chave_aqui
     VITE_LLM_MODEL=gemini-pro
     ```

## Como Funciona

### Com LLM Configurada:
1. Usuário faz pergunta
2. LLM analisa semanticamente
3. Mapeia para intenção de negócio
4. Executa plano pré-definido

### Sem LLM (Fallback):
1. Usuário faz pergunta
2. Sistema usa keywords + contexto
3. Mapeia para intenção
4. Executa plano pré-definido

**O sistema sempre funciona, mesmo sem LLM!**

## Testando

1. Configure a API key no `.env`
2. Reinicie o servidor de desenvolvimento
3. Faça uma pergunta no chat
4. Verifique no console se está usando LLM ou fallback

## Troubleshooting

**Erro: "API key não configurada"**
- Verifique se o `.env` está na raiz do projeto
- Reinicie o servidor após adicionar variáveis

**Erro: "Rate limit exceeded"**
- Groq: Aguarde 1 minuto (30 req/min)
- Gemini: Aguarde 1 minuto (15 req/min)
- Hugging Face: Aguarde até o próximo mês (1000 req/mês)

**Sempre cai no fallback:**
- Verifique se a API key está correta
- Verifique se o provider está correto
- Veja o console do navegador para erros

## Recomendação

**Para desenvolvimento/testes:** Use **Groq** (mais rápido, limite generoso)  
**Para produção:** Considere upgrade para tier pago ou use múltiplos providers






