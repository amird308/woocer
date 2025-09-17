# Store Encryption Security System

This document describes the user/store-specific asymmetric encryption security system implemented for protecting sensitive store data (WooCommerce credentials) in the Woocer backend.

## Overview

The system uses **user/store-specific key pairs** to secure sensitive store fields:
- `consumerKey` - WooCommerce API consumer key
- `consumerSecret` - WooCommerce API consumer secret
- Website URL and other sensitive store information

Each user-store combination has its own unique public/private key pair for maximum security isolation.

## Security Flow

### 1. Store Creation

**Frontend → Backend**

User creates a store and sends:
- Website URL  
- Secret keys  

**Backend**

1. Save store information in the database encrypted (for backend access)
2. Generate a key pair per user-store (public/private)
3. Encrypt the store's secret keys using the user/store public key
4. Save encrypted keys and public key in the database
5. Send the private key to the frontend

**Frontend**

- Store the private key securely (e.g., local storage with strong encryption)

### 2. Fetch Store List

**Frontend → Backend**

- Calls API to fetch the user's stores

**Backend**

- Returns a list of stores, including:
  - Encrypted store keys
  - User/store public key

**Frontend**

- Decrypt store keys using the private key + public key

### 3. Login on Another Device

**Flow**

1. Remove all previous user/store public keys and encrypted data on the backend
2. Generate a new private key for the user
3. Re-encrypt all store keys with the new public key
4. Send the new private key to the frontend for storage

## Architecture Components

### 1. UserStoreEncryption Class
- **Purpose**: User/store-specific encryption/decryption utilities
- **Algorithm**: RSA-2048 for key encryption + AES-256-GCM for data encryption
- **Location**: `src/common/utilities/encryption.util.ts`

### 2. StoreEncryptionManager Class  
- **Purpose**: High-level store data processing
- **Functions**:
  - `generateUserStoreKeyPair()` - Generate unique key pair per user-store
  - `encryptStoreData()` - Encrypt store data using user/store public key
  - `decryptStoreData()` - Decrypt store data using private key
  - `reEncryptAllStores()` - Re-encrypt all user stores with new key pair

### 3. Store Creation Integration
- **Hook**: Store creation endpoint
- **Process**: 
  - Generate unique key pair for user-store combination
  - Encrypt sensitive store data with public key
  - Store encrypted data and public key in database
  - Return private key to frontend
- **Location**: Store module service and controller

## Implementation Details

### 1. Database Schema

The store table should include fields for:
- `encryptedConsumerKey` - Store's consumer key encrypted with user/store public key
- `encryptedConsumerSecret` - Store's consumer secret encrypted with user/store public key
- `publicKey` - User/store specific public key for this store
- `userId` - Reference to the user who owns this store

### 2. Backend API Endpoints

**Create Store Endpoint:**
```typescript
POST /stores
{
  "name": "My Store",
  "wooCommerceUrl": "https://mystore.com",
  "consumerKey": "ck_secret123",
  "consumerSecret": "cs_secret456"
}

Response:
{
  "storeId": "uuid",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

**Fetch Stores Endpoint:**
```typescript
GET /stores

Response:
{
  "stores": [
    {
      "id": "uuid",
      "name": "My Store",
      "wooCommerceUrl": "https://mystore.com",
      "encryptedConsumerKey": "encrypted_data",
      "encryptedConsumerSecret": "encrypted_data",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
    }
  ]
}
```

**Login/Device Change Endpoint:**
```typescript
POST /auth/regenerate-store-keys

Response:
{
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "message": "All store keys re-encrypted successfully"
}
```

### 3. Frontend Integration

```javascript
// Store Creation
const createStore = async (storeData) => {
  const response = await fetch('/api/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData)
  });
  
  const { storeId, privateKey } = await response.json();
  
  // Store private key securely in local storage
  localStorage.setItem(`store_private_key_${storeId}`, privateKey);
  
  return storeId;
};

// Fetch and Decrypt Stores
const fetchStores = async () => {
  const response = await fetch('/api/stores');
  const { stores } = await response.json();
  
  // Decrypt each store's data
  const decryptedStores = stores.map(store => {
    const privateKey = localStorage.getItem(`store_private_key_${store.id}`);
    
    return {
      ...store,
      consumerKey: decrypt(store.encryptedConsumerKey, privateKey),
      consumerSecret: decrypt(store.encryptedConsumerSecret, privateKey)
    };
  });
  
  return decryptedStores;
};

// Handle Login on New Device
const handleNewDeviceLogin = async () => {
  const response = await fetch('/api/auth/regenerate-store-keys', {
    method: 'POST'
  });
  
  const { privateKey } = await response.json();
  
  // Clear old keys and store new private key
  localStorage.clear();
  localStorage.setItem('user_private_key', privateKey);
};
```

## Security Benefits

1. **User-Store Isolation**: Each user-store combination has unique encryption keys
2. **Frontend-Controlled Decryption**: Only the frontend can decrypt store data with private keys
3. **Device-Specific Security**: New device login requires re-encryption of all store data
4. **No Server-Side Decryption**: Backend never stores or has access to private keys
5. **Granular Access Control**: Individual store access can be revoked without affecting others
6. **Cross-Device Synchronization**: Secure key regeneration for new device access

## Key Management

### Security Best Practices

- **Frontend Key Storage**: Store private keys securely in browser storage with encryption
- **Key Regeneration**: Automatically regenerate keys when logging in from new devices
- **User-Store Specific Keys**: Each store has its own unique key pair per user
- **Secure Key Transmission**: Private keys are only sent once during store creation/device login
- **Local Key Management**: Frontend is responsible for securely managing private keys

### Device Login Process

1. User logs in from a new device
2. Backend detects new device login
3. All existing user/store public keys are invalidated
4. New key pairs are generated for all user stores
5. All store data is re-encrypted with new public keys
6. New private key is sent to frontend for storage
7. Old encrypted data becomes inaccessible from other devices

## Error Handling

The system includes comprehensive error handling:

- **Key Generation Failures**: Store creation is aborted if key pair generation fails
- **Encryption Failures**: Store data encryption failures are logged and creation is aborted
- **Missing Private Keys**: Frontend gracefully handles missing private keys during decryption
- **Invalid Data**: Validation before encryption to prevent corrupted data
- **Device Login Failures**: Re-encryption process failures are logged and user is notified

## Performance Considerations

- **Frontend Decryption**: Decryption happens on the frontend, reducing server load
- **Key Caching**: Private keys are cached in frontend storage for performance
- **Batch Re-encryption**: During device login, all stores are re-encrypted in batch operations
- **Selective Decryption**: Only decrypt store data when explicitly needed by user

## Monitoring & Logging

Key events are logged for security monitoring:

- Store creation with key generation status
- Key pair generation and encryption operations
- Device login and re-encryption processes
- Failed encryption/decryption attempts
- Private key transmission events

## Troubleshooting

### Common Issues

1. **"Failed to generate key pair for store"**
   - Check server's ability to generate RSA key pairs
   - Verify sufficient system resources for key generation

2. **"Cannot decrypt store data - missing private key"**
   - Ensure private key is stored in frontend localStorage
   - Check if user needs to log in from new device to regenerate keys

3. **"Re-encryption failed during device login"**
   - Verify all user stores are accessible in database
   - Check for any corrupted encrypted data

4. **"Private key not received from server"**
   - Check network connectivity during store creation
   - Verify API response includes private key

### Debug Mode

Enable debug logging to troubleshoot encryption issues:

```env
LOG_LEVEL=debug
```

This will log detailed key generation, encryption/decryption operations, and device login processes for debugging.

## Migration from Previous System

If migrating from the previous server-side encryption system:

1. **Backup existing encrypted data** before migration
2. **Decrypt existing organization data** using old server keys
3. **Re-encrypt per user-store** using new key pair system
4. **Update frontend** to handle private key storage and decryption
5. **Test thoroughly** before removing old encryption system

### Migration Script

```typescript
// Example migration script structure
async function migrateToUserStoreEncryption() {
  const organizations = await getAllOrganizations();
  
  for (const org of organizations) {
    // Decrypt with old server keys
    const decryptedData = await decryptWithServerKeys(org);
    
    // Generate new user-store key pair
    const { publicKey, privateKey } = await generateKeyPair();
    
    // Re-encrypt with new keys
    const encryptedData = await encryptWithUserStoreKeys(decryptedData, publicKey);
    
    // Update database
    await updateOrganization(org.id, { 
      ...encryptedData, 
      publicKey 
    });
    
    // Notify user to store new private key
    await notifyUserOfNewPrivateKey(org.userId, privateKey);
  }
}
``` 