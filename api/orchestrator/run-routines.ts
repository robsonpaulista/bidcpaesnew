// ==========================================
// VERCEL SERVERLESS FUNCTION - /api/orchestrator/run-routines
// ==========================================
// Executa rotinas automáticas: gera alertas, cria eventos, gera briefing
// Deve ser chamado via cron (GitHub Actions) 1x por dia

interface VercelRequest {
  method?: string
  body?: any
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string>
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (data: any) => void
  setHeader: (key: string, value: string) => void
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({})
    return
  }

  // Apenas POST ou GET (GET para teste manual)
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Verifica token de autorização (proteção básica)
  // Permite execução sem token apenas em desenvolvimento ou se não estiver configurado
  const authToken = req.headers?.['authorization'] || req.query?.token
  const expectedToken = process.env.ROUTINES_AUTH_TOKEN

  // Em desenvolvimento, permite execução sem token se não estiver configurado
  const isDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL
  
  if (expectedToken && !isDev) {
    const token = typeof authToken === 'string' 
      ? authToken.replace('Bearer ', '')
      : authToken
    
    if (token !== expectedToken) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
  }

  try {
    const startTime = Date.now()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // 1. DETECTA ALERTAS
    const { detectDeviations } = await import('../../src/services/orchestrator/alerts')
    const alerts = await detectDeviations()

    // 2. SALVA ALERTAS NO SUPABASE
    const { supabaseFetch } = await import('../../src/services/supabase/client')
    
    const savedAlerts = []
    for (const alert of alerts) {
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
        useServiceRole: true
      })

      if (!error && data) {
        savedAlerts.push(data)
        
        // Cria evento para cada alerta novo
        await supabaseFetch('events', {
          method: 'POST',
          body: {
            type: 'alert_created',
            severity: alert.severity,
            title: `Alerta: ${alert.indicator.label}`,
            description: alert.probableCause,
            area: alert.indicator.area,
            related_alert_id: Array.isArray(data) ? data[0]?.id : data?.id,
            metadata: {
              confidence: alert.confidence,
              impact: alert.impact
            }
          },
          useServiceRole: true
        })
      }
    }

    // 3. GERA BRIEFING DO DIA
    const { generateBriefing } = await import('../../src/services/orchestrator/briefing')
    const briefing = await generateBriefing(today)

    // 4. SALVA BRIEFING NO SUPABASE
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
      useServiceRole: true
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
      useServiceRole: true
    })

    const duration = Date.now() - startTime

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      date: today,
      results: {
        alerts: {
          detected: alerts.length,
          saved: savedAlerts.length
        },
        briefing: {
          generated: !briefingError,
          id: Array.isArray(briefingData) ? briefingData[0]?.id : briefingData?.id
        },
        events: savedAlerts.length + 1 // Alerts + routine_executed
      },
      duration: `${duration}ms`
    })
  } catch (error) {
    console.error('❌ Erro ao executar rotinas:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage 
    })
  }
}

