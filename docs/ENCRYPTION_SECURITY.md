# Organization Encryption Security System

This document describes the asymmetric encryption security system implemented for protecting sensitive organization data (WooCommerce credentials) in the Woocer backend.

## Overview

The system uses **hybrid encryption** (RSA + AES) to secure sensitive organization fields:
- `consumerKey` - WooCommerce API consumer key
- `consumerSecret` - WooCommerce API consumer secret 

## Security Flow

1. **Client Side**: Sensitive data is encrypted using the server's public key before transmission
2. **Server Side (beforeCreate)**: 
   - Incoming encrypted data is decrypted using the server's private key
   - Data is immediately re-encrypted using the server's storage key pair
   - Encrypted data is stored in the database
3. **Runtime**: When accessing organization data, it's decrypted on-demand using the server's private key

## Architecture Components

### 1. AsymmetricEncryption Class
- **Purpose**: Core encryption/decryption utilities
- **Algorithm**: RSA-2048 for key encryption + AES-256-GCM for data encryption
- **Location**: `src/common/utilities/encryption.util.ts`

### 2. OrganizationEncryptionManager Class  
- **Purpose**: High-level organization data processing
- **Functions**:
  - `processOrganizationData()` - Decrypt + re-encrypt for storage
  - `decryptStoredOrganizationData()` - Decrypt for runtime use

### 3. Better Auth Integration
- **Hook**: `beforeCreate` in organization creation
- **Process**: Automatically encrypts sensitive fields before database storage
- **Location**: `src/common/better-auth/lib/auth.ts`

## Setup Instructions

### 1. Generate Encryption Keys

```bash
# Generate RSA key pairs
npx tsx scripts/generate-encryption-keys.ts

# Or using npm script (if added to package.json)
npm run generate:keys
```

### 2. Environment Configuration

Add the generated keys to your `.env` files:

**Backend `.env`:**
```env
# Server keys (used for server-side encryption/decryption)
SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
SERVER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Frontend `.env` (or `.env.local`):**
```env
# Frontend needs server's public key to encrypt data before sending
NEXT_PUBLIC_SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

**Note**: The `NEXT_PUBLIC_SERVER_PUBLIC_KEY` should be the **same** as `SERVER_PUBLIC_KEY` - it's just exposed to the frontend with the `NEXT_PUBLIC_` prefix.

### 3. Frontend Integration

```javascript
// Frontend: Encrypt data before sending to server
import { encryptForServer } from './encryption-utils';

const orgData = {
  name: "My Store",
  consumerKey: "ck_secret123",
  consumerSecret: "cs_secret456", 
  wooCommerceUrl: "https://mystore.com"
};

// Get server's public key from environment
const serverPublicKey = process.env.NEXT_PUBLIC_SERVER_PUBLIC_KEY;

// Encrypt sensitive fields
const encryptedData = {
  ...orgData,
  consumerKey: encryptForServer(orgData.consumerKey, serverPublicKey),
  consumerSecret: encryptForServer(orgData.consumerSecret, serverPublicKey)
};

// Send to server
await createOrganization(encryptedData);
```

## Security Benefits

1. **End-to-End Protection**: Data is encrypted in transit and at rest
2. **Zero-Knowledge Storage**: Server can only decrypt data when explicitly needed
3. **Key Rotation Support**: Easy to rotate encryption keys without affecting stored data
4. **Audit Trail**: All encryption/decryption operations are logged
5. **Defense in Depth**: Multiple layers of encryption (transport + application + database)

## Key Management

### Security Best Practices

- **Never commit private keys** to version control
- Store private keys in secure environment variables
- Use different key pairs for different environments (dev/staging/prod)
- Implement key rotation policy (recommended: every 6-12 months)
- Monitor encryption/decryption failures for security incidents

### Key Rotation Process

1. Generate new key pairs using the key generator
2. Update environment variables with new keys
3. Existing encrypted data remains accessible with old keys
4. New data uses new encryption keys
5. Gradually migrate old data (optional background process)

## Error Handling

The system includes comprehensive error handling:

- **Encryption Failures**: Organization creation is aborted if encryption fails
- **Decryption Failures**: WooCommerce operations gracefully fail with logged errors
- **Missing Keys**: Clear error messages when encryption keys are not configured
- **Invalid Data**: Validation before encryption to prevent corrupted data

## Performance Considerations

- **Lazy Decryption**: Data is only decrypted when explicitly accessed
- **Caching**: Consider caching decrypted data for frequently accessed organizations
- **Batch Operations**: Decrypt multiple organizations efficiently when needed

## Monitoring & Logging

Key events are logged for security monitoring:

- Organization creation with encryption status
- Encryption/decryption failures
- Configuration errors (missing keys)
- Webhook setup with decrypted credentials

## Troubleshooting

### Common Issues

1. **"Server encryption keys are not configured"**
   - Ensure `SERVER_PRIVATE_KEY` and `SERVER_PUBLIC_KEY` are set in environment
   - Verify keys are properly formatted (newlines as `\n`)

2. **"Failed to decrypt organization data"**
   - Check if keys match the ones used for encryption
   - Verify data was properly encrypted before storage

3. **"Failed to process encrypted organization data"**
   - Ensure incoming data is properly encrypted with correct public key
   - Verify client-side encryption implementation

### Debug Mode

Enable debug logging to troubleshoot encryption issues:

```env
LOG_LEVEL=debug
```

This will log detailed encryption/decryption operations for debugging. 