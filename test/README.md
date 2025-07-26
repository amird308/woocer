# Organization Encryption Security Tests

This directory contains comprehensive tests for the organization encryption security system implemented in the Woocer backend.

## Test Overview

The encryption security system protects sensitive WooCommerce credentials using asymmetric (RSA + AES) encryption. These tests verify the complete flow from frontend encryption to database storage and runtime decryption.

## Test Structure

```
test/
├── demo/
│   └── organization-encryption-demo.ts     # Interactive demo script
└── integration/
    └── organization-creation.e2e-spec.ts   # End-to-end integration tests

src/common/utilities/
├── encryption.util.spec.ts                 # Unit tests for encryption utilities
├── key-generator.util.spec.ts             # Unit tests for key generation
└── woocommerce/
    └── woocommerce.service.spec.ts        # WooCommerce service tests
```

## Running Tests

### 1. Unit Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- encryption.util.spec.ts
npm test -- key-generator.util.spec.ts
npm test -- woocommerce.service.spec.ts
```

### 2. Integration Tests

```bash
# Run integration tests
npm run test:e2e

# Run specific integration test
npm run test:e2e -- organization-creation.e2e-spec.ts
```

### 3. Interactive Demo

```bash
# Run the complete encryption flow demo
npx tsx test/demo/organization-encryption-demo.ts
```

## Test Categories

### 🔐 Unit Tests (`src/common/utilities/`)

#### `encryption.util.spec.ts`
- **AsymmetricEncryption Class Tests**
  - RSA key pair generation
  - Hybrid encryption/decryption (RSA + AES)
  - Data integrity with authentication tags
  - Error handling for wrong keys
  - Special character and Unicode support

- **OrganizationEncryptionManager Class Tests**
  - Frontend data processing (decrypt + re-encrypt)
  - Environment variable validation
  - Stored data decryption
  - Error handling for corrupted data

#### `key-generator.util.spec.ts`
- Key generation utilities
- Environment variable formatting
- Key quality and security validation
- Performance benchmarks

#### `woocommerce.service.spec.ts`
- Organization config decryption
- Error handling for missing/corrupted data
- Environment key validation
- Webhook signature validation

### 🌐 Integration Tests (`test/integration/`)

#### `organization-creation.e2e-spec.ts`
- Complete organization creation flow
- Frontend → Server → Database → WooCommerce service
- Error scenarios and edge cases
- Performance testing
- Security validation

### 🎯 Demo Script (`test/demo/`)

#### `organization-encryption-demo.ts`
Interactive demonstration of the complete encryption flow:

1. **Key Generation**: Generate RSA key pairs
2. **Frontend Encryption**: Simulate client-side data encryption
3. **Server Processing**: beforeCreate hook simulation
4. **Database Storage**: Encrypted data storage/retrieval
5. **WooCommerce Decryption**: Service-level data decryption
6. **Security Validation**: Wrong key rejection, tampering detection

## What the Tests Verify

### 🔒 Security Features

- **Asymmetric Encryption**: RSA-2048 + AES-256-GCM hybrid encryption
- **Key Management**: Proper key generation and environment setup
- **Data Integrity**: Authentication tags prevent tampering
- **Access Control**: Wrong keys are rejected
- **Environment Security**: Missing keys are detected

### 📊 Performance

- **Encryption Speed**: Multiple encryptions within reasonable time
- **Decryption Speed**: Bulk decryption performance
- **Large Data**: Handling of large organization data
- **Memory Usage**: Efficient processing without leaks

### 🛡️ Error Handling

- **Wrong Keys**: Graceful failure with proper error messages
- **Corrupted Data**: Detection and handling of tampered data
- **Missing Config**: Environment validation
- **Database Errors**: Connection and query failure handling

### 🔄 Complete Flow

- **Frontend → Server**: Encrypted data transmission
- **Server Processing**: Decrypt + re-encrypt for storage
- **Database Storage**: Secure encrypted storage
- **Runtime Decryption**: On-demand decryption for API calls

## Expected Test Results

### ✅ All Tests Should Pass

- **Unit Tests**: ~50+ test cases covering all utilities
- **Integration Tests**: ~15+ test cases covering the complete flow
- **Demo Script**: Interactive validation of the entire system

### 📈 Performance Benchmarks

- **Key Generation**: < 10 seconds per key pair
- **Encryption**: < 100ms per organization data set
- **Decryption**: < 50ms per organization data set
- **E2E Flow**: < 5 seconds for complete flow

## Test Data

### Sample Organization Data
```typescript
{
  name: 'Test WooCommerce Store',
  consumerKey: 'ck_1234567890abcdef1234567890abcdef12345678',
  consumerSecret: 'cs_abcdef1234567890abcdef1234567890abcdef12',
  wooCommerceUrl: 'https://teststore.com/wp-json/wc/v3/'
}
```

### Test Scenarios

1. **Happy Path**: Normal organization creation with encryption
2. **Error Cases**: Wrong keys, corrupted data, missing environment
3. **Edge Cases**: Empty data, special characters, large data sets
4. **Security Tests**: Tampering detection, unauthorized access
5. **Performance Tests**: Bulk operations, time constraints

## Debugging Tests

### Environment Setup
```bash
# Set test environment variables
export SERVER_PUBLIC_KEY="..."
export SERVER_PRIVATE_KEY="..."
export DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
```

### Verbose Output
```bash
# Run tests with detailed output
npm test -- --verbose
npm run test:e2e -- --verbose

# Debug specific test
npm test -- --testNamePattern="should encrypt and decrypt"
```

### Common Issues

1. **Missing Environment Variables**
   - Ensure test keys are generated and set
   - Check environment variable formatting

2. **Database Connection**
   - Verify test database is running
   - Check connection string format

3. **Performance Timeouts**
   - Increase test timeout for key generation
   - Check system performance

## Security Considerations

### Test Key Management
- Tests generate temporary keys for isolation
- No production keys in test code
- Environment cleanup after tests

### Data Protection
- Test data contains no real credentials
- Encrypted test data is meaningless
- No sensitive information in logs

## Next Steps

After running these tests successfully:

1. **Generate Production Keys**: Use the key generator script
2. **Configure Environment**: Set up production environment variables
3. **Deploy with Confidence**: All encryption flows are verified
4. **Monitor Performance**: Use test benchmarks as baselines

## Contributing

When adding new encryption features:

1. **Add Unit Tests**: Test individual functions thoroughly
2. **Update Integration Tests**: Verify end-to-end functionality
3. **Update Demo**: Show new features in the demo script
4. **Document Changes**: Update this README and security docs 