# SendGrid Email Integration Setup

This document explains how to set up and use SendGrid for sending OTP emails and invitation emails in the Woocer backend.

## Prerequisites

1. A SendGrid account (sign up at https://app.sendgrid.com/)
2. A verified sender identity (email address or domain)

## Setup Steps

### 1. Create SendGrid API Key

1. Log in to your SendGrid dashboard
2. Go to Settings > API Keys
3. Click "Create API Key"
4. Choose "Restricted Access" and give it a name like "Woocer Backend"
5. Grant the following permissions:
   - Mail Send: Full Access
   - Template Engine: Read Access (if using templates)
6. Copy the generated API key

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY="your_sendgrid_api_key_here"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="Your App Name"
```

**Important Notes:**
- Replace `your_sendgrid_api_key_here` with your actual SendGrid API key
- Use a verified sender email address for `SENDGRID_FROM_EMAIL`
- The `SENDGRID_FROM_NAME` will appear as the sender name in emails

### 3. Verify Sender Identity

1. In SendGrid dashboard, go to Settings > Sender Authentication
2. Either verify a single sender email or authenticate your domain
3. For single sender: Add your `SENDGRID_FROM_EMAIL` and verify it
4. For domain authentication: Follow SendGrid's domain authentication process

## Features

### OTP Email Sending

The system automatically sends OTP emails for:
- Email verification during registration
- Sign-in with email OTP

**Email Template Features:**
- Professional HTML design with fallback text version
- Security warnings and expiration notices
- Responsive design for mobile devices
- Branded with Woocer styling

### Invitation Emails

Organization invitations are sent automatically when:
- An organization owner invites a new member
- The system creates invitation links

**Invitation Email Features:**
- Personalized with organization name and inviter details
- Clear call-to-action button
- Fallback link for accessibility
- Expiration notice

## Testing

### Development Mode

If `SENDGRID_API_KEY` is not set, the system will:
- Log email content to console instead of sending
- Continue normal operation without errors
- Display `[DEV MODE]` prefix in logs

### Test Endpoints

Use these endpoints to test email functionality:

```bash
# Test OTP email
POST /test/send-otp
{
  "email": "test@example.com",
  "otp": "123456",
  "type": "email-verification"
}

# Test invitation email
POST /test/send-invitation
{
  "email": "test@example.com",
  "organizationName": "Test Organization",
  "inviterName": "John Doe"
}
```

## Email Templates

### OTP Email Template

- **Subject**: "Your Woocer Sign-in Code" or "Verify Your Woocer Email"
- **Design**: Clean, professional layout with prominent OTP code
- **Security**: Includes warnings about code expiration and security

### Invitation Email Template

- **Subject**: "You're invited to join [Organization] on Woocer"
- **Design**: Welcoming design with clear call-to-action
- **Content**: Organization details and invitation link

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify the API key is correct and has proper permissions
   - Check that the key hasn't expired

2. **Sender Not Verified**
   - Ensure the `SENDGRID_FROM_EMAIL` is verified in SendGrid
   - Check sender authentication settings

3. **Emails Not Delivered**
   - Check SendGrid activity logs in the dashboard
   - Verify recipient email addresses
   - Check spam folders

4. **Rate Limiting**
   - SendGrid has sending limits based on your plan
   - Monitor usage in the SendGrid dashboard

### Debugging

Enable debug logging by checking the console output:
- Successful sends: `OTP email sent successfully to [email]`
- Errors: `Error sending OTP email: [error details]`
- Dev mode: `[DEV MODE] OTP Email would be sent to [email]: [otp]`

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate keys regularly

2. **Email Content**
   - OTP codes expire in 10 minutes
   - Include security warnings in emails
   - Never include sensitive data in email content

3. **Rate Limiting**
   - Implement application-level rate limiting if needed
   - Monitor for abuse patterns

## Production Deployment

Before deploying to production:

1. ✅ Verify SendGrid API key is set correctly
2. ✅ Confirm sender email/domain is authenticated
3. ✅ Test email delivery to various email providers
4. ✅ Set up monitoring for email delivery failures
5. ✅ Configure proper error handling and logging

## Support

For SendGrid-specific issues:
- SendGrid Documentation: https://docs.sendgrid.com/
- SendGrid Support: Available through your SendGrid dashboard

For integration issues:
- Check the application logs
- Verify environment variables
- Test with the provided test endpoints