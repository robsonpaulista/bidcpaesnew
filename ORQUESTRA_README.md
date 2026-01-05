# 🤖 Orquestra de Agentes de IA - BI DC Pães

## Visão Geral

Este projeto adiciona uma camada de inteligência operacional baseada em orquestra de agentes de IA sobre o BI existente. A orquestra **não substitui** o BI tradicional, mas o **complementa** com análises inteligentes, investigações automáticas e orientações para decisão.

## Princípios Fundamentais

✅ **SQL é a fonte da verdade**  
✅ **IA não executa ações irreversíveis**  
✅ **Sem SQL livre gerado por IA em produção**  
✅ **Toda resposta precisa de evidência**  
✅ **Tudo é auditável**

## Arquitetura

### Backend (Orquestrador)

```
src/services/orchestrator/
├── types.ts          # Tipos e contratos
├── adapter.ts        # Adapter de dados (Mock → SQL futuro)
├── maestro.ts        # Orquestrador principal
├── agents/
│   └── index.ts      # Agentes especialistas
├── api.ts            # Serviço de API (simula endpoints)
└── alerts.ts         # Rotinas de alertas automáticos
```

### Frontend

```
src/pages/
├── Assistente.tsx    # Chat de decisão
├── Alertas.tsx       # Alertas inteligentes
└── Casos.tsx         # Casos operacionais
```

## Como Funciona

### 1. Modo Perguntar (Chat)

O usuário faz perguntas em linguagem natural:
- "Por que a margem do flocão caiu em dezembro?"
- "Onde estão as maiores perdas esta semana?"

O **Maestro**:
1. Analisa a intenção
2. Cria plano de investigação
3. Aciona agentes especialistas relevantes
4. Consolida respostas
5. Retorna síntese executiva + causas + evidências + ações

### 2. Modo Alertas

Rotinas automáticas:
- Analisam KPIs periodicamente
- Detectam desvios relevantes
- Classificam severidade (P0, P1, P2)
- Geram alertas com causa provável

### 3. Modo Casos

Investigação estruturada:
- Hipóteses levantadas
- Dados consultados
- Evidências coletadas
- Checklist de validação humana

## Agentes Especialistas

| Agente | Domínio | Responsabilidades |
|--------|---------|-------------------|
| `custos_margem` | Custos & Margem | Analisa margens por produto, breakdown de custos |
| `compras_fornecedores` | Compras | Performance de fornecedores, variações de preço |
| `producao` | Produção | OEE, perdas, eficiência de linhas |
| `estoque_logistica` | Estoque & Logística | OTIF, cobertura de estoque |
| `comercial` | Comercial | Mix de vendas, performance comercial |
| `financeiro` | Financeiro | Inadimplência, PMR, indicadores financeiros |

## Funções Semânticas (Contratos de Dados)

Os agentes não acessam tabelas diretamente. Eles chamam funções semânticas:

- `get_kpis_overview(period, unit?, line?)`
- `get_margin_by_product(period)`
- `get_cost_breakdown(product, period)`
- `get_losses_by_line(period)`
- `get_oee(line, period)`
- `get_supplier_variation(input, period)`
- `get_stock_coverage(product, period)`
- `get_otif(period)`
- `get_sales_mix(period, channel?)`

⚠️ **O contrato não muda quando trocar Mock por SQL.**

## Uso

### Assistente de Operações

1. Acesse `/assistente`
2. Faça uma pergunta sobre seus indicadores
3. Receba análise estruturada com:
   - Síntese executiva
   - Top 3 causas prováveis
   - Evidências numéricas
   - Ações sugeridas
   - Links para validação no BI

### Alertas Inteligentes

1. Acesse `/alertas`
2. Veja alertas gerados automaticamente
3. Filtre por severidade (P0, P1, P2)
4. Clique em "Investigação" para análise detalhada

### Casos Operacionais

1. Acesse `/casos`
2. Veja casos de investigação estruturada
3. Valide hipóteses e checklist
4. Acompanhe evolução do caso

## Próximos Passos

### Fase Atual (Mock)
- ✅ Estrutura completa implementada
- ✅ Agentes funcionando com dados mockados
- ✅ UI completa e integrada

### Fase Pós-Migração (SQL)
1. Criar views/procedures SQL para cada função semântica
2. Substituir `AdapterMock` por `AdapterSQL`
3. Manter os mesmos contratos (sem refatoração estrutural)

### Melhorias Futuras
- Integração com LLM real (OpenAI, Anthropic, etc.)
- Rotinas automáticas com cron jobs
- Sistema de tickets
- Dashboard de meta-KPIs da orquestra

## Deploy

### Frontend (Vercel)
```bash
npm run build
vercel deploy
```

### Backend (Serverless Functions)
As funções serverless podem ser criadas em `/api/orchestrator/`:
- `ask.ts` - POST /api/orchestrator/ask
- `alerts.ts` - GET /api/orchestrator/alerts
- `cases.ts` - GET /api/orchestrator/cases

## Regra Final

**BI mostra números.**  
**Orquestra explica, investiga e prioriza.**  
**Humanos decidem.**






