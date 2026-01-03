import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle2, TrendingUp, BarChart3, Lightbulb } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { askOrchestrator } from '../services/orchestrator/api'
import type { OrchestratorResponse, AskRequest } from '../services/orchestrator/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: OrchestratorResponse
  timestamp: Date
}

const Assistente = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const request: AskRequest = {
        question: userMessage.content
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
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
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
    'Por que a margem do flocão caiu em dezembro?',
    'Onde estão as maiores perdas esta semana?',
    'Qual a performance dos fornecedores?',
    'Como melhorar o OEE da linha 1?'
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Assistente de Operações"
        subtitle="Faça perguntas e obtenha análises inteligentes dos seus indicadores"
        icon={Bot}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Principal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-card flex flex-col h-[calc(100vh-200px)]">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-16 h-16 text-primary-500 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-secondary-700 mb-2">
                  Comece uma conversa
                </h3>
                <p className="text-sm text-secondary-500 max-w-md">
                  Faça perguntas sobre seus indicadores e obtenha análises inteligentes
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-secondary-400 mb-3">Perguntas sugeridas:</p>
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="block w-full text-left px-4 py-2 text-sm text-secondary-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
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
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 text-secondary-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.response && <ResponseDetails response={msg.response} />}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-secondary-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="space-y-6">
          {/* Confiança */}
          {messages.length > 0 && messages[messages.length - 1]?.response && (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6">
              <h3 className="text-sm font-semibold text-secondary-700 mb-4">Confiança da Análise</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-500">Grau de confiança</span>
                  <span className="text-sm font-semibold text-primary-600">
                    {messages[messages.length - 1]?.response?.confidence || 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{
                      width: `${messages[messages.length - 1]?.response?.confidence || 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Como usar</h3>
            <ul className="space-y-3 text-xs text-secondary-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Faça perguntas sobre seus KPIs e indicadores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>O sistema investiga e cruza dados automaticamente</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Receba síntese, causas e ações sugeridas</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Valide sempre as informações no BI tradicional</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para detalhes da resposta
const ResponseDetails = ({ response }: { response: OrchestratorResponse }) => {
  return (
    <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
      {/* Top Causas */}
      {response.synthesis.topCauses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Principais Causas</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.topCauses.slice(0, 3).map((cause, idx) => (
              <li key={idx} className="text-xs text-secondary-600 flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>{cause.cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidências */}
      {response.synthesis.numericalEvidence.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Evidências</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.numericalEvidence.slice(0, 3).map((ev, idx) => (
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
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-semibold text-secondary-700">Ações Sugeridas</h4>
          </div>
          <ul className="space-y-1">
            {response.synthesis.suggestedActions.slice(0, 3).map((action, idx) => (
              <li key={idx} className="text-xs text-secondary-600 flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>{action.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Links de Validação */}
      {response.synthesis.validationLinks.length > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-secondary-500 mb-2">Validar no BI:</p>
          <div className="flex flex-wrap gap-2">
            {response.synthesis.validationLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.path}
                className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Assistente

