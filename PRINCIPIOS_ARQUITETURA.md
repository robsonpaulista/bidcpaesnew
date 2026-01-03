# 🎯 Princípios Fundamentais da Arquitetura

## Regra de Ouro: LLM NÃO DECIDE NADA

### ❌ LLM NÃO PODE:
- ❌ Decidir o plano de investigação
- ❌ Escolher quais queries executar
- ❌ Criar lógica de negócio
- ❌ Decidir quais agentes acionar
- ❌ Decidir a estrutura da resposta

### ✅ LLM APENAS:
- ✅ Mapeia pergunta → intenção de negócio
- ✅ Extrai entidades (kpi, produto, período, etc)
- ✅ Retorna confiança do mapeamento

### ✅ ORQUESTRADOR (Código) DECIDE:
- ✅ Qual plano usar (baseado na intenção)
- ✅ Quais funções chamar (definidas no plano)
- ✅ Quais agentes acionar (definidos na intenção)
- ✅ Como estruturar a resposta (definido na intenção)
- ✅ Toda a lógica de negócio

## Estrutura de Resposta do LLM

O LLM retorna **APENAS**:

```json
{
  "intent": "analyze_revenue_trend",
  "confidence": 0.91,
  "entities": {
    "kpi": "faturamento",
    "produto": "flocão",
    "periodo": "dezembro"
  }
}
```

**Nada mais!**

## Fluxo Completo

```
1. Usuário: "qual a oscilação do faturamento em dezembro?"
   ↓
2. LLM mapeia → {
     intent: "analyze_revenue_trend",
     entities: { periodo: "dezembro" }
   }
   ↓
3. ORQUESTRADOR decide:
   - Usa intenção "analyze_revenue_trend"
   - Busca plano pré-definido dessa intenção
   - Plano diz: [get_kpis_overview, get_revenue_monthly]
   - Usa entidade "periodo: dezembro" como parâmetro
   ↓
4. ORQUESTRADOR executa:
   - Chama get_revenue_monthly(period: "dezembro")
   - Chama get_kpis_overview(period: "dezembro")
   ↓
5. ORQUESTRADOR consolida:
   - Estrutura resposta conforme definição da intenção
   - Adiciona evidências, causas, recomendações
   ↓
6. Retorna resposta estruturada
```

## Por Que Isso Importa?

### ✅ Governança
- Sempre sabe o que vai acontecer
- Planos são auditáveis
- Lógica de negócio está no código

### ✅ Previsibilidade
- Mesma intenção = mesmo plano
- Não depende de "criatividade" do LLM
- Resultados consistentes

### ✅ Manutenibilidade
- Adicionar nova intenção = adicionar plano
- Não precisa "treinar" LLM
- Fácil debugar e testar

### ✅ Segurança
- LLM não pode executar queries perigosas
- Planos são validados
- Limites claros

## Exemplo Prático

**Pergunta:** "Por que a margem do flocão caiu em dezembro?"

**LLM retorna:**
```json
{
  "intent": "analyze_margin_decline",
  "confidence": 0.95,
  "entities": {
    "kpi": "margem",
    "produto": "flocão",
    "periodo": "dezembro"
  }
}
```

**Orquestrador decide:**
1. Intenção: `analyze_margin_decline`
2. Plano pré-definido:
   - `get_kpis_overview(period: "dezembro", unit: "financeiro")`
   - `get_margin_by_product(period: "dezembro")`
   - `get_cost_breakdown(product: "flocão", period: "dezembro")`
3. Executa plano
4. Consolida resposta

**LLM nunca viu o plano, nunca decidiu nada!**

## Checklist de Implementação

- [x] LLM retorna apenas intenção + entidades
- [x] Orquestrador decide plano baseado na intenção
- [x] Planos são pré-definidos (não gerados)
- [x] Funções são chamadas conforme plano
- [x] Estrutura de resposta é definida no código
- [x] Auditoria registra todas as decisões

---

**Esta arquitetura transforma IA em infraestrutura confiável, não em caixa preta.**




