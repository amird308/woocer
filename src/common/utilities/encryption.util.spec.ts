import {
  AsymmetricEncryption,
  OrganizationEncryptionManager,
  KeyPair,
} from './encryption.util';

describe('AsymmetricEncryption', () => {
  let keyPair: KeyPair;

  beforeEach(() => {
    keyPair = AsymmetricEncryption.generateKeyPair();
  });

  describe('generateKeyPair', () => {
    it('should generate valid RSA key pair', () => {
      const keys = AsymmetricEncryption.generateKeyPair();

      expect(keys.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keys.publicKey).toContain('-----END PUBLIC KEY-----');
      expect(keys.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
      expect(keys.privateKey).toContain('-----END PRIVATE KEY-----');
    });

    it('should generate different key pairs each time', () => {
      const keys1 = AsymmetricEncryption.generateKeyPair();
      const keys2 = AsymmetricEncryption.generateKeyPair();

      expect(keys1.publicKey).not.toBe(keys2.publicKey);
      expect(keys1.privateKey).not.toBe(keys2.privateKey);
    });
  });

  describe('encryptData and decryptData', () => {
    const testData = 'ck_1234567890abcdef1234567890abcdef12345678';

    it('should encrypt and decrypt data successfully', () => {
      const encrypted = AsymmetricEncryption.encryptData(
        testData,
        keyPair.publicKey,
      );
      const decrypted = AsymmetricEncryption.decryptData(
        encrypted,
        keyPair.privateKey,
      );

      expect(decrypted).toBe(testData);
    });

    it('should return EncryptedData with correct structure', () => {
      const encrypted = AsymmetricEncryption.encryptData(
        testData,
        keyPair.publicKey,
      );

      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('encryptedSymmetricKey');
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(typeof encrypted.encryptedSymmetricKey).toBe('string');
      expect(encrypted.encryptedData).toContain(':'); // Should contain IV:authTag:data format
    });

    it('should produce different encrypted outputs for same input', () => {
      const encrypted1 = AsymmetricEncryption.encryptData(
        testData,
        keyPair.publicKey,
      );
      const encrypted2 = AsymmetricEncryption.encryptData(
        testData,
        keyPair.publicKey,
      );

      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.encryptedSymmetricKey).not.toBe(
        encrypted2.encryptedSymmetricKey,
      );
    });

    it('should fail to decrypt with wrong private key', () => {
      const wrongKeyPair = AsymmetricEncryption.generateKeyPair();
      const encrypted = AsymmetricEncryption.encryptData(
        testData,
        keyPair.publicKey,
      );

      expect(() => {
        AsymmetricEncryption.decryptData(encrypted, wrongKeyPair.privateKey);
      }).toThrow('Decryption failed');
    });

    it('should handle special characters and unicode', () => {
      const specialData =
        'Test data with special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./ and unicode: 🔐✨';
      const encrypted = AsymmetricEncryption.encryptData(
        specialData,
        keyPair.publicKey,
      );
      const decrypted = AsymmetricEncryption.decryptData(
        encrypted,
        keyPair.privateKey,
      );

      expect(decrypted).toBe(specialData);
    });
  });

  describe('encryptOrganizationData and decryptOrganizationData', () => {
    const testOrgData = {
      consumerKey: 'ck_1234567890abcdef1234567890abcdef12345678',
      consumerSecret: 'cs_abcdef1234567890abcdef1234567890abcdef12',
    };

    it('should encrypt and decrypt organization data successfully', () => {
      const encrypted = AsymmetricEncryption.encryptOrganizationData(
        testOrgData.consumerKey,
        testOrgData.consumerSecret,
        keyPair.publicKey,
      );

      const decrypted = AsymmetricEncryption.decryptOrganizationData(
        encrypted.consumerKey,
        encrypted.consumerSecret,
        keyPair.privateKey,
      );

      expect(decrypted).toEqual(testOrgData);
    });

    it('should return properly structured encrypted organization data', () => {
      const encrypted = AsymmetricEncryption.encryptOrganizationData(
        testOrgData.consumerKey,
        testOrgData.consumerSecret,
        keyPair.publicKey,
      );

      expect(encrypted).toHaveProperty('consumerKey');
      expect(encrypted).toHaveProperty('consumerSecret');

      // Each field should be an EncryptedData object
      expect(encrypted.consumerKey).toHaveProperty('encryptedData');
      expect(encrypted.consumerKey).toHaveProperty('encryptedSymmetricKey');
      expect(encrypted.consumerSecret).toHaveProperty('encryptedData');
      expect(encrypted.consumerSecret).toHaveProperty('encryptedSymmetricKey');
    });
  });
});

describe('OrganizationEncryptionManager', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let serverKeyPair: KeyPair;

  beforeEach(() => {
    // Backup original environment
    originalEnv = process.env;

    // Generate test keys
    serverKeyPair = AsymmetricEncryption.generateKeyPair();

    // Set test environment variables
    process.env = {
      ...originalEnv,
      SERVER_PUBLIC_KEY: serverKeyPair.publicKey,
      SERVER_PRIVATE_KEY: serverKeyPair.privateKey,
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('processOrganizationData', () => {
    const testData = {
      consumerKey: 'ck_test123',
      consumerSecret: 'cs_test456',
    };

    it('should process already encrypted data correctly', () => {
      // Simulate data encrypted by frontend
      const frontendEncrypted = {
        consumerKey: AsymmetricEncryption.encryptData(
          testData.consumerKey,
          serverKeyPair.publicKey,
        ),
        consumerSecret: AsymmetricEncryption.encryptData(
          testData.consumerSecret,
          serverKeyPair.publicKey,
        ),
      };

      const processed =
        OrganizationEncryptionManager.processOrganizationData(
          frontendEncrypted,
        );

      expect(processed.consumerKey).toEqual(expect.any(String));
      expect(processed.consumerSecret).toEqual(expect.any(String));

      // Should be JSON strings of EncryptedData objects
      expect(() => JSON.parse(processed.consumerKey)).not.toThrow();
      expect(() => JSON.parse(processed.consumerSecret)).not.toThrow();
    });

    it('should handle plain string data (fallback)', () => {
      const processed =
        OrganizationEncryptionManager.processOrganizationData(testData);

      expect(processed.consumerKey).toEqual(expect.any(String));
      expect(processed.consumerSecret).toEqual(expect.any(String));
    });

    it('should throw error when server keys are not configured', () => {
      delete process.env.SERVER_PUBLIC_KEY;
      delete process.env.SERVER_PRIVATE_KEY;

      expect(() => {
        OrganizationEncryptionManager.processOrganizationData(testData);
      }).toThrow('Server encryption keys are not configured');
    });

    it('should preserve other fields in the data object', () => {
      const dataWithExtra = {
        ...testData,
        organizationName: 'Test Org',
        otherField: 'other value',
      };

      const processed =
        OrganizationEncryptionManager.processOrganizationData(dataWithExtra);

      expect(processed.organizationName).toBe('Test Org');
      expect(processed.otherField).toBe('other value');
    });
  });

  describe('decryptStoredOrganizationData', () => {
    it('should decrypt stored organization data correctly', () => {
      const originalData = {
        consumerKey: 'ck_test123',
        consumerSecret: 'cs_test456',
      };

      // Simulate the storage format (JSON stringified EncryptedData)
      const encryptedData = AsymmetricEncryption.encryptOrganizationData(
        originalData.consumerKey,
        originalData.consumerSecret,
        serverKeyPair.publicKey,
      );

      const storedData = {
        consumerKey: JSON.stringify(encryptedData.consumerKey),
        consumerSecret: JSON.stringify(encryptedData.consumerSecret),
      };

      const decrypted =
        OrganizationEncryptionManager.decryptStoredOrganizationData(storedData);

      expect(decrypted).toEqual(originalData);
    });

    it('should throw error when server private key is not configured', () => {
      delete process.env.SERVER_PRIVATE_KEY;

      const storedData = {
        consumerKey: '{"encryptedData":"test","encryptedSymmetricKey":"test"}',
        consumerSecret:
          '{"encryptedData":"test","encryptedSymmetricKey":"test"}',
      };

      expect(() => {
        OrganizationEncryptionManager.decryptStoredOrganizationData(storedData);
      }).toThrow('Server private key is not configured');
    });

    it('should throw error for invalid stored data format', () => {
      const invalidStoredData = {
        consumerKey: 'invalid json',
        consumerSecret: 'invalid json',
      };

      expect(() => {
        OrganizationEncryptionManager.decryptStoredOrganizationData(
          invalidStoredData,
        );
      }).toThrow('Failed to decrypt organization data');
    });
  });

  describe('end-to-end encryption flow', () => {
    it('should complete full encryption cycle successfully', () => {
      const originalData = {
        consumerKey: 'ck_full_test_1234567890abcdef',
        consumerSecret: 'cs_full_test_abcdef1234567890',
      };

      // Step 1: Frontend encrypts data
      const frontendEncrypted = {
        consumerKey: AsymmetricEncryption.encryptData(
          originalData.consumerKey,
          serverKeyPair.publicKey,
        ),
        consumerSecret: AsymmetricEncryption.encryptData(
          originalData.consumerSecret,
          serverKeyPair.publicKey,
        ),
      };

      // Step 2: Server processes (decrypt + re-encrypt for storage)
      const processedForStorage =
        OrganizationEncryptionManager.processOrganizationData(
          frontendEncrypted,
        );

      // Step 3: Simulate data stored in database and retrieved
      const retrievedFromDB = {
        consumerKey: processedForStorage.consumerKey,
        consumerSecret: processedForStorage.consumerSecret,
      };

      // Step 4: Server decrypts for use (e.g., in WooCommerce service)
      const decryptedForUse =
        OrganizationEncryptionManager.decryptStoredOrganizationData(
          retrievedFromDB,
        );

      expect(decryptedForUse).toEqual(originalData);
    });
  });
});
