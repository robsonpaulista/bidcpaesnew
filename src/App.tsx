import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Compras from './pages/Compras'
import Producao from './pages/Producao'
import Estoque from './pages/Estoque'
import Comercial from './pages/Comercial'
import Logistica from './pages/Logistica'
import Financeiro from './pages/Financeiro'
import Assistente from './pages/Assistente'
import Alertas from './pages/Alertas'
import Casos from './pages/Casos'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/producao" element={<Producao />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/comercial" element={<Comercial />} />
        <Route path="/logistica" element={<Logistica />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/casos" element={<Casos />} />
      </Routes>
    </Layout>
  )
}

export default App








