import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Search, Filter, Eye } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getCases, getCase, validateCase } from '../services/orchestrator/api'
import type { OperationalCase, ValidateCaseRequest } from '../services/orchestrator/types'
import { useNavigate, useLocation } from 'react-router-dom'

const Casos = () => {
  const [cases, setCases] = useState<OperationalCase[]>([])
  const [selectedCase, setSelectedCase] = useState<OperationalCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'aberto' | 'em_investigacao' | 'validado' | 'resolvido'>('all')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setLoading(true)
    try {
      const data = await getCases()
      setCases(data)
    } catch (error) {
      console.error('Erro ao carregar casos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCase = async (caseId: string) => {
    try {
      const case_ = await getCase(caseId)
      if (case_) {
        setSelectedCase(case_)
      }
    } catch (error) {
      console.error('Erro ao carregar caso:', error)
    }
  }

  const handleValidateChecklist = async (caseId: string, checkId: string, checked: boolean) => {
    try {
      const case_ = await getCase(caseId)
      if (case_) {
        const updatedChecklist = case_.validationChecklist.map(item =>
          item.id === checkId ? { ...item, checked, checkedAt: new Date().toISOString() } : item
        )
        setSelectedCase({ ...case_, validationChecklist: updatedChecklist })
      }
    } catch (error) {
      console.error('Erro ao validar checklist:', error)
    }
  }

  const handleValidateHypothesis = async (caseId: string, hypothesisId: string, validated: boolean) => {
    try {
      const request: ValidateCaseRequest = {
        caseId,
        hypothesisId,
        validated
      }
      await validateCase(request)
      await loadCases()
      if (selectedCase?.id === caseId) {
        await handleSelectCase(caseId)
      }
    } catch (error) {
      console.error('Erro ao validar hipótese:', error)
    }
  }

  const filteredCases = cases.filter(case_ => {
    const matchesFilter = filter === 'all' || case_.status === filter
    const matchesSearch = search === '' || 
      case_.title.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-blue-100 text-blue-700'
      case 'em_investigacao': return 'bg-amber-100 text-amber-700'
      case 'validado': return 'bg-purple-100 text-purple-700'
      case 'resolvido': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto': return 'Aberto'
      case 'em_investigacao': return 'Em Investigação'
      case 'validado': return 'Validado'
      case 'resolvido': return 'Resolvido'
      default: return status
    }
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
        title="Casos Operacionais"
        subtitle="Investigação estruturada de problemas e oportunidades"
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Casos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtros */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar casos..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'aberto', 'em_investigacao', 'validado', 'resolvido'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-secondary-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-secondary-500">Carregando casos...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-12 text-center">
              <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-700 mb-2">
                Nenhum caso encontrado
              </h3>
              <p className="text-sm text-secondary-500">
                {search || filter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Nenhum caso operacional registrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((case_) => (
                <div
                  key={case_.id}
                  className={`bg-white rounded-xl border border-slate-200/60 shadow-card p-6 cursor-pointer hover:shadow-lg transition-all ${
                    selectedCase?.id === case_.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => handleSelectCase(case_.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-800">
                          {case_.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(case_.status)}`}>
                          {getStatusLabel(case_.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-secondary-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeAgo(case_.timestamp)}</span>
                        </div>
                        <span>•</span>
                        <span>
                          {case_.source === 'alert' ? 'Originado de alerta' : 
                           case_.source === 'manual' ? 'Criado manualmente' : 
                           'Rotina automática'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-secondary-500 mb-1">Hipóteses</p>
                      <p className="font-semibold text-secondary-800">
                        {case_.hypotheses.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-500 mb-1">Evidências</p>
                      <p className="font-semibold text-secondary-800">
                        {case_.evidence.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-secondary-500 mb-1">Checklist</p>
                      <p className="font-semibold text-secondary-800">
                        {case_.validationChecklist.filter(c => c.checked).length} / {case_.validationChecklist.length}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes do Caso */}
        {selectedCase && (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-800">Detalhes do Caso</h3>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Hipóteses */}
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-3">Hipóteses</h4>
              <div className="space-y-3">
                {selectedCase.hypotheses.map((hyp) => (
                  <div key={hyp.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-secondary-800">{hyp.hypothesis}</p>
                      <div className="flex items-center gap-2">
                        {hyp.status === 'confirmed' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        {hyp.status === 'rejected' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {hyp.status === 'pending' && (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-secondary-500">
                        Confiança: {hyp.confidence}%
                      </span>
                      {hyp.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleValidateHypothesis(selectedCase.id, hyp.id, true)}
                            className="px-3 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleValidateHypothesis(selectedCase.id, hyp.id, false)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-secondary-500 mb-1">Evidências:</p>
                      <ul className="space-y-1">
                        {hyp.evidence.map((ev, idx) => (
                          <li key={idx} className="text-xs text-secondary-600 flex items-start gap-2">
                            <span className="text-primary-500">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidências */}
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-3">Evidências</h4>
              <div className="space-y-2">
                {selectedCase.evidence.map((ev) => (
                  <div key={ev.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-secondary-700">{ev.description}</span>
                      <span className="text-xs text-secondary-500">{ev.type}</span>
                    </div>
                    <p className="text-sm font-semibold text-primary-600">{ev.value}</p>
                    <p className="text-xs text-secondary-400 mt-1">Fonte: {ev.source}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h4 className="text-sm font-semibold text-secondary-700 mb-3">Checklist de Validação</h4>
              <div className="space-y-2">
                {selectedCase.validationChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleValidateChecklist(selectedCase.id, item.id, e.target.checked)}
                      className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <span className={`text-sm flex-1 ${item.checked ? 'line-through text-secondary-400' : 'text-secondary-700'}`}>
                      {item.item}
                    </span>
                    {item.checked && item.checkedAt && (
                      <span className="text-xs text-secondary-400">
                        {new Date(item.checkedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  navigate(location.pathname, {
                    state: { question: `Investigar: ${selectedCase.title}` },
                    replace: true
                  })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Investigar no Assistente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Casos

