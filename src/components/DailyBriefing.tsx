// ==========================================
// RESUMO DO DIA (Home)
// ==========================================
// Mostra briefing gerado automaticamente pelos agentes

import { useState, useEffect } from 'react'
import { Calendar, AlertTriangle, FileText, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react'
import { getBriefing } from '../services/orchestrator/api'

interface Briefing {
  date: string
  summary: string
  topAlerts: Array<{ id: string; severity: string; title: string; area: string }>
  topCases: Array<{ id: string; title: string; status: string; area: string }>
  kpiHighlights: Array<{ kpi: string; value: number | string; trend: 'up' | 'down' | 'stable'; area: string }>
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; area: string }>
}

const DailyBriefing = () => {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBriefing()
  }, [])

  const loadBriefing = async () => {
    setLoading(true)
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
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!briefing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-card p-6">
        <div className="text-center text-secondary-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="mb-2">Briefing do dia ainda não foi gerado.</p>
          <p className="text-sm mb-4">As rotinas automáticas executam diariamente.</p>
          <button
            onClick={async () => {
              try {
                setLoading(true)
                
                // Tenta executar via API primeiro
                try {
                  const response = await fetch('/api/orchestrator/run-routines', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  })
                  
                  if (response.ok) {
                    // Aguarda um pouco e recarrega o briefing
                    setTimeout(() => {
                      loadBriefing()
                    }, 2000)
                    return
                  }
                } catch (apiError) {
                  // Se a API não estiver disponível, usa versão local
                  console.warn('⚠️ API não disponível, executando rotinas localmente...')
                }

                // Executa rotinas localmente
                const { runRoutinesLocal } = await import('../services/orchestrator/routines')
                console.log('🚀 Executando rotinas localmente...')
                const result = await runRoutinesLocal()
                
                console.log('📊 Resultado das rotinas:', result)
                
                if (result.success) {
                  console.log(`✅ Rotinas executadas: ${result.alerts} alertas, briefing: ${result.briefing ? 'sim' : 'não'}, ${result.events} eventos`)
                  // Aguarda um pouco e recarrega o briefing
                  setTimeout(() => {
                    console.log('🔄 Recarregando briefing...')
                    loadBriefing()
                  }, 2000)
                } else {
                  alert('Erro ao gerar briefing. Verifique o console.')
                  setLoading(false)
                }
              } catch (error) {
                console.error('Erro ao executar rotinas:', error)
                alert(`Erro ao executar rotinas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
                setLoading(false)
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Gerando...' : 'Gerar Briefing Agora'}
          </button>
          <p className="text-xs text-secondary-400 mt-3">
            💡 Em produção, isso acontece automaticamente via cron
          </p>
        </div>
      </div>
    )
  }

  const date = new Date(briefing.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 shadow-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Resumo do Dia</h3>
            <p className="text-sm text-primary-600 capitalize">{date}</p>
          </div>
        </div>
        <button
          onClick={loadBriefing}
          className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-200 rounded-lg transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Resumo Executivo */}
      <div className="mb-6 p-4 bg-white/60 rounded-lg border border-primary-200">
        <p className="text-primary-800 leading-relaxed">{briefing.summary}</p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Alertas */}
        <div className="bg-white/60 rounded-lg p-4 border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h4 className="font-medium text-primary-900">Alertas</h4>
          </div>
          <p className="text-2xl font-bold text-primary-900">{briefing.topAlerts?.length || 0}</p>
          <p className="text-xs text-primary-600 mt-1">
            {briefing.topAlerts?.filter(a => a.severity === 'P0').length || 0} críticos
          </p>
        </div>

        {/* Casos */}
        <div className="bg-white/60 rounded-lg p-4 border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-primary-900">Casos</h4>
          </div>
          <p className="text-2xl font-bold text-primary-900">{briefing.topCases?.length || 0}</p>
          <p className="text-xs text-primary-600 mt-1">Em investigação</p>
        </div>

        {/* KPIs */}
        <div className="bg-white/60 rounded-lg p-4 border border-primary-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h4 className="font-medium text-primary-900">Destaques</h4>
          </div>
          <p className="text-2xl font-bold text-primary-900">{briefing.kpiHighlights?.length || 0}</p>
          <p className="text-xs text-primary-600 mt-1">KPIs monitorados</p>
        </div>
      </div>

      {/* Recomendações */}
      {briefing.recommendations && briefing.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-primary-600" />
            <h4 className="font-medium text-primary-900">Recomendações Prioritárias</h4>
          </div>
          <div className="space-y-2">
            {briefing.recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  rec.priority === 'high'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-white/60 border-primary-200 text-primary-800'
                }`}
              >
                <p className="text-sm">{rec.action}</p>
                <p className="text-xs text-primary-600 mt-1">{rec.area}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyBriefing

