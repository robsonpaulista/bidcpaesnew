// ==========================================
// FEED DE EVENTOS (Sino no Topbar)
// ==========================================
// Mostra atividades dos agentes em tempo real

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, AlertTriangle, FileText, Activity, X, Sparkles } from 'lucide-react'
import { getEvents, markEventAsRead } from '../services/orchestrator/api'
import BriefingModal from './BriefingModal'

interface Event {
  id: string
  timestamp: string
  type: string
  severity: string
  title: string
  description?: string
  area?: string
  read: boolean
}

const EventsFeed = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadEvents()
    // Atualiza a cada 30 segundos
    const interval = setInterval(loadEvents, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadEvents = async () => {
    try {
      const data = await getEvents(10)
      const eventsList = Array.isArray(data) ? data : []
      setEvents(eventsList)
      setUnreadCount(eventsList.filter((e: Event) => !e.read).length)
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
      // Não quebra a aplicação se houver erro
      setEvents([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (eventId: string) => {
    try {
      await markEventAsRead(eventId)
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, read: true } : e))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erro ao marcar evento como lido:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadEvents = events.filter(e => !e.read)
    for (const event of unreadEvents) {
      await handleMarkAsRead(event.id)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert_created':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />
      case 'case_created':
      case 'case_resolved':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'investigation_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default:
        return <Activity className="w-4 h-4 text-slate-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0':
        return 'bg-red-500'
      case 'P1':
        return 'bg-amber-500'
      case 'P2':
        return 'bg-blue-500'
      default:
        return 'bg-slate-500'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-600 hover:text-primary-600 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-dark-900">Atividades</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
                setBriefingModalOpen(true)
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2 font-medium text-sm shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Ver Briefing do Dia
            </button>
          </div>

          {/* Lista de Eventos */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-secondary-500">Carregando...</div>
            ) : events.length === 0 ? (
              <div className="p-4 text-center text-secondary-500">
                Nenhuma atividade recente
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map(event => (
                  <div
                    key={event.id}
                    className={`p-4 hover:bg-slate-50 transition-colors ${
                      !event.read ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getEventIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-dark-900">{event.title}</p>
                          {!event.read && (
                            <span className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-secondary-600 mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-500">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                          {!event.read && (
                            <button
                              onClick={() => handleMarkAsRead(event.id)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Briefing */}
      <BriefingModal 
        isOpen={briefingModalOpen} 
        onClose={() => setBriefingModalOpen(false)} 
      />
    </div>
  )
}

export default EventsFeed

