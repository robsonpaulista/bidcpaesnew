// ==========================================
// PAINEL DE INSIGHTS POR ÁREA
// ==========================================
// Mostra trabalho dos agentes em cada página

import { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getBriefing } from '../services/orchestrator/api'

interface Briefing {
  date: string
  summary: string
  topAlerts: Array<{ id: string; severity: string; title: string; area: string }>
  topCases: Array<{ id: string; title: string; status: string; area: string }>
  kpiHighlights: Array<{ kpi: string; value: number | string; trend: 'up' | 'down' | 'stable'; area: string }>
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; area: string }>
}

interface InsightsPanelProps {
  area: string
}

const InsightsPanel = ({ area }: InsightsPanelProps) => {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBriefing()
  }, [])

  const loadBriefing = async () => {
    try {
      const data = await getBriefing()
      if (data) {
        setBriefing(data)
      }
    } catch (error) {
      console.error('Erro ao carregar briefing:', error)
      // Não quebra a aplicação se houver erro
      setBriefing(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!briefing) {
    return null
  }

  // Filtra insights da área específica
  const areaAlerts = briefing.topAlerts.filter(a => a.area === area)
  const areaRecommendations = briefing.recommendations.filter(r => r.area === area)
  const areaKPIs = briefing.kpiHighlights.filter(k => k.area === area)

  if (areaAlerts.length === 0 && areaRecommendations.length === 0 && areaKPIs.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-primary-900">Insights Automáticos</h3>
        <span className="text-xs text-primary-600 bg-primary-200 px-2 py-1 rounded-full">
          {new Date(briefing.date).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Alertas da Área */}
      {areaAlerts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alertas ({areaAlerts.length})
          </h4>
          <div className="space-y-2">
            {areaAlerts.slice(0, 2).map(alert => (
              <div
                key={alert.id}
                className={`text-sm p-2 rounded-lg ${
                  alert.severity === 'P0'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : alert.severity === 'P1'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {alert.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs da Área */}
      {areaKPIs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Destaques
          </h4>
          <div className="space-y-2">
            {areaKPIs.slice(0, 2).map((kpi, idx) => (
              <div key={idx} className="text-sm p-2 bg-white/60 rounded-lg flex items-center justify-between">
                <span className="text-primary-700">{kpi.kpi}</span>
                <div className="flex items-center gap-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : kpi.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600" />
                  )}
                  <span className="font-semibold text-primary-900">{kpi.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações da Área */}
      {areaRecommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-primary-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recomendações ({areaRecommendations.length})
          </h4>
          <div className="space-y-2">
            {areaRecommendations.slice(0, 2).map((rec, idx) => (
              <div
                key={idx}
                className={`text-sm p-2 rounded-lg ${
                  rec.priority === 'high'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                {rec.action}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InsightsPanel

