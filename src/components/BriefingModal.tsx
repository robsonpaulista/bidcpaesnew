// ==========================================
// MODAL DE BRIEFING DO DIA
// ==========================================
// Modal moderno que mostra o briefing quando solicitado

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, AlertTriangle, FileText, TrendingUp, TrendingDown, Lightbulb, RefreshCw, Sparkles } from 'lucide-react'
import { getBriefing } from '../services/orchestrator/api'

interface BriefingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Briefing {
  date: string
  summary: string
  topAlerts: Array<{ id: string; severity: string; title: string; area: string }>
  topCases: Array<{ id: string; title: string; status: string; area: string }>
  kpiHighlights: Array<{ kpi: string; value: number | string; trend: 'up' | 'down' | 'stable'; area: string }>
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; area: string }>
}

const BriefingModal = ({ isOpen, onClose }: BriefingModalProps) => {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadBriefing()
    }
  }, [isOpen])

  const loadBriefing = async () => {
    setLoading(true)
    try {
      const data = await getBriefing()
      if (data) {
        setBriefing(data)
      }
    } catch (error) {
      console.error('Erro ao carregar briefing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBriefing = async () => {
    setGenerating(true)
    try {
      // Tenta executar via API primeiro
      try {
        const response = await fetch('/api/orchestrator/run-routines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          setTimeout(() => loadBriefing(), 2000)
          return
        }
      } catch (apiError) {
        console.warn('⚠️ API não disponível, executando rotinas localmente...')
      }

      // Executa rotinas localmente
      const { runRoutinesLocal } = await import('../services/orchestrator/routines')
      await runRoutinesLocal()
      
      setTimeout(() => loadBriefing(), 2000)
    } catch (error) {
      console.error('Erro ao gerar briefing:', error)
      alert(`Erro ao gerar briefing: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) return null

  const date = briefing?.date 
    ? new Date(briefing.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        // Fecha ao clicar no backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixo no topo */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Briefing do Dia</h2>
                <p className="text-primary-100 text-sm capitalize">{date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadBriefing}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollável */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-white min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-secondary-600">Carregando briefing...</p>
              </div>
            </div>
          ) : !briefing ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-700 mb-2">
                Briefing ainda não foi gerado
              </h3>
              <p className="text-sm text-secondary-500 mb-6">
                As rotinas automáticas executam diariamente às 5h da manhã.
              </p>
              <button
                onClick={handleGenerateBriefing}
                disabled={generating}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 mx-auto"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Briefing Agora
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo Executivo */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 mb-2">Resumo Executivo</h3>
                    <p className="text-secondary-700 leading-relaxed">{briefing.summary}</p>
                  </div>
                </div>
              </div>

              {/* Métricas Rápidas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h4 className="font-medium text-rose-900">Alertas</h4>
                  </div>
                  <p className="text-3xl font-bold text-rose-900">{briefing.topAlerts?.length || 0}</p>
                  <p className="text-xs text-rose-700 mt-1">
                    {briefing.topAlerts?.filter(a => a.severity === 'P0').length || 0} críticos
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Casos</h4>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{briefing.topCases?.length || 0}</p>
                  <p className="text-xs text-blue-700 mt-1">Em investigação</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-medium text-emerald-900">Destaques</h4>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900">{briefing.kpiHighlights?.length || 0}</p>
                  <p className="text-xs text-emerald-700 mt-1">KPIs monitorados</p>
                </div>
              </div>

              {/* Destaques de KPIs */}
              {briefing.kpiHighlights && briefing.kpiHighlights.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    Destaques de KPIs
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {briefing.kpiHighlights.map((kpi, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-secondary-700">{kpi.kpi}</span>
                        <div className="flex items-center gap-2">
                          {kpi.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          ) : kpi.trend === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                          ) : null}
                          <span className="font-semibold text-secondary-900">{kpi.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {briefing.recommendations && briefing.recommendations.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary-600" />
                    Recomendações Prioritárias
                  </h3>
                  <div className="space-y-3">
                    {briefing.recommendations.slice(0, 3).map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${
                          rec.priority === 'high'
                            ? 'bg-rose-50 border-rose-200'
                            : rec.priority === 'medium'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-900">{rec.action}</p>
                            <p className="text-xs text-secondary-600 mt-1">{rec.area}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'high'
                                ? 'bg-rose-200 text-rose-800'
                                : rec.priority === 'medium'
                                ? 'bg-amber-200 text-amber-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Renderiza usando portal para garantir que apareça acima de tudo
  return createPortal(modalContent, document.body)
}

export default BriefingModal

