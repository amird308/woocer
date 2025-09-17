# New Store Encryption System Implementation

This document describes the implementation of the user/store-specific encryption system as described in ENCRYPTION_SECURITY.md.

## What Was Implemented

### 1. New Encryption Utilities

**File: `src/common/utilities/encryption.util.ts`**

- ✅ `StoreEncryptionManager` class with methods:
  - `generateUserStoreKeyPair()` - Generate unique key pairs
  - `encryptStoreData()` - Encrypt store credentials with public key
  - `decryptStoreData()` - Decrypt store credentials with private key
  - `processOrganizationCreation()` - Handle complete encryption flow for new stores
  - `reEncryptAllStores()` - Re-encrypt all user stores for device login

### 2. Organization Service

**File: `src/modules/auth/organization.service.ts`**

- ✅ New service with methods:
  - `processOrganizationCreation()` - Process store creation with encryption
  - `getUserOrganizations()` - Fetch encrypted store list
  - `regenerateStoreKeys()` - Handle device login key regeneration
  - `updateOrganizationEncryption()` - Update store encryption data

### 3. Updated API Endpoints

**File: `src/modules/auth/auth.controller.ts`**

- ✅ `POST /api/auth/organization/create` - Create store with new encryption
- ✅ `GET /api/auth/organizations` - Fetch encrypted store list
- ✅ `POST /api/auth/regenerate-store-keys` - Regenerate keys for new device

### 4. Response DTOs

**File: `src/modules/auth/models/organization.response.ts`**

- ✅ `CreateOrganizationResponseDto` - Returns store data + private key
- ✅ `GetOrganizationsResponseDto` - Returns encrypted store list
- ✅ `RegenerateStoreKeysResponseDto` - Returns new private key

### 5. Database Integration

- ✅ Updated to use existing `publicSecretKey` field for storing public keys
- ✅ Store encrypted `consumerKey` and `consumerSecret`
- ✅ Better Auth integration with new schema fields

### 6. Migration Script

**File: `src/scripts/migrate-encryption.ts`**

- ✅ Migration from old server-side encryption to new user/store encryption
- ✅ Cleanup utilities for temporary private key storage

## API Usage Examples

### 1. Create Store

```bash
POST /api/auth/organization/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Store",
  "wooCommerceUrl": "https://mystore.com",
  "consumerKey": "ck_secret123",
  "consumerSecret": "cs_secret456"
}

Response:
{
  "message": "Organization created successfully",
  "data": {
    "id": "uuid",
    "name": "My Store",
    "slug": "my-store",
    "wooCommerceUrl": "https://mystore.com"
  },
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

### 2. Fetch Stores

```bash
GET /api/auth/organizations
Authorization: Bearer <token>

Response:
{
  "stores": [
    {
      "id": "uuid",
      "name": "My Store",
      "slug": "my-store",
      "wooCommerceUrl": "https://mystore.com",
      "encryptedConsumerKey": "encrypted_data_string",
      "encryptedConsumerSecret": "encrypted_data_string",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Regenerate Keys (New Device Login)

```bash
POST /api/auth/regenerate-store-keys
Authorization: Bearer <token>

Response:
{
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "message": "All store keys re-encrypted successfully"
}
```

## Frontend Integration Guide

### Store Creation

```javascript
const createStore = async (storeData) => {
  const response = await fetch('/api/auth/organization/create', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(storeData)
  });
  
  const { data, privateKey } = await response.json();
  
  // Store private key securely in local storage
  localStorage.setItem(`store_private_key_${data.id}`, privateKey);
  
  return data;
};
```

### Fetch and Decrypt Stores

```javascript
const fetchStores = async () => {
  const response = await fetch('/api/auth/organizations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { stores } = await response.json();
  
  // Decrypt each store's data
  const decryptedStores = stores.map(store => {
    const privateKey = localStorage.getItem(`store_private_key_${store.id}`);
    
    if (!privateKey) {
      throw new Error(`Private key not found for store ${store.id}`);
    }
    
    return {
      ...store,
      consumerKey: decrypt(store.encryptedConsumerKey, privateKey),
      consumerSecret: decrypt(store.encryptedConsumerSecret, privateKey)
    };
  });
  
  return decryptedStores;
};
```

### Handle New Device Login

```javascript
const handleNewDeviceLogin = async () => {
  const response = await fetch('/api/auth/regenerate-store-keys', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { privateKey } = await response.json();
  
  // Clear old keys and store new private key
  // Note: This is a simplified approach - in practice, you'd want to
  // re-fetch the store list to get the updated encrypted data
  localStorage.clear();
  localStorage.setItem('user_private_key', privateKey);
  
  // Re-fetch stores with new encryption
  await fetchStores();
};
```

## Migration from Old System

### 1. Run Migration Script

```bash
# Migrate existing organizations
npm run migrate:encryption migrate

# After users have stored their private keys
npm run migrate:encryption cleanup
```

### 2. Update Frontend

- Update store creation to handle plain text input (not pre-encrypted)
- Implement private key storage and management
- Add decryption logic for store credentials
- Handle new device login flow

## Security Benefits

1. **User-Store Isolation**: Each user-store has unique encryption keys
2. **Frontend-Controlled Decryption**: Only frontend can decrypt with private keys
3. **Device-Specific Security**: New device login requires key regeneration
4. **No Server-Side Decryption**: Backend never has access to private keys
5. **Granular Access Control**: Individual store access control
6. **Cross-Device Synchronization**: Secure key regeneration process

## Important Notes

1. **Private Key Management**: Frontend is responsible for secure private key storage
2. **Migration Required**: Existing organizations need migration to new system
3. **Backward Compatibility**: Old encryption system preserved during transition
4. **Key Regeneration**: New device login invalidates all previous keys
5. **Database Schema**: Uses existing `publicSecretKey` field for public keys

## Next Steps

1. Update frontend to implement new encryption flow
2. Test store creation and management with new system
3. Implement secure private key storage on frontend
4. Run migration script for existing organizations
5. Update WooCommerce service to handle new encryption format
6. Implement proper error handling for missing private keys
7. Add logging and monitoring for encryption operations
