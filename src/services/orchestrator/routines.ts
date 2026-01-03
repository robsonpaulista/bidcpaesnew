// ==========================================
// ROTINAS AUTOMÁTICAS (Versão Local)
// ==========================================
// Executa rotinas automáticas localmente quando a API não está disponível

import { detectDeviations } from './alerts'
import { generateBriefing } from './briefing'
import { supabaseFetch } from '../supabase/client'

export async function runRoutinesLocal(): Promise<{
  success: boolean
  alerts: number
  briefing: boolean
  events: number
}> {
  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    console.log('🔄 Iniciando rotinas automáticas...')
    
    // 1. DETECTA ALERTAS
    console.log('📊 Detectando desvios nos KPIs...')
    const alerts = await detectDeviations()
    console.log(`✅ ${alerts.length} alerta(s) detectado(s)`)

    // 2. SALVA ALERTAS NO SUPABASE
    const savedAlerts = []
    for (const alert of alerts) {
      console.log(`💾 Salvando alerta: ${alert.indicator.label}...`)
      const { data, error } = await supabaseFetch('alerts', {
        method: 'POST',
        body: {
          timestamp: alert.timestamp,
          severity: alert.severity,
          indicator_id: alert.indicator.id,
          indicator_label: alert.indicator.label,
          indicator_area: alert.indicator.area,
          current_value: alert.variation.current,
          previous_value: alert.variation.previous,
          change_value: alert.variation.change,
          unit: alert.variation.unit,
          impact_estimated: alert.impact.estimated,
          impact_financial: alert.impact.financial,
          impact_operational: alert.impact.operational,
          probable_cause: alert.probableCause,
          confidence: alert.confidence,
          status: alert.status,
          investigation_id: alert.investigationId,
          snoozed_until: alert.snoozedUntil,
          acknowledged_by: alert.acknowledgedBy,
          acknowledged_at: alert.acknowledgedAt,
          data_quality: alert.dataQuality,
          last_alert_timestamp: alert.lastAlertTimestamp
        },
        useServiceRole: false // Usa anon key em dev
      })

      if (!error && data) {
        const alertId = Array.isArray(data) ? data[0]?.id : data?.id
        savedAlerts.push(alertId)
        
        // Cria evento para cada alerta novo
        await supabaseFetch('events', {
          method: 'POST',
          body: {
            type: 'alert_created',
            severity: alert.severity,
            title: `Alerta: ${alert.indicator.label}`,
            description: alert.probableCause,
            area: alert.indicator.area,
            related_alert_id: alertId,
            metadata: {
              confidence: alert.confidence,
              impact: alert.impact
            }
          },
          useServiceRole: false
        })
      }
    }

    // 3. GERA BRIEFING DO DIA
    console.log('📝 Gerando briefing do dia...')
    const briefing = await generateBriefing(today)
    console.log('✅ Briefing gerado:', briefing.summary)

    // 4. SALVA BRIEFING NO SUPABASE
    console.log('💾 Salvando briefing no Supabase...')
    const { data: briefingData, error: briefingError } = await supabaseFetch('briefings', {
      method: 'POST',
      body: {
        date: today,
        summary: briefing.summary,
        top_alerts: briefing.topAlerts,
        top_cases: briefing.topCases,
        kpi_highlights: briefing.kpiHighlights,
        recommendations: briefing.recommendations
      },
      useServiceRole: false
    })

    // 5. CRIA EVENTO DE ROTINA EXECUTADA
    await supabaseFetch('events', {
      method: 'POST',
      body: {
        type: 'routine_executed',
        severity: 'info',
        title: 'Rotinas automáticas executadas',
        description: `${alerts.length} alertas detectados, briefing do dia gerado`,
        metadata: {
          alertsCount: alerts.length,
          briefingGenerated: !briefingError
        }
      },
      useServiceRole: false
    })

    if (briefingError) {
      console.error('❌ Erro ao salvar briefing:', briefingError)
    } else {
      console.log('✅ Briefing salvo com sucesso!')
    }

    const duration = Date.now() - startTime
    console.log(`🎉 Rotinas concluídas em ${duration}ms`)

    return {
      success: true,
      alerts: savedAlerts.length,
      briefing: !briefingError,
      events: savedAlerts.length + 1
    }
  } catch (error) {
    console.error('❌ Erro ao executar rotinas localmente:', error)
    throw error
  }
}

