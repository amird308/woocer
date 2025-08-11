import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private apiKey;
  private fromEmail;
  private fromName;
  private apiKeyId;
  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL')|| 'noreply@woocer.com' ;
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME') || 'Woocer';
    this.apiKeyId = this.configService.get<string>('');
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    } else {
      console.warn('SENDGRID_API_KEY not found. Email functionality will be disabled.');
    }
  }

  async sendOTPEmail(email: string, otp: string, type: 'sign-in' | 'email-verification'): Promise<void> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] OTP Email would be sent to ${email}: ${otp}`);
      return;
    }

    const fromEmail = this.fromEmail || 'noreply@woocer.com';
    const fromName = this.fromName || 'Woocer';

    const subject = type === 'sign-in' ? 'Your Woocer Sign-in Code' : 'Verify Your Woocer Email';
    const htmlContent = this.generateOTPEmailTemplate(otp, type);
    const textContent = this.generateOTPTextContent(otp, type);

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendInvitationEmail(
    email: string, 
    organizationName: string, 
    inviteLink: string,
    inviterName?: string
  ): Promise<void> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Invitation email would be sent to ${email} for ${organizationName}: ${inviteLink}`);
      return;
    }


    const subject = `You're invited to join ${organizationName} on Woocer`;
    const htmlContent = this.generateInvitationEmailTemplate(organizationName, inviteLink, inviterName);
    const textContent = this.generateInvitationTextContent(organizationName, inviteLink, inviterName);

    const msg = {
      to: email,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log(`Invitation email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  }

  private generateOTPEmailTemplate(otp: string, type: 'sign-in' | 'email-verification'): string {
    const title = type === 'sign-in' ? 'Sign in to Woocer' : 'Verify Your Email';
    const message = type === 'sign-in' 
      ? 'Use the code below to sign in to your Woocer account:'
      : 'Use the code below to verify your email address:';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              font-size: 22px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #1f2937;
            }
            .message {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 30px;
              text-align: center;
            }
            .otp-container {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 6px;
              font-family: 'Courier New', monospace;
              margin-bottom: 10px;
            }
            .otp-label {
              font-size: 14px;
              color: #6b7280;
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .warning {
              background: #fef3cd;
              border-left: 4px solid #f59e0b;
              border-radius: 6px;
              padding: 16px;
              margin: 25px 0;
              font-size: 14px;
              color: #92400e;
            }
            .warning strong {
              color: #78350f;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛒 Woocer</div>
              <div class="title">${title}</div>
            </div>
            
            <div class="message">
              ${message}
            </div>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <div class="otp-label">Your verification code</div>
            </div>
            
            <div class="warning">
              <strong>🔒 Security Notice:</strong> This code will expire in 10 minutes. Never share this code with anyone. Woocer will never ask for this code via phone or email.
            </div>
            
            <div class="footer">
              <p>If you didn't request this code, please ignore this email.</p>
              <p>© ${new Date().getFullYear()} Woocer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateOTPTextContent(otp: string, type: 'sign-in' | 'email-verification'): string {
    const title = type === 'sign-in' ? 'Sign in to Woocer' : 'Verify Your Email';
    const message = type === 'sign-in' 
      ? 'Use the code below to sign in to your Woocer account:'
      : 'Use the code below to verify your email address:';

    return `
${title}

${message}

Your verification code: ${otp}

This code will expire in 10 minutes. Never share this code with anyone.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} Woocer. All rights reserved.
    `.trim();
  }

  private generateInvitationEmailTemplate(
    organizationName: string, 
    inviteLink: string, 
    inviterName?: string
  ): string {
    const inviterText = inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${organizationName} on Woocer</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              font-size: 22px;
              font-weight: 600;
              margin-bottom: 20px;
              color: #1f2937;
            }
            .message {
              font-size: 16px;
              color: #6b7280;
              margin-bottom: 30px;
              text-align: center;
            }
            .org-name {
              font-weight: 600;
              color: #2563eb;
            }
            .cta-container {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
              text-align: center;
            }
            .link-fallback {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #374151;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛒 Woocer</div>
              <div class="title">You're Invited!</div>
            </div>
            
            <div class="message">
              ${inviterText} <span class="org-name">${organizationName}</span> on Woocer.
            </div>
            
            <div class="message">
              Join your team to manage WooCommerce stores, sync orders, and streamline your e-commerce operations.
            </div>
            
            <div class="cta-container">
              <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="link-fallback">
              <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
              ${inviteLink}
            </div>
            
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>© ${new Date().getFullYear()} Woocer. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateInvitationTextContent(
    organizationName: string, 
    inviteLink: string, 
    inviterName?: string
  ): string {
    const inviterText = inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join';
    
    return `
You're Invited to Join ${organizationName} on Woocer!

${inviterText} ${organizationName} on Woocer.

Join your team to manage WooCommerce stores, sync orders, and streamline your e-commerce operations.

Accept your invitation by clicking this link:
${inviteLink}

This invitation will expire in 7 days.

© ${new Date().getFullYear()} Woocer. All rights reserved.
    `.trim();
  }
}