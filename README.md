# 🥖 BI DC Pães - Dashboard de Business Intelligence

Painel de Business Intelligence completo para indústria de pães, desenvolvido com React, TypeScript e design moderno.

![Version](https://img.shields.io/badge/version-1.0.0-orange)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 📊 Visão Geral

Este dashboard oferece uma visão completa de todas as áreas da operação:

### 🏠 Home - Visão Geral
- KPIs principais (Receita, Volume, Margem, Perdas, OTIF, Giro, EBITDA)
- Gráfico de evolução da receita mensal
- Distribuição de perdas por área
- Volume por categoria de produto
- Indicadores de performance geral

### 🟡 Compras (Matéria-Prima)
- Custo médio por matéria-prima
- Performance de fornecedores (OTD, Fill Rate, Qualidade)
- Evolução de preços ao longo do tempo
- Saving gerado por negociações
- Análise de dependência de fornecedores

### 🟠 Produção
- OEE (Overall Equipment Effectiveness) com breakdown
- Produtividade por turno e linha
- Perdas de processo por tipo
- Rendimento por linha de produção
- MTBF e MTTR
- Indicadores de qualidade (temperatura, pH, umidade)

### 🟢 Estoque
- Giro e cobertura por categoria
- Acurácia de estoque
- Produtos próximos ao vencimento
- Avarias por tipo e causa
- Saúde geral do inventário

### 🔵 Comercial
- Faturamento e volume de vendas
- Vendas por região
- Mix de produtos (atual vs ideal)
- Ranking de vendedores
- Análise de clientes por faixa de faturamento
- Funil de clientes

### 🟣 Logística
- OTIF (On Time In Full)
- Custo por rota e por entrega
- Motivos de devolução
- Performance de veículos
- Composição do custo logístico

### 🟤 Financeiro
- DRE resumido
- Fluxo de caixa
- Despesas por centro de custo
- Contas a receber (aging)
- Ciclo financeiro (PME, PMR, PMP)
- Ponto de equilíbrio e margem de segurança

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <repository-url>

# Entre na pasta do projeto
cd bi-dc-paes

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

O dashboard estará disponível em `http://localhost:3000`

### Build para Produção

```bash
npm run build
npm run preview
```

## 🚀 Deploy no Vercel

O projeto está configurado e pronto para deploy no Vercel!

### Opção 1: Deploy via CLI

```bash
# Instale a CLI do Vercel (se ainda não tiver)
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel

# Para produção
vercel --prod
```

### Opção 2: Deploy via GitHub

1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "Add New Project"
4. Importe o repositório
5. O Vercel detectará automaticamente as configurações:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Clique em "Deploy"

### Configuração Automática

O arquivo `vercel.json` já está configurado para:
- ✅ Build automático com Vite
- ✅ Suporte a React Router (SPA)
- ✅ Redirecionamento de todas as rotas para `index.html`

### Variáveis de Ambiente

Atualmente não são necessárias variáveis de ambiente, pois os dados são mockados. Quando integrar com API real, adicione as variáveis no painel do Vercel.

## 🛠️ Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Lucide React** - Ícones
- **React Router** - Navegação
- **Framer Motion** - Animações

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Layout.tsx       # Layout principal
│   ├── Sidebar.tsx      # Menu lateral
│   ├── Header.tsx       # Cabeçalho
│   ├── KPICard.tsx      # Cards de KPI
│   ├── ChartCard.tsx    # Container para gráficos
│   ├── DataTable.tsx    # Tabela de dados
│   ├── Badge.tsx        # Badges/tags
│   ├── ProgressBar.tsx  # Barras de progresso
│   └── PageHeader.tsx   # Cabeçalho de páginas
├── pages/               # Páginas do dashboard
│   ├── Home.tsx         # Visão geral
│   ├── Compras.tsx      # Matéria-prima
│   ├── Producao.tsx     # Produção
│   ├── Estoque.tsx      # Estoque
│   ├── Comercial.tsx    # Vendas
│   ├── Logistica.tsx    # Logística
│   └── Financeiro.tsx   # Financeiro
├── services/            # Serviços e dados
│   └── mockData.ts      # Dados mockados
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
└── index.css            # Estilos globais
```

## 🎨 Design

O dashboard foi desenvolvido com foco em:

- **UX Profissional**: Interface limpa e intuitiva
- **Design Moderno**: Gradientes sutis, sombras suaves, bordas arredondadas
- **Responsividade**: Funciona em todas as telas (desktop, tablet, mobile)
- **Consistência**: Sistema de cores e tipografia coeso
- **Acessibilidade**: Contraste adequado e navegação por teclado

### Paleta de Cores

- **Primary**: Laranja (#ed751c) - Cor da marca
- **Secondary**: Slate (#536175) - Textos e elementos neutros
- **Success**: Verde (#22c55e) - Indicadores positivos
- **Warning**: Amarelo (#f59e0b) - Atenção
- **Danger**: Vermelho (#ef4444) - Indicadores negativos
- **Info**: Azul (#3b82f6) - Informações

## 📈 Dados

Atualmente o dashboard utiliza dados mockados (`src/services/mockData.ts`) para demonstração. Para integrar com dados reais:

1. Substitua os dados em `mockData.ts` por chamadas de API
2. Ou crie hooks customizados para fetch de dados
3. Os tipos TypeScript já estão definidos para facilitar a integração

## 📝 Licença

Este projeto foi desenvolvido para Dona Conceição Pães.

---

Desenvolvido com ❤️ e React







