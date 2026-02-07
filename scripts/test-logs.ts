/**
 * Script para testar e verificar os logs de auditoria
 * Execute com: 
 * source .env.local (se existir) ou exporte as variáveis manualmente
 * npx tsx scripts/test-logs.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\n💡 Dica: Exporte as variáveis antes de executar:')
  console.error('   export NEXT_PUBLIC_SUPABASE_URL="sua-url"')
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="sua-chave"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLogs() {
  console.log('🔍 Verificando logs de auditoria...\n')

  // Teste 1: Verificar se a tabela existe
  console.log('1️⃣ Verificando se a tabela admin_audit_logs existe...')
  const { data: tables, error: tablesError } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .limit(1)

  if (tablesError) {
    console.error('❌ Erro ao acessar tabela:', tablesError)
    return
  }
  console.log('✅ Tabela admin_audit_logs existe\n')

  // Teste 2: Contar logs
  console.log('2️⃣ Contando logs...')
  const { count, error: countError } = await supabase
    .from('admin_audit_logs')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Erro ao contar logs:', countError)
    return
  }
  console.log(`✅ Total de logs: ${count}\n`)

  // Teste 3: Buscar todos os logs
  console.log('3️⃣ Buscando todos os logs...')
  const { data: logs, error: logsError } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (logsError) {
    console.error('❌ Erro ao buscar logs:', logsError)
    return
  }

  if (logs && logs.length > 0) {
    console.log(`✅ Encontrados ${logs.length} logs:`)
    logs.forEach((log, index) => {
      console.log(`\n  Log ${index + 1}:`)
      console.log(`    ID: ${log.id}`)
      console.log(`    Ação: ${log.action}`)
      console.log(`    Admin ID: ${log.admin_user_id}`)
      console.log(`    Target ID: ${log.target_user_id}`)
      console.log(`    Metadata: ${JSON.stringify(log.metadata)}`)
      console.log(`    Data: ${log.created_at}`)
    })
  } else {
    console.log('⚠️  Nenhum log encontrado')
  }

  // Teste 4: Buscar logs com join
  console.log('\n4️⃣ Buscando logs com join de users_cards...')
  const { data: logsWithJoin, error: joinError } = await supabase
    .from('admin_audit_logs')
    .select(`
      *,
      users_cards:target_user_id (
        name,
        cpf,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (joinError) {
    console.error('❌ Erro ao buscar logs com join:', joinError)
  } else if (logsWithJoin && logsWithJoin.length > 0) {
    console.log(`✅ Logs com join funcionando! Total: ${logsWithJoin.length}`)
    logsWithJoin.forEach((log, index) => {
      console.log(`\n  Log ${index + 1}:`)
      console.log(`    Ação: ${log.action}`)
      console.log(`    Usuária: ${log.users_cards?.name || 'N/A'}`)
      console.log(`    CPF: ${log.users_cards?.cpf || 'N/A'}`)
    })
  } else {
    console.log('⚠️  Nenhum log com join encontrado')
  }

  // Teste 5: Criar um log de teste
  console.log('\n5️⃣ Criando log de teste...')
  const { data: testLog, error: insertError } = await supabase
    .from('admin_audit_logs')
    .insert({
      admin_user_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      action: 'TESTE_SISTEMA',
      target_user_id: null,
      metadata: { teste: true, timestamp: new Date().toISOString() },
    })
    .select()

  if (insertError) {
    console.error('❌ Erro ao criar log de teste:', insertError)
  } else {
    console.log('✅ Log de teste criado com sucesso!')
  }

  console.log('\n✨ Diagnóstico concluído!')
}

testLogs().catch(console.error)
