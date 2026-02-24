/**
 * Template de email de notificação de aprovação do MAF Pro ID
 * Enviado quando o admin aprova o acesso de um usuário ao módulo MAF Pro ID
 */
export function mafProIdApprovedEmailTemplate(name: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAF Pro ID Aprovado!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Seu MAF Pro ID foi Aprovado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Temos uma ótima notícia! Seu certificado foi <strong style="color: #10b981;">validado com sucesso</strong> e seu acesso ao MAF Pro ID foi aprovado! 🎊
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Agora você tem acesso completo à sua carteirinha profissional digital e pode:
              </p>

              <!-- Benefits List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ✅ <strong>Visualizar</strong> sua carteirinha digital
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ✅ <strong>Baixar</strong> o PDF da sua carteirinha
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ✅ <strong>Compartilhar</strong> seu QR Code de validação
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ✅ <strong>Gerenciar</strong> seus dados profissionais
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mafpro.amandafernandes.com'}/portal/carteira-profissional" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Acessar Minha Carteirinha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Dica:</strong> Faça login no portal e acesse a seção "Carteira Profissional" para visualizar e baixar sua carteirinha digital.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Parabéns pela conquista! 🎓
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MAF Pro - Sistema de Carteirinha Profissional
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Template de email de boas-vindas - enviado para TODOS que fazem cadastro
 * Personaliza a mensagem dependendo se foi aprovado automaticamente ou está pendente
 */
export function welcomeEmailTemplate(name: string, accessLink: string, expiresAt: Date, isApproved: boolean) {
  const statusMessage = isApproved
    ? `<p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Sua carteirinha profissional foi <strong style="color: #10b981;">aprovada automaticamente</strong>! 🎉
       </p>
       <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Após definir sua senha, você terá acesso completo ao seu MAF Pro ID e poderá baixar sua carteirinha digital.
       </p>`
    : `<p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Seu cadastro foi recebido com sucesso! 📋
       </p>
       <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Seu certificado será analisado pela nossa equipe. Enquanto isso, você já pode acessar o sistema após definir sua senha.
       </p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
         <tr>
           <td style="padding: 16px;">
             <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
               📋 <strong>Sobre o MAF Pro ID:</strong> Você poderá fazer login no portal, mas o acesso à sua carteirinha profissional digital será liberado após a validação do seu certificado. Você receberá um email quando for aprovado!
             </p>
           </td>
         </tr>
       </table>`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vinda ao MAF Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Bem-vinda ao MAF Pro!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>
              
              ${statusMessage}

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para acessar o sistema, você precisa criar uma senha. Clique no botão abaixo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${accessLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Definir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 10px 0 0 0; color: #059669; font-size: 14px; word-break: break-all; text-align: center; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace;">
                ${accessLink}
              </p>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>Importante:</strong> Este link expira em <strong>${expiresAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })}</strong> (72 horas).
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                🔒 <strong>Dica de segurança:</strong> Nunca compartilhe este link com outras pessoas. Ele é pessoal e intransferível.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MAF Pro - Sistema de Carteirinha Profissional
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function passwordResetEmailTemplate(name: string, resetLink: string, expiresAt: Date) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - MAF Card System</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #7c3aed; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔒 Recuperação de Senha
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para <strong>redefinir sua senha</strong> no MAF Card System.
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Se você não solicitou essa redefinição, pode ignorar este email. Sua senha atual continuará ativa.
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para criar uma nova senha, clique no botão abaixo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all; text-align: center; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace;">
                ${resetLink}
              </p>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>Importante:</strong> Este link expira em <strong>${expiresAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })}</strong> (30 minutos). Após esse período, será necessário solicitar um novo link.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                🔒 <strong>Dica de segurança:</strong> Nunca compartilhe este link com outras pessoas. Ele é pessoal e permite redefinir sua senha.
              </p>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Se você não solicitou esta redefinição, recomendamos que entre em contato com o suporte imediatamente.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MAF Card System - Carteirinha Profissional
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Template de email de recusa de cadastro
 * Enviado quando o admin recusa uma solicitação de carteirinha
 */
export function rejectionEmailTemplate(name: string, rejectionReason: string) {
  // Link do WhatsApp do suporte - você pode configurar via env ou hardcoded
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '5511999999999'
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Olá!%20Recebi%20uma%20notificação%20sobre%20minha%20solicitação%20de%20cadastro%20e%20gostaria%20de%20mais%20informações.`
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atualização sobre sua solicitação - MAF Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📋 Atualização da sua Solicitação
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Informamos que sua solicitação de cadastro no MAF Pro foi <strong style="color: #dc2626;">analisada</strong> e, infelizmente, não pudemos aprová-la neste momento.
              </p>

              <!-- Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                      📝 Motivo da recusa:
                    </p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
                      ${rejectionReason}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Mas não se preocupe! Nossa equipe de suporte está pronta para ajudá-la a resolver qualquer questão e reenviar sua solicitação. 💚
              </p>

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${whatsappLink}" style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      💬 Falar com o Suporte no WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Como podemos ajudar:</strong> Nossa equipe pode orientá-la sobre os documentos necessários, esclarecer dúvidas sobre os requisitos e auxiliá-la no processo de nova solicitação.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Estamos à disposição para ajudá-la! 🤝
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MAF Pro - Sistema de Carteirinha Profissional
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
/**
 * Template de email de confirmação de troca de email
 * Enviado para o NOVO email para confirmar a alteração
 */
export function emailChangeVerificationTemplate(name: string, confirmLink: string, newEmail: string, expiresAt: Date) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Troca de Email - MAF Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✉️ Confirme seu novo email
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para <strong>alterar o email</strong> da sua conta MAF Pro para:
              </p>

              <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1d4ed8; text-align: center; background-color: #eff6ff; padding: 14px; border-radius: 8px;">
                ${newEmail}
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para confirmar essa alteração, clique no botão abaixo. Se você não solicitou essa mudança, ignore este email — seu email atual permanecerá inalterado.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Confirmar novo email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 10px 0 0 0; color: #1d4ed8; font-size: 13px; word-break: break-all; text-align: center; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace;">
                ${confirmLink}
              </p>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0 0 0; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                      ⚠️ <strong>Atenção:</strong> Este link expira em <strong>${expiresAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })}</strong> (30 minutos).
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                🔒 Por segurança, nunca compartilhe este link com outras pessoas.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MAF Pro - Sistema de Carteirinha Profissional
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este é um email automático. Por favor, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}