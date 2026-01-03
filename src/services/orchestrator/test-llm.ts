// ==========================================
// TESTE DE CONFIGURAÇÃO LLM
// ==========================================
// Use esta função para testar se o Groq está configurado corretamente

import { mapQuestionToIntentionWithLLM, llmConfig } from './llm-mapper'

export async function testLLMConfiguration(): Promise<{
  configured: boolean
  provider: string
  hasApiKey: boolean
  testResult?: {
    success: boolean
    intent?: string
    confidence?: number
    entities?: Record<string, string>
    error?: string
  }
}> {
  const result = {
    configured: false,
    provider: llmConfig.provider,
    hasApiKey: !!llmConfig.apiKey,
    testResult: undefined as {
      success: boolean
      intent?: string
      confidence?: number
      entities?: Record<string, string>
      error?: string
    } | undefined
  }

  // Verifica configuração básica
  if (llmConfig.provider === 'local' || !llmConfig.apiKey) {
    return {
      ...result,
      configured: false
    }
  }

  result.configured = true

  // Testa com uma pergunta simples
  try {
    const testQuestion = 'qual a oscilação do faturamento mensal?'
    const mapping = await mapQuestionToIntentionWithLLM(testQuestion)
    
    result.testResult = {
      success: true,
      intent: mapping.intent,
      confidence: mapping.confidence,
      entities: mapping.entities
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    result.testResult = {
      success: false,
      error: errorMessage
    }
    
    // Log detalhado do erro (apenas em dev)
    if (import.meta.env.DEV) {
      console.warn('⚠️ Erro no teste LLM:', errorMessage)
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        console.warn('💡 Dica: Verifique se a API key do Groq está correta')
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('💡 Dica: Rate limit atingido. Aguarde 1 minuto e tente novamente')
      }
    }
  }

  return result
}

// Função para logar configuração atual (útil para debug)
export function logLLMConfig(): void {
  const apiKey = llmConfig.apiKey
  const apiKeyPreview = apiKey 
    ? `gsk_***${apiKey.slice(-6)} (${apiKey.length} caracteres)` 
    : 'não configurada'
  
  console.group('🔧 Configuração LLM')
  console.log('Provider:', llmConfig.provider || 'não definido')
  console.log('API Key:', apiKey ? '✅ ' + apiKeyPreview : '❌ não configurada')
  console.log('Model:', llmConfig.model || 'padrão')
  console.log('Status:', (llmConfig.provider !== 'local' && apiKey) ? '✅ Configurado e pronto' : '⚠️ Usando fallback (keywords)')
  console.log('Variáveis de ambiente carregadas:')
  console.log('  VITE_LLM_PROVIDER:', import.meta.env.VITE_LLM_PROVIDER || '(não definida)')
  console.log('  VITE_LLM_API_KEY:', import.meta.env.VITE_LLM_API_KEY 
    ? `***${import.meta.env.VITE_LLM_API_KEY.slice(-4)} (${import.meta.env.VITE_LLM_API_KEY.length} chars)` 
    : '(não definida)')
  console.log('  VITE_LLM_MODEL:', import.meta.env.VITE_LLM_MODEL || '(não definida, usando padrão)')
  console.groupEnd()
}

