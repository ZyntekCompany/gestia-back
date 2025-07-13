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
    const resetUrl = `http://localhost:3000/reestablecer-clave?token=${token}`;

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
 <html project="Gestia Email" file="welcome-email.html" type="html">
        |<head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Gestia</title>
            <style>
                /* Basic reset and common styles for email compatibility */
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; }
                a[x-apple-data-detectors] {
                    color: inherit !important;
                    text-decoration: none !important;
                    font-size: inherit !important;
                    font-family: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                }
                /* Responsive styles */
                @media screen and (max-width: 600px) {
                    .full-width-table {
                        width: 100% !important;
                    }
                    .content-padding {
                        padding: 20px !important;
                    }
                    .button-wrapper {
                        padding: 10px 0 !important;
                    }
                    .button-link {
                        padding: 12px 20px !important;
                        font-size: 16px !important;
                    }
                }
            </style>
        </head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  
    <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
        Bienvenido a Gestia - Establece tu contraseña para empezar.
    </div>
<center style="width: 100%; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
      
        <tr>
            <td align="center" style="padding: 40px 20px 20px 20px;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M33.724 36.5809C37.7426 32.5622 40.0003 27.1118 40.0003 21.4286C40.0003 15.7454 37.7426 10.2949 33.724 6.27629C29.7054 2.25765 24.2549 1.02188e-06 18.5717 0C12.8885 -1.02188e-06 7.43807 2.25764 3.41943 6.27628L10.4905 13.3473C11.6063 14.4631 13.4081 14.4074 14.8276 13.7181C15.9836 13.1568 17.2622 12.8571 18.5717 12.8571C20.845 12.8571 23.0252 13.7602 24.6326 15.3677C26.2401 16.9751 27.1431 19.1553 27.1431 21.4286C27.1431 22.7381 26.8435 24.0167 26.2822 25.1727C25.5929 26.5922 25.5372 28.394 26.6529 29.5098L33.724 36.5809Z" fill="#297AFF"></path>
                                <path d="M30 40H19.5098C17.9943 40 16.5408 39.398 15.4692 38.3263L1.67368 24.5308C0.60204 23.4592 0 22.0057 0 20.4902V10L30 40Z" fill="#34C2FF"></path>
                                <path d="M10.7143 39.9999H4.28571C1.91878 39.9999 0 38.0812 0 35.7142V29.2856L10.7143 39.9999Z" fill="#34C2FF"></path>
                            </svg>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #333333;">
                            Gestia
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <tr>
            <td align="left" class="content-padding" style="padding: 20px 40px 20px 40px; font-size: 16px; line-height: 24px; color: #333333;">
                <p style="margin: 0;">¡Hola ${fullName}	 !</p>
                <p style="margin: 20px 0 0 0;">¡Bienvenido a Gestia! Estamos emocionados de tenerte a bordo.</p>
                <p style="margin: 20px 0 0 0;">Gestia es tu nueva aplicación web y móvil diseñada para simplificar la comunicación con empresas y facilitar la solicitud de trámites desde la comodidad de tu hogar, funcionando como un Sistema de Atención al Ciudadano (SAC).</p>
                <p style="margin: 20px 0 0 0;">Para comenzar a disfrutar de todos los beneficios de Gestia, por favor, establece una contraseña para tu usuario haciendo clic en el botón de abajo:</p>
            </td>
        </tr>

        <tr>
            <td align="center" class="button-wrapper" style="padding: 20px 40px 40px 40px;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center" style="border-radius: 5px; background-color: #297AFF;">
                            <a href=${resetUrl} target="_blank" style="font-size: 18px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 15px 25px; border: 1px solid #297AFF; display: inline-block; font-weight: bold;">
                                Establecer Contraseña
                            </a>
                        </td>
                    </tr>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #666666;">
                    <small>Si el botón no funciona, copia y pega este enlace en tu navegador:</small><br>
                    <a href=${resetUrl} style="color: #297AFF; text-decoration: underline;">
                        ${resetUrl}
                    </a>
                </p>
              
            </td>
        </tr>

                    <tr>
                        <td align="center" style="padding: 20px 40px; font-size: 14px; line-height: 20px; color: #999999; background-color: #f0f0f0;">
                            <p style="margin: 0;">Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                            <p style="margin: 10px 0 0 0;">&copy; 2025 Gestia. Todos los derechos reservados.</p>
                        </td>
                    </tr>
                </table>
            </center>
        </body>
    </html>`,
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
    const verificationUrl = `http://localhost:3000/verificacion-correo?token=${token}`;

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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }

        .header {
            padding: 32px 40px 20px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }

        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 10px;
        }

        .logo {
            width: 32px;
            height: 32px;
            object-fit: contain;
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
            margin-bottom: 24px;
            margin-top: 16px;
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
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            margin-bottom: 32px;
        }

        .cta-button:hover {
            transform: translateY(-2px);
            background-color: #1d4ed8;
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.2);
        }

        .help-section {
            background-color: #fefefe;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 32px;
        }

        .help-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 12px;
        }
        
        .url-container {
            background-color: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            margin-top: 8px;
            margin-bottom: 16px;
        }

        .help-link {
            color: #2563eb;
            text-decoration: none;
            font-size: 14px;
            word-wrap: break-word;
            word-break: break-all;
        }

        .help-link:hover {
            text-decoration: underline;
        }

        .contact-info {
            font-size: 14px;
            color: #64748b;
            margin-top: 16px;
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
            .container {
                margin: 0;
                box-shadow: none;
            }
            
            .content, .header {
                padding: 24px;
            }
            
            .brand-name {
                font-size: 24px;
            }
            
            .welcome-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
           <tr>
            <td align="center" style="padding: 40px 20px 20px 20px;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M33.724 36.5809C37.7426 32.5622 40.0003 27.1118 40.0003 21.4286C40.0003 15.7454 37.7426 10.2949 33.724 6.27629C29.7054 2.25765 24.2549 1.02188e-06 18.5717 0C12.8885 -1.02188e-06 7.43807 2.25764 3.41943 6.27628L10.4905 13.3473C11.6063 14.4631 13.4081 14.4074 14.8276 13.7181C15.9836 13.1568 17.2622 12.8571 18.5717 12.8571C20.845 12.8571 23.0252 13.7602 24.6326 15.3677C26.2401 16.9751 27.1431 19.1553 27.1431 21.4286C27.1431 22.7381 26.8435 24.0167 26.2822 25.1727C25.5929 26.5922 25.5372 28.394 26.6529 29.5098L33.724 36.5809Z" fill="#297AFF"></path>
                                <path d="M30 40H19.5098C17.9943 40 16.5408 39.398 15.4692 38.3263L1.67368 24.5308C0.60204 23.4592 0 22.0057 0 20.4902V10L30 40Z" fill="#34C2FF"></path>
                                <path d="M10.7143 39.9999H4.28571C1.91878 39.9999 0 38.0812 0 35.7142V29.2856L10.7143 39.9999Z" fill="#34C2FF"></path>
                            </svg>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #333333;">
                            Gestia
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        </header>

        <main class="content">
            <h2 class="welcome-title">¡Bienvenido, ${firstName}!</h2>
            
            <p class="description">
                Gracias por registrarte en Gestia. Para activar tu cuenta y comenzar a disfrutar de nuestros servicios, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:
            </p>

            <a href="${verificationUrl}" class="cta-button">Verificar correo electrónico</a>

            <div class="help-section">
                <p class="help-text">
                    Si el botón no funciona, copia y pega el siguiente enlace en la barra de direcciones de tu navegador:
                </p>
                <div class="url-container">
                    <a href="${verificationUrl}" class="help-link">${verificationUrl}</a>
                </div>
                
                <div class="contact-info">
                    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.</p>
                </div>
                
                <div class="signature">
                    <p>Saludos cordiales,<br>El equipo de Gestia</p>
                </div>
            </div>
        </main>

        <footer class="footer">
            <p class="copyright">© Todos los Derechos Reservados</p>
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
    const resetUrl = `http://localhost:3000/reestablecer-clave?token=${token}`;

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
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
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
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                .email-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 48px 40px;
                    text-align: center;
                    position: relative;
                }

                .email-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .header-content {
                    position: relative;
                    z-index: 1;
                }

                .logo-container {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    margin-bottom: 24px;
                    background-color: rgba(255, 255, 255, 0.95);
                    padding: 16px 32px;
                    border-radius: 50px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }

                .logo {
                    width: 48px;
                    height: 48px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
                    color: #ffffff !important;
                    text-decoration: none;
                    padding: 18px 36px;
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);
                    border: none;
                    cursor: pointer;
                }

                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
                    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
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
                    left: -2px;
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

                .signature-name {
                    font-weight: 600;
                    color: #1e293b;
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

                .footer-link {
                    color: #3b82f6;
                    text-decoration: none;
                }

                .footer-link:hover {
                    text-decoration: underline;
                }

                @media (max-width: 640px) {
                    .email-wrapper {
                        padding: 20px 10px;
                    }
                    
                    .email-content, .email-header {
                        padding: 32px 24px;
                    }
                    
                    .brand-name {
                        font-size: 24px;
                    }
                    
                    .header-title {
                        font-size: 24px;
                    }
                    
                    .logo-container {
                        gap: 16px;
                        padding: 12px 24px;
                    }
                    
                    .logo {
                        width: 40px;
                        height: 40px;
                    }
                }
          </style>
        </head>
        <body>
            <div class="email-wrapper">
                <div class="email-container">
                    <header class="email-header">
                        <tr>
            <td align="center" style="padding: 40px 20px 20px 20px;">
                <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M33.724 36.5809C37.7426 32.5622 40.0003 27.1118 40.0003 21.4286C40.0003 15.7454 37.7426 10.2949 33.724 6.27629C29.7054 2.25765 24.2549 1.02188e-06 18.5717 0C12.8885 -1.02188e-06 7.43807 2.25764 3.41943 6.27628L10.4905 13.3473C11.6063 14.4631 13.4081 14.4074 14.8276 13.7181C15.9836 13.1568 17.2622 12.8571 18.5717 12.8571C20.845 12.8571 23.0252 13.7602 24.6326 15.3677C26.2401 16.9751 27.1431 19.1553 27.1431 21.4286C27.1431 22.7381 26.8435 24.0167 26.2822 25.1727C25.5929 26.5922 25.5372 28.394 26.6529 29.5098L33.724 36.5809Z" fill="#297AFF"></path>
                                <path d="M30 40H19.5098C17.9943 40 16.5408 39.398 15.4692 38.3263L1.67368 24.5308C0.60204 23.4592 0 22.0057 0 20.4902V10L30 40Z" fill="#34C2FF"></path>
                                <path d="M10.7143 39.9999H4.28571C1.91878 39.9999 0 38.0812 0 35.7142V29.2856L10.7143 39.9999Z" fill="#34C2FF"></path>
                            </svg>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0 0 0; font-size: 28px; font-weight: bold; color: #333333;">
                            Gestia
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
                    </header>

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
                                Este enlace expirará en 1 hora por motivos de seguridad. Si no restableces tu contraseña dentro de este tiempo, 
                                deberás solicitar un nuevo enlace.
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
                                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. 
                                Tu contraseña actual permanecerá sin cambios.
                            </p>
                            
                            <p class="support-text">
                                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
                            </p>

                            <div class="signature">
                                <p>Saludos cordiales,<br>El equipo de Gestia</p>
                            </div>
                        </div>
                    </main>

                    <footer class="email-footer">
                        <p class="footer-text">
                            Este correo fue enviado por Gestia. Por favor, no respondas a este mensaje.<br>
                            © 2024 Gestia. Todos los derechos reservados.
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
