import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, Bot, X, Minimize2, Maximize2, Loader2, TrendingUp, BarChart3, Lightbulb, MessageCircle } from 'lucide-react'
import { askOrchestrator } from '../services/orchestrator/api'
import type { OrchestratorResponse, AskRequest } from '../services/orchestrator/types'
import { logLLMConfig, testLLMConfiguration } from '../services/orchestrator/test-llm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: OrchestratorResponse
  timestamp: Date
}

interface ChatWidgetProps {
  initialQuestion?: string
}

// Mapeia rotas para áreas/units
const routeToArea: Record<string, string> = {
  '/': 'home',
  '/compras': 'compras',
  '/producao': 'producao',
  '/estoque': 'estoque',
  '/comercial': 'comercial',
  '/logistica': 'logistica',
  '/financeiro': 'financeiro'
}

const ChatWidget = ({ initialQuestion }: ChatWidgetProps) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQuestion || '')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detecta a área atual baseada na rota
  const currentArea = routeToArea[location.pathname] || undefined

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    // Loga configuração LLM no console (apenas em dev)
    if (import.meta.env.DEV) {
      logLLMConfig()
      // Testa configuração
      testLLMConfiguration().then(result => {
        console.group('🧪 Teste de Configuração LLM')
        console.log('Status:', result.configured ? '✅ Configurado e funcionando' : '⚠️ Não configurado (usando fallback)')
        console.log('Provider:', result.provider || 'não definido')
        console.log('API Key:', result.hasApiKey ? '✅ Presente' : '❌ Não encontrada')
        if (result.testResult) {
          if (result.testResult.success) {
            console.log('✅ Teste bem-sucedido!')
            console.log('Intenção mapeada:', result.testResult.intent)
            console.log('Confiança:', result.testResult.confidence)
            console.log('Entidades:', result.testResult.entities)
          } else {
            console.error('❌ Erro no teste:', result.testResult.error)
          }
        } else if (!result.configured) {
          console.log('💡 Configure VITE_LLM_PROVIDER e VITE_LLM_API_KEY no .env para usar LLM')
        }
        console.groupEnd()
      })
    }

    if (initialQuestion) {
      setIsOpen(true)
      setIsMinimized(false)
      // Pequeno delay para garantir que o componente está montado
      const timer = setTimeout(() => {
        if (messages.length === 0 || !messages.some(m => m.content === initialQuestion)) {
          handleSend(initialQuestion)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  const handleSend = async (questionText?: string) => {
    const question = questionText || input.trim()
    if (!question || loading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setIsOpen(true)
    setIsMinimized(false)

    try {
      const request: AskRequest = {
        question: userMessage.content,
        context: currentArea ? {
          area: currentArea
        } : undefined
      }

      const response = await askOrchestrator(request)

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.synthesis.executive,
        response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('❌ Erro na orquestração:', error)
      
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: error instanceof Error 
          ? `Erro: ${error.message}. Tente reformular sua pergunta ou verifique o console para mais detalhes.`
          : 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    'Por que a margem caiu?',
    'Onde estão as maiores perdas?',
    'Qual a performance dos fornecedores?',
    'Como melhorar o OEE?'
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-96 max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all ${
        isMinimized ? 'h-16' : 'h-[500px] sm:h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente de Operações</h3>
            <p className="text-xs text-white/70">IA para análise de indicadores</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Maximizar' : 'Minimizar'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 text-primary-500 mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-secondary-700 mb-2">
                  Como posso ajudar?
                </h3>
                <p className="text-xs text-secondary-500 mb-4 max-w-xs">
                  Faça perguntas sobre seus indicadores e obtenha análises inteligentes
                </p>
                <div className="space-y-2 w-full">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="block w-full text-left px-3 py-2 text-xs text-secondary-600 bg-white rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors border border-slate-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-secondary-700 border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.response && <ResponseDetails response={msg.response} />}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-secondary-600">U</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-white rounded-2xl px-3 py-2 border border-slate-200">
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 bg-white rounded-b-xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Componente para detalhes da resposta (versão compacta)
const ResponseDetails = ({ response }: { response: OrchestratorResponse }) => {
  return (
    <div className="mt-3 space-y-2 pt-3 border-t border-slate-200">
      {/* Top Causas */}
      {response.synthesis.topCauses.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Principais Causas</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.topCauses.slice(0, 2).map((cause, idx) => (
              <li key={idx} className="text-xs text-secondary-600 flex items-start gap-1.5">
                <span className="text-primary-500 text-[10px] mt-0.5">•</span>
                <span>{cause.cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidências */}
      {response.synthesis.numericalEvidence.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-primary-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Evidências</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.numericalEvidence.slice(0, 2).map((ev, idx) => (
              <li key={idx} className="text-xs text-secondary-600">
                <span className="font-medium">{ev.metric}:</span> {ev.value}{ev.unit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ações Sugeridas */}
      {response.synthesis.suggestedActions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Ações</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.suggestedActions.slice(0, 2).map((action, idx) => (
              <li key={idx} className="text-xs text-secondary-600 flex items-start gap-1.5">
                <span className="text-amber-500 text-[10px] mt-0.5">•</span>
                <span>{action.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confiança */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary-500">Confiança:</span>
          <span className="text-xs font-semibold text-primary-600">{response.confidence}%</span>
        </div>
      </div>
    </div>
  )
}

export default ChatWidget

