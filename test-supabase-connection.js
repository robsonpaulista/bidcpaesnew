// ==========================================
// TESTE DE CONEXÃO COM SUPABASE
// ==========================================

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Carrega .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testando conexão com Supabase...\n')

// Verifica variáveis
console.log('📋 Variáveis de ambiente:')
console.log(`  SUPABASE_URL: ${SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado'}`)
console.log(`  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}`)
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado'}\n`)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios!')
  console.log('\n💡 Dica: Configure no arquivo .env:')
  console.log('  SUPABASE_URL=https://xxxxx.supabase.co')
  console.log('  SUPABASE_ANON_KEY=eyJhbGc...')
  process.exit(1)
}

// Testa conexão
async function testConnection() {
  try {
    console.log('🔌 Testando conexão...')
    
    // Teste 1: Verificar se consegue acessar a API
    const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    if (!healthCheck.ok) {
      throw new Error(`API não respondeu: ${healthCheck.status} ${healthCheck.statusText}`)
    }

    console.log('✅ API do Supabase está acessível\n')

    // Teste 2: Verificar se as tabelas existem
    console.log('📊 Verificando tabelas...')
    
    const tables = ['alerts', 'events', 'cases', 'briefings']
    const results = {}

    for (const table of tables) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        })

        if (response.ok) {
          results[table] = '✅ Existe'
        } else if (response.status === 404) {
          results[table] = '❌ Não encontrada'
        } else {
          results[table] = `⚠️ Erro: ${response.status}`
        }
      } catch (error) {
        results[table] = `❌ Erro: ${error.message}`
      }
    }

    // Mostra resultados
    Object.entries(results).forEach(([table, status]) => {
      console.log(`  ${table}: ${status}`)
    })

    console.log('\n')

    // Teste 3: Tentar inserir um evento de teste (se service role key estiver configurada)
    if (SUPABASE_SERVICE_ROLE_KEY) {
      console.log('🧪 Testando escrita (com service role key)...')
      
      try {
        const testEvent = {
          type: 'routine_executed',
          severity: 'info',
          title: 'Teste de Conexão',
          description: 'Este é um evento de teste para verificar a conexão',
          metadata: { test: true }
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(testEvent)
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Escrita funcionando! Evento de teste criado.')
          console.log(`   ID: ${Array.isArray(data) ? data[0]?.id : data?.id}\n`)
          
          // Limpa o evento de teste
          const eventId = Array.isArray(data) ? data[0]?.id : data?.id
          if (eventId) {
            await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
              }
            })
            console.log('🧹 Evento de teste removido\n')
          }
        } else {
          const error = await response.json().catch(() => ({ message: response.statusText }))
          console.log(`⚠️ Escrita falhou: ${error.message || response.statusText}\n`)
        }
      } catch (error) {
        console.log(`⚠️ Erro ao testar escrita: ${error.message}\n`)
      }
    } else {
      console.log('⚠️ Service Role Key não configurada - pulando teste de escrita\n')
    }

    // Resumo final
    const allTablesExist = Object.values(results).every(r => r.includes('✅'))
    
    if (allTablesExist) {
      console.log('🎉 Tudo funcionando! Conexão com Supabase está OK!')
      console.log('\n✅ Próximos passos:')
      console.log('   1. Configure as variáveis no Vercel (se ainda não fez)')
      console.log('   2. Teste o endpoint /api/orchestrator/run-routines')
      console.log('   3. Verifique se os componentes UI estão mostrando dados')
    } else {
      console.log('⚠️ Algumas tabelas não foram encontradas.')
      console.log('   Verifique se executou o schema.sql no Supabase corretamente.')
    }

  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message)
    console.error('\n💡 Verifique:')
    console.error('   1. Se o SUPABASE_URL está correto')
    console.error('   2. Se o SUPABASE_ANON_KEY está correto')
    console.error('   3. Se o projeto Supabase está ativo')
    process.exit(1)
  }
}

testConnection()

