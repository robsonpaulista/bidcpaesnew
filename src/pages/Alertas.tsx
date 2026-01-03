import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, TrendingDown, TrendingUp, Search, Filter, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getAlerts } from '../services/orchestrator/api'
import type { IntelligentAlert } from '../services/orchestrator/types'
import { useNavigate, useLocation } from 'react-router-dom'

const Alertas = () => {
  const [alerts, setAlerts] = useState<IntelligentAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'P0' | 'P1' | 'P2'>('all')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.severity === filter
    const matchesSearch = search === '' || 
      alert.indicator.label.toLowerCase().includes(search.toLowerCase()) ||
      alert.probableCause.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0': return 'bg-red-500'
      case 'P1': return 'bg-amber-500'
      case 'P2': return 'bg-blue-500'
      default: return 'bg-slate-500'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'P0': return 'Crítico'
      case 'P1': return 'Alto'
      case 'P2': return 'Médio'
      default: return 'Baixo'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'investigating': return 'bg-amber-100 text-amber-700'
      case 'acknowledged': return 'bg-purple-100 text-purple-700'
      case 'resolved': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const handleInvestigate = (alert: IntelligentAlert) => {
    // Abre o chat widget com a pergunta pré-preenchida
    // O chat widget vai pegar a pergunta do location state
    navigate(location.pathname, { 
      state: { 
        question: `Por que ${alert.indicator.label} está em ${alert.variation.current}${alert.variation.unit}?` 
      },
      replace: true
    })
    // Força scroll para o topo para mostrar o chat
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
    if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
    return 'Agora'
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Alertas Inteligentes"
        subtitle="Desvios detectados automaticamente nos seus indicadores"
        icon={AlertTriangle}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alertas..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'P0', 'P1', 'P2'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === sev
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 text-secondary-600 hover:bg-slate-200'
                }`}
              >
                {sev === 'all' ? 'Todos' : sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-secondary-500">Carregando alertas...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-700 mb-2">
            Nenhum alerta encontrado
          </h3>
          <p className="text-sm text-secondary-500">
            {search || filter !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Todos os indicadores estão dentro dos limites esperados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${getSeverityColor(alert.severity)} flex items-center justify-center flex-shrink-0`}>
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-secondary-800">
                        {alert.indicator.label}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)} text-white`}>
                        {getSeverityLabel(alert.severity)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status === 'new' ? 'Novo' : 
                         alert.status === 'investigating' ? 'Investigando' :
                         alert.status === 'acknowledged' ? 'Reconhecido' : 'Resolvido'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                      <span>{alert.indicator.area}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Variação */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-secondary-500 mb-1">Variação Detectada</p>
                  <div className="flex items-center gap-2">
                    {alert.variation.change < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    )}
                    <span className="text-lg font-semibold text-secondary-800">
                      {alert.variation.current}{alert.variation.unit}
                    </span>
                    <span className={`text-sm font-medium ${
                      alert.variation.change < 0 ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {alert.variation.change > 0 ? '+' : ''}{alert.variation.change}{alert.variation.unit}
                    </span>
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">
                    Anterior: {alert.variation.previous}{alert.variation.unit}
                  </p>
                </div>

                {/* Impacto */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-secondary-500 mb-1">Impacto Estimado</p>
                  <p className="text-sm font-medium text-secondary-800">
                    {alert.impact.estimated}
                  </p>
                  {alert.impact.financial && (
                    <p className="text-xs text-secondary-400 mt-1">
                      Financeiro: R$ {alert.impact.financial.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Causa Provável */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-secondary-500 mb-1">Causa Provável</p>
                  <p className="text-sm font-medium text-secondary-800">
                    {alert.probableCause}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-secondary-400">Confiança:</span>
                    <span className="text-xs font-semibold text-primary-600">
                      {alert.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-secondary-500">
                  <Filter className="w-4 h-4" />
                  <span>Detectado automaticamente pela rotina de análise</span>
                </div>
                <button
                  onClick={() => handleInvestigate(alert)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Investigar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Alertas

