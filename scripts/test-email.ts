/**
 * Script para testar o envio de emails
 * Execute: npx tsx scripts/test-email.ts
 */

import { Resend } from "resend"
import { firstAccessEmailTemplate } from "../lib/email-templates"

async function testEmail() {
    console.log("🔍 Testando configuração de email...")
    console.log("=" .repeat(60))
    
    // Check environment variables
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    console.log("✅ RESEND_API_KEY:", apiKey ? `${apiKey.substring(0, 10)}...` : "❌ NÃO CONFIGURADA")
    console.log("✅ RESEND_FROM_EMAIL:", fromEmail)
    console.log("✅ NEXT_PUBLIC_SITE_URL:", siteUrl)
    console.log("=" .repeat(60))
    
    if (!apiKey) {
        console.error("❌ ERRO: RESEND_API_KEY não está configurada!")
        console.log("\nConfigure no arquivo .env.local:")
        console.log("RESEND_API_KEY=re_sua_chave_aqui")
        return
    }
    
    // Initialize Resend
    const resend = new Resend(apiKey)
    
    // Test data
    const testEmail = process.argv[2] || "seu-email@exemplo.com"
    const testName = "Usuário Teste"
    const testToken = "test-token-123"
    const testLink = `${siteUrl}/primeiro-acesso/${testToken}`
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)
    
    console.log("\n📧 Enviando email de teste para:", testEmail)
    console.log("Nome:", testName)
    console.log("Link:", testLink)
    console.log("Expira em:", expiresAt.toLocaleString('pt-BR'))
    console.log("=" .repeat(60))
    
    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: testEmail,
            subject: '🧪 TESTE - Carteirinha Aprovada - Defina sua Senha | MAF Card System',
            html: firstAccessEmailTemplate(testName, testLink, expiresAt)
        })
        
        if (error) {
            console.error("❌ ERRO ao enviar email:", error)
            return
        }
        
        console.log("✅ Email enviado com sucesso!")
        console.log("ID do email:", data?.id)
        console.log("\n💡 Dicas:")
        console.log("1. Verifique sua caixa de entrada")
        console.log("2. Confira também a pasta de SPAM")
        console.log("3. Monitore em: https://resend.com/emails")
        
    } catch (error) {
        console.error("❌ EXCEÇÃO ao enviar email:", error)
    }
}

// Carregar variáveis de ambiente
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

testEmail()
