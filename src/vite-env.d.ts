/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase (SEGURO - anon key é feita para ser pública)
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  
  // LLM - NÃO USAR VITE_! Chaves secretas ficam no backend (process.env.GROQ_API_KEY)
  // Essas variáveis abaixo são apenas para referência/documentação, não devem ser usadas
  readonly VITE_LLM_PROVIDER?: string
  readonly VITE_LLM_API_KEY?: string // ⚠️ DEPRECATED - não usar! Use backend
  readonly VITE_LLM_MODEL?: string
  
  // Vite built-in
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

