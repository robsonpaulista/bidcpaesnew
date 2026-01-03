import { ReactNode, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatWidget from './ChatWidget'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)
  const location = useLocation()
  
  // Pega pergunta inicial do state da navegação
  const initialQuestion = location.state?.question as string | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Header 
          onMenuClick={() => {
            if (window.innerWidth >= 1024) {
              setSidebarOpen(!sidebarOpen)
            } else {
              setMobileSidebarOpen(!mobileSidebarOpen)
            }
          }}
        />
        
        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-[1920px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Chat Widget - Disponível em todas as páginas */}
      <ChatWidget initialQuestion={initialQuestion} />
    </div>
  )
}

export default Layout








