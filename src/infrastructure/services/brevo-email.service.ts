import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

interface BrevoEmailRequest {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

@Injectable()
export class BrevoEmailService implements EmailService {
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly apiKey: string;
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY')!;
    this.senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') || 'Gestia';
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL')!;

    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is required');
    }
    if (!this.senderEmail) {
      throw new Error('BREVO_SENDER_EMAIL is required');
    }
  }

  async sendResetEmail(
    email: string,
    fullName: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `https://gestia.eduadminsoft.shop/reestablecer-clave?token=${token}`;

    const emailData: BrevoEmailRequest = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [
        {
          email: email,
        },
      ],
      subject: 'Establecer tu contraseña - Gestia',
      htmlContent: `
<html project="Gestia Email" file="welcome-email.html" type="html">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Gestia</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .button-link { padding: 14px 18px !important; font-size: 16px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,sans-serif;">
    <div style="display:none; font-size:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
        Bienvenido a Gestia - Establece tu contraseña para empezar.
    </div>
    <center style="width:100%; background-color:#f4f4f4;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center">
                    <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.05);">
                        <tr>
                            <td align="center" style="padding:40px 20px 20px 20px;">
                                <img src="https://sistema-de-atencion.s3.us-east-1.amazonaws.com/icon/logo.png" alt="Logo Gestia" width="80" style="display:block; margin:auto; border-radius:12px;"/>
                                <div style="margin-top:14px; font-size:28px; font-weight:bold; color:#297AFF; letter-spacing:2px;">Gestia</div>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" class="content-padding" style="padding:20px 40px 20px 40px; font-size:16px; color:#333; line-height:1.7;">
                                <p style="margin:0;">¡Hola <strong>${fullName}</strong>!</p>
                                <p style="margin:20px 0 0 0;">¡Bienvenido a <strong>Gestia</strong>! Estamos emocionados de tenerte a bordo.</p>
                                <p style="margin:20px 0 0 0;">Gestia es tu nueva aplicación web y móvil, pensada para simplificar la comunicación con empresas y facilitar la gestión de trámites desde cualquier lugar.</p>
                                <p style="margin:20px 0 0 0;">Para empezar, por favor establece una contraseña para tu usuario haciendo clic en el siguiente botón:</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding:0 40px 40px 40px;">
                                <a href="${resetUrl}" target="_blank" style="background-color:#297AFF; color:#fff; font-size:18px; font-family:Arial,sans-serif; font-weight:bold; text-decoration:none; border-radius:6px; padding:16px 32px; display:inline-block; margin-bottom:12px; border:1px solid #297AFF;" class="button-link">
                                    Establecer Contraseña
                                </a>
                                <p style="margin:16px 0 0 0; font-size:13px; color:#666;">
                                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                    <a href="${resetUrl}" style="color:#297AFF; text-decoration:underline; word-break:break-all;">${resetUrl}</a>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding:20px 40px; font-size:14px; color:#888; background:#f0f0f0;">
                                <p style="margin:0;">¿Tienes dudas o necesitas ayuda? <b>Contáctanos.</b></p>
                                <p style="margin:10px 0 0 0;">&copy; 2025 Gestia. Todos los derechos reservados.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
`,
      textContent: `
        Restablece tu Contraseña - Gestia
        
        ¡Hola!
        
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Gestia.
        
        Haz clic en este enlace para restablecer tu contraseña: ${resetUrl}
        
        Este enlace expirará en 1 hora por motivos de seguridad.
        
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        
        Saludos,
        El equipo de Gestia
      `,
    };

    await this.sendEmail(emailData);
  }

  async sendEmailVerification(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `https://gestia.eduadminsoft.shop/verificacion-correo?token=${token}`;

    const emailData: BrevoEmailRequest = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [
        {
          email: email,
        },
      ],
      subject:
        '¡Bienvenido a Gestia! Por favor, verifica tu correo electrónico',
      htmlContent: `
     <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Gestia</title>
    <style>
        body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 0 20px rgba(0,0,0,0.08);
            border-radius: 10px;
            overflow: hidden;
        }
        .header {
            text-align: center;
            padding: 36px 40px 20px 40px;
            border-bottom: 1px solid #e2e8f0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        .logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            border-radius: 12px;
            background: #fff;
        }
        .brand-name {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px;
        }
        .welcome-title {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            margin-top: 10px;
        }
        .description {
            font-size: 16px;
            color: #475569;
            margin-bottom: 32px;
            line-height: 1.7;
        }
        .cta-button {
            display: block;
            width: 100%;
            background-color: #2563eb;
            color: #fff !important;
            text-decoration: none;
            padding: 16px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 32px;
            transition: background 0.2s;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .help-section {
            background: #f9fafb;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 22px 18px;
            margin-bottom: 32px;
        }
        .help-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 12px;
        }
        .url-container {
            background-color: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 16px;
            word-break: break-all;
        }
        .help-link {
            color: #2563eb;
            text-decoration: underline;
            font-size: 14px;
        }
        .contact-info {
            font-size: 14px;
            color: #64748b;
            margin-top: 10px;
        }
        .signature {
            font-size: 14px;
            color: #64748b;
            margin-top: 8px;
        }
        .footer {
            text-align: center;
            padding: 24px 40px;
            border-top: 1px solid #e2e8f0;
            background-color: #f8fafc;
        }
        .copyright {
            font-size: 12px;
            color: #94a3b8;
        }
        @media (max-width: 640px) {
            .container { box-shadow: none; border-radius: 0; }
            .content, .header, .footer { padding: 18px !important; }
            .brand-name { font-size: 22px; }
            .welcome-title { font-size: 18px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="https://sistema-de-atencion.s3.us-east-1.amazonaws.com/icon/logo.png" alt="Logo Gestia" class="logo" />
                <span class="brand-name">Gestia</span>
            </div>
        </div>
        <main class="content">
            <h2 class="welcome-title">¡Bienvenido, ${firstName}!</h2>
            <p class="description">
                Gracias por registrarte en Gestia.<br>
                Para activar tu cuenta y comenzar a disfrutar de nuestros servicios, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:
            </p>
            <a href="${verificationUrl}" class="cta-button">Verificar correo electrónico</a>
            <div class="help-section">
                <p class="help-text">
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                </p>
                <div class="url-container">
                    <a href="${verificationUrl}" class="help-link">${verificationUrl}</a>
                </div>
                <div class="contact-info">
                    ¿Tienes dudas o necesitas ayuda? Contáctanos.
                </div>
                <div class="signature">
                    Saludos cordiales,<br>El equipo de Gestia
                </div>
            </div>
        </main>
        <footer class="footer">
            <p class="copyright">&copy; 2025 Gestia. Todos los derechos reservados.</p>
        </footer>
    </div>
</body>
</html>

      `,
      textContent: `
        ¡Bienvenido a Gestia!
        
        ¡Hola, ${firstName}!
        
        Gracias por registrarte en Gestia.
        Para activar tu cuenta, haz clic en este enlace: ${verificationUrl}
        
        Si el botón no funciona, copia y pega el enlace en tu navegador.
        
        ¡Bienvenido a bordo!
        El equipo de Gestia
      `,
    };

    await this.sendEmail(emailData);
  }

  async sendResetPassword(email: string, token: string): Promise<void> {
    const resetUrl = `https://gestia.eduadminsoft.shop/reestablecer-clave?token=${token}`;

    const emailData: BrevoEmailRequest = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [
        {
          email: email,
        },
      ],
      subject: 'Restablece tu contraseña - Gestia',
      htmlContent: `
       <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Gestia</title>
    <style>
        body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            background-color: #f8fafc;
            padding: 40px 20px;
            min-height: 100vh;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 48px 40px 36px 40px;
            text-align: center;
            position: relative;
        }
        .header-content {
            position: relative;
            z-index: 1;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin-bottom: 24px;
            background-color: rgba(255,255,255,0.95);
            padding: 16px 32px;
            border-radius: 50px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.09));
            border-radius: 10px;
            background: #fff;
        }
        .brand-name {
            font-size: 32px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
            margin: 0;
        }
        .header-title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            margin-top: 16px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .email-content {
            padding: 48px 40px;
        }
        .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 24px;
            font-weight: 500;
        }
        .main-message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 32px;
            line-height: 1.7;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #fff !important;
            text-decoration: none;
            padding: 18px 36px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            transition: background 0.3s, box-shadow 0.3s, transform 0.2s;
            box-shadow: 0 4px 14px 0 rgba(220,38,38,0.3);
            border: none;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            box-shadow: 0 8px 25px rgba(220,38,38,0.33);
        }
        .security-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            padding: 24px;
            margin: 32px 0;
            border-radius: 0 12px 12px 0;
            position: relative;
        }
        .security-notice::before {
            content: '⚠️';
            position: absolute;
            top: 24px;
            left: 12px;
            font-size: 20px;
        }
        .security-title {
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 12px;
            padding-left: 32px;
        }
        .security-text {
            color: #92400e;
            font-size: 14px;
            padding-left: 32px;
            line-height: 1.6;
        }
        .alternative-section {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
        }
        .alternative-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
        }
        .alternative-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 16px;
            line-height: 1.6;
        }
        .url-box {
            background-color: #ffffff;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 16px;
            word-break: break-all;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            color: #3b82f6;
            text-decoration: none;
        }
        .support-section {
            margin-top: 40px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
        }
        .support-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 16px;
            line-height: 1.6;
        }
        .signature {
            font-size: 16px;
            color: #475569;
            margin-top: 32px;
            line-height: 1.6;
        }
        .email-footer {
            background-color: #f8fafc;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
        }
        @media (max-width: 640px) {
            .email-wrapper { padding: 20px 6px; }
            .email-content, .email-header { padding: 28px 12px; }
            .brand-name { font-size: 22px; }
            .header-title { font-size: 20px; }
            .logo-container { gap: 10px; padding: 12px 18px; }
            .logo { width: 34px; height: 34px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <div class="header-content">
                    <div class="logo-container">
                        <img src="https://sistema-de-atencion.s3.us-east-1.amazonaws.com/icon/logo.png" alt="Logo Gestia" class="logo"/>
                        <span class="brand-name">Gestia</span>
                    </div>
                    <div class="header-title">
                        Restablecer Contraseña
                    </div>
                </div>
            </div>
            <main class="email-content">
                <p class="greeting">¡Hola!</p>
                <p class="main-message">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Gestia.
                    Si fuiste tú quien realizó esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña.
                </p>
                <div class="cta-section">
                    <a href="${resetUrl}" class="cta-button">Restablecer Contraseña</a>
                </div>
                <div class="security-notice">
                    <h3 class="security-title">Importante - Seguridad</h3>
                    <p class="security-text">
                        Este enlace expirará en 1 hora por motivos de seguridad. Si no restableces tu contraseña dentro de este tiempo, deberás solicitar un nuevo enlace.
                    </p>
                </div>
                <div class="alternative-section">
                    <h3 class="alternative-title">¿El botón no funciona?</h3>
                    <p class="alternative-text">
                        Si tienes problemas con el botón, copia y pega el siguiente enlace en tu navegador:
                    </p>
                    <a href="${resetUrl}" class="url-box">${resetUrl}</a>
                </div>
                <div class="support-section">
                    <p class="support-text">
                        <strong>¿No solicitaste este cambio?</strong><br>
                        Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá sin cambios.
                    </p>
                    <p class="support-text">
                        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
                    </p>
                    <div class="signature">
                        Saludos cordiales,<br>El equipo de Gestia
                    </div>
                </div>
            </main>
            <footer class="email-footer">
                <p class="footer-text">
                    Este correo fue enviado por Gestia. Por favor, no respondas a este mensaje.<br>
                    &copy; 2024 Gestia. Todos los derechos reservados.
                </p>
            </footer>
        </div>
    </div>
</body>
</html>
 `,
      textContent: `
        Restablece tu Contraseña - Gestia
        
        ¡Hola!
        
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Gestia.
        
        Haz clic en este enlace para restablecer tu contraseña: ${resetUrl}
        
        Este enlace expirará en 1 hora por motivos de seguridad.
        
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        
        Saludos,
        El equipo de Gestia
      `,
    };

    await this.sendEmail(emailData);
  }

  private async sendEmail(emailData: BrevoEmailRequest): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        throw new Error(
          `Brevo API error: ${response.status} - ${JSON.stringify(errorData)}`,
        );
      }

      const result: unknown = await response.json();
      console.log(
        'Email sent successfully:',
        (result as { messageId?: string }).messageId,
      );
    } catch (error) {
      console.error('Failed to send email via Brevo:', error);
      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }
}
