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
      this.configService.get<string>('BREVO_SENDER_NAME') || 'Acadix';
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL')!;

    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is required');
    }
    if (!this.senderEmail) {
      throw new Error('BREVO_SENDER_EMAIL is required');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

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
      subject: 'Restablece tu contraseña - Acadix',
      htmlContent: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Restablecer Contraseña - Acadix</title>
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
                        <div class="header-content">
                            <div class="logo-container">
                                <img src="https://eduadminsoft-s3.s3.us-east-1.amazonaws.com/schools/descarga-removebg-preview.png" 
                                     alt="Acadix Logo" 
                                     class="logo">
                                <h1 class="brand-name">Acadix</h1>
                            </div>
                            <h2 class="header-title">Restablece tu Contraseña</h2>
                        </div>
                    </header>

                    <main class="email-content">
                        <p class="greeting">¡Hola!</p>
                        
                        <p class="main-message">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Acadix. 
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
                                <p>Saludos cordiales,<br>
                                <span class="signature-name">El equipo de Acadix</span></p>
                            </div>
              </div>
                    </main>

                    <footer class="email-footer">
                        <p class="footer-text">
                            Este correo fue enviado por Acadix. Por favor, no respondas a este mensaje.<br>
                            © 2024 Acadix. Todos los derechos reservados.
                        </p>
                    </footer>
            </div>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Restablece tu Contraseña - Acadix
        
        ¡Hola!
        
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Acadix.
        
        Haz clic en este enlace para restablecer tu contraseña: ${resetUrl}
        
        Este enlace expirará en 1 hora por motivos de seguridad.
        
        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        
        Saludos,
        El equipo de Acadix
      `,
    };

    await this.sendEmail(emailData);
  }

  async sendEmailVerification(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

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
      subject: 'Tu cuenta ha sido creada exitosamente en Acadix.',
      htmlContent: `
     <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Acadix</title>
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

        .important-section {
            background-color: #f1f5f9;
            border-left: 4px solid #6b7280;
            padding: 24px;
            margin-bottom: 32px;
            border-radius: 0 8px 8px 0;
        }

        .important-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
        }

        .important-list {
            list-style: none;
            padding: 0;
        }

        .important-list li {
            position: relative;
            padding-left: 24px;
            margin-bottom: 12px;
            color: #475569;
            font-size: 15px;
        }

        .important-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #6b7280;
            font-weight: bold;
            font-size: 18px;
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
            <div class="logo-container">
                <img src="https://eduadminsoft-s3.s3.us-east-1.amazonaws.com/schools/descarga-removebg-preview.png" 
                     alt="Acadix Logo" 
                     class="logo">
                <h1 class="brand-name">${this.senderName}</h1>
            </div>
        </header>

        <main class="content">
            <h2 class="welcome-title">¡Bienvenido, ${firstName}!</h2>
            
            <p class="description">
                Tu cuenta en Acadix ha sido creada. Para completar el proceso de registro, por favor establece tu contraseña a continuación:
            </p>

            <div class="important-section">
                <h3 class="important-title">Información Importante:</h3>
                <ul class="important-list">
                    <li>Este enlace para establecer tu contraseña expirará en 24 horas.</li>
                    <li>Asegúrate de elegir una contraseña segura y que puedas recordar.</li>
                    <li>Una vez establecida, podrás iniciar sesión en tu cuenta de Acadix.</li>
                </ul>
            </div>

            <a href="${verificationUrl}" class="cta-button">Establecer Contraseña</a>

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
                    <p>Saludos cordiales,<br>El equipo de Acadix</p>
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
        ¡Bienvenido a Acadix!
        
        ¡Hola, ${firstName}!
        
        Tu cuenta ha sido creada exitosamente en Acadix.
        
        Para completar tu registro, haz clic en este enlace: ${verificationUrl}
        
        Este enlace expirará en 24 horas por motivos de seguridad.
        
        ¡Bienvenido a bordo!
        El equipo de Acadix
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
