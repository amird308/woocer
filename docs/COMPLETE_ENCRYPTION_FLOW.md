# Complete Encryption Flow Implementation

This document describes the complete dual-layer encryption system implemented in the Woocer backend.

## Overview

The system now implements **two separate layers of encryption**:

1. **Backend Encryption**: Protects organization credentials in the database
2. **User-Specific Encryption**: Provides per-user encrypted access to organization secrets

## Architecture

```
Organization Creation
        ↓
Backend Encryption (Server Keys)
        ↓
Store in Database (Encrypted)
        ↓
User Secret Generation
        ↓
Decrypt Backend Data
        ↓
User-Specific Encryption (Per User-Org Keys)
        ↓
Store in UserSecret Table
        ↓
Frontend Access (User Private Keys)
```

## 1. Backend Encryption (Organization Level)

### Purpose
- Encrypt organization credentials before storing in database
- Protect data at rest using server-managed keys
- Used by backend services to access WooCommerce credentials

### Implementation

**When creating organization:**
```typescript
// In auth.controller.ts
const processedData = OrganizationEncryptionManager.processOrganizationData({
  consumerKey: body.consumerKey,
  consumerSecret: body.consumerSecret,
});

// Stores encrypted data in organization table
const organizationData = {
  ...body,
  consumerKey: processedData.consumerKey,      // Encrypted
  consumerSecret: processedData.consumerSecret, // Encrypted
};
```

**When accessing organization credentials:**
```typescript
// In woocommerce.service.ts
const decryptedData = OrganizationEncryptionManager.decryptStoredOrganizationData({
  consumerKey: organization.consumerKey,
  consumerSecret: organization.consumerSecret,
});
```

### Database Storage
- Organization table stores encrypted `consumerKey` and `consumerSecret`
- Uses server public/private key pair for encryption/decryption
- Backend services decrypt when needed

## 2. User-Specific Encryption (Per-User-Per-Organization)

### Purpose
- Each user gets their own encrypted copy of organization secrets
- Frontend-controlled decryption using private keys
- Isolates access between organization members

### Implementation

**New Database Table:**
```sql
UserSecret {
  id             String   @id @default(uuid())
  userId         String   @db.Uuid
  organizationId String   @db.Uuid
  publicKey      String   // User-specific public key for this organization
  encryptedData  String   // Encrypted organization secrets
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**API Endpoints:**

1. **Generate User Secrets** - `POST /api/auth/user-secrets/generate`
   - Checks what organizations the user is a member of
   - Decrypts organization credentials using backend system
   - Creates new user-specific encryption for each organization
   - Returns list with public and private keys

2. **Get User Organizations** - `GET /api/auth/user-organizations`
   - Returns user organizations with user-specific public keys
   - Includes encrypted data for frontend decryption

### Flow

1. **Generate User Secrets:**
   ```typescript
   // Backend decrypts organization data
   const decryptedData = await this.decryptWithBackendSystem({
     consumerKey: org.consumerKey,
     consumerSecret: org.consumerSecret,
   });

   // Create user-specific encryption
   const userSecret = UserSecretEncryptionManager.createUserSecret({
     consumerKey: decryptedData.consumerKey,
     consumerSecret: decryptedData.consumerSecret,
     wooCommerceUrl: org.wooCommerceUrl,
   });

   // Store in UserSecret table
   // Return private key to frontend
   ```

2. **Frontend Usage:**
   ```javascript
   // Store private key securely
   localStorage.setItem(`user_org_key_${orgId}`, privateKey);

   // Decrypt organization data
   const decryptedSecrets = decrypt(encryptedData, privateKey);
   ```

## Security Benefits

### Backend Encryption
1. **Data at Rest Protection**: Organization credentials encrypted in database
2. **Server-Side Access Control**: Only backend can decrypt using server keys
3. **Migration Support**: Handles both encrypted and plain text data

### User-Specific Encryption
1. **User Isolation**: Each user has separate encrypted copies
2. **Frontend Control**: Only frontend can decrypt with private keys
3. **Per-Organization Keys**: Unique encryption per user-organization pair
4. **Access Revocation**: Individual user access can be removed

## API Usage Examples

### 1. Create Organization (with Backend Encryption)

```bash
POST /api/auth/organization/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Store",
  "wooCommerceUrl": "https://mystore.com",
  "consumerKey": "ck_secret123",        # Will be encrypted
  "consumerSecret": "cs_secret456"      # Will be encrypted
}

Response:
{
  "message": "Organization created successfully",
  "data": {
    "id": "uuid",
    "name": "My Store",
    "slug": "my-store",
    "wooCommerceUrl": "https://mystore.com"
    # consumerKey and consumerSecret are encrypted in database
  }
}
```

### 2. Generate User Secrets

```bash
POST /api/auth/user-secrets/generate
Authorization: Bearer <token>

Response:
{
  "organizations": [
    {
      "organizationId": "uuid",
      "organizationName": "My Store",
      "organizationSlug": "my-store",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    }
  ],
  "message": "Generated secrets for 1 organizations"
}
```

### 3. Get User Organizations

```bash
GET /api/auth/user-organizations
Authorization: Bearer <token>

Response:
{
  "organizations": [
    {
      "organizationId": "uuid",
      "organizationName": "My Store",
      "organizationSlug": "my-store",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "encryptedData": "encrypted_json_string",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

## Implementation Files

### Core Files
- `src/common/utilities/encryption.util.ts` - Encryption utilities
- `src/common/entities/user-secret.entity.ts` - UserSecret entity
- `src/modules/auth/user-secret.service.ts` - User secret management
- `src/modules/auth/auth.controller.ts` - API endpoints
- `prisma/schema.prisma` - UserSecret table definition

### Key Classes
- `OrganizationEncryptionManager` - Backend encryption
- `UserSecretEncryptionManager` - User-specific encryption
- `UserSecretService` - Business logic for user secrets

## Environment Variables Required

```env
# Server keys for backend encryption
SERVER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

## Migration Strategy

1. **Existing Organizations**: Use migration-capable decryption in UserSecretService
2. **New Organizations**: Automatically use backend encryption
3. **Backward Compatibility**: Handles both encrypted and plain text data
4. **Gradual Migration**: Can migrate organizations on-demand

## Security Considerations

1. **Server Keys**: Keep server private key secure and separate from database
2. **User Private Keys**: Frontend responsible for secure storage
3. **Key Rotation**: Backend keys can be rotated with migration script
4. **Access Control**: UserSecret records provide granular access control
5. **Data Separation**: Backend and user encryption are completely separate

This dual-layer approach provides maximum security with backend-controlled data protection and user-specific access control.
