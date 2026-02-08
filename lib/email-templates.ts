export function firstAccessEmailTemplate(name: string, accessLink: string, expiresAt: Date) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Primeiro Acesso - MAF Card System</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎓 MAF Card System
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                Carteirinha Profissional
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Olá, ${name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Sua carteirinha profissional foi <strong style="color: #10b981;">aprovada</strong>! 🎉
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para acessar sua carteirinha digital e gerenciar seus dados, você precisa criar uma senha de acesso. Clique no botão abaixo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${accessLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Definir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all; text-align: center; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace;">
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
                        minute: '2-digit'
                      })}</strong>. Caso expire, entre em contato com o suporte para receber um novo link.
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
