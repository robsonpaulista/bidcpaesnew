-- ==========================================
-- SCHEMA SUPABASE - ORQUESTRA DE AGENTES
-- ==========================================
-- Tabelas para persistência de briefings, events, alerts e cases

-- ==========================================
-- ALERTAS (Alertas Inteligentes)
-- ==========================================

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('P0', 'P1', 'P2')),
  indicator_id VARCHAR(100) NOT NULL,
  indicator_label VARCHAR(255) NOT NULL,
  indicator_area VARCHAR(100) NOT NULL,
  current_value NUMERIC NOT NULL,
  previous_value NUMERIC NOT NULL,
  change_value NUMERIC NOT NULL,
  unit VARCHAR(20),
  impact_estimated TEXT,
  impact_financial NUMERIC,
  impact_operational TEXT,
  probable_cause TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'acknowledged', 'resolved')),
  investigation_id UUID,
  snoozed_until TIMESTAMPTZ,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMPTZ,
  data_quality VARCHAR(20) CHECK (data_quality IN ('complete', 'incomplete', 'suspicious')),
  last_alert_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_indicator ON alerts(indicator_id, indicator_area);

-- ==========================================
-- EVENTOS (Feed de Atividades)
-- ==========================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'alert_created',
    'alert_acknowledged',
    'case_created',
    'case_resolved',
    'investigation_completed',
    'kpi_threshold_exceeded',
    'routine_executed'
  )),
  severity VARCHAR(10) CHECK (severity IN ('P0', 'P1', 'P2', 'info')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  area VARCHAR(100),
  related_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  related_case_id UUID,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_read ON events(read);
CREATE INDEX IF NOT EXISTS idx_events_area ON events(area);

-- ==========================================
-- CASOS OPERACIONAIS
-- ==========================================

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN (
    'aberto',
    'em_investigacao',
    'validado',
    'resolvido',
    'arquivado'
  )),
  severity VARCHAR(10) CHECK (severity IN ('P0', 'P1', 'P2')),
  area VARCHAR(100),
  orchestrator_response_id VARCHAR(100),
  assignee VARCHAR(255),
  tags TEXT[],
  related_kpis TEXT[],
  related_entities JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Tabela de hipóteses do caso
CREATE TABLE IF NOT EXISTS case_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  validated_by VARCHAR(255),
  validated_at TIMESTAMPTZ,
  evidence TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de checklist de validação
CREATE TABLE IF NOT EXISTS case_validation_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by VARCHAR(255),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de validações
CREATE TABLE IF NOT EXISTS case_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  hypothesis_id UUID REFERENCES case_hypotheses(id) ON DELETE SET NULL,
  validated BOOLEAN NOT NULL,
  comment TEXT,
  validated_by VARCHAR(255) NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para casos
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_area ON cases(area);
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_hypotheses_case ON case_hypotheses(case_id);

-- ==========================================
-- BRIEFINGS (Resumo do Dia)
-- ==========================================

CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  top_alerts JSONB NOT NULL,
  top_cases JSONB NOT NULL,
  kpi_highlights JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para briefings
CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(date DESC);

-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- RLS (Row Level Security) - Opcional
-- ==========================================

-- Se quiser habilitar RLS no futuro:
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

-- Política de exemplo (todos podem ler, apenas service role pode escrever):
-- CREATE POLICY "Allow read access" ON alerts FOR SELECT USING (true);
-- CREATE POLICY "Allow service role write" ON alerts FOR ALL USING (auth.role() = 'service_role');

