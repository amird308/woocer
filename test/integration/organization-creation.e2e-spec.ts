import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  AsymmetricEncryption,
  OrganizationEncryptionManager,
} from '../../src/common/utilities/encryption.util';
import { WooCommerceService } from '../../src/modules/woocommerce/woocommerce.service';
import { randomUUID } from 'node:crypto';

describe('Organization Creation with Encryption (E2E)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let wooCommerceService: WooCommerceService;
  let originalEnv: NodeJS.ProcessEnv;
  let testServerKeyPair: { publicKey: string; privateKey: string };

  beforeAll(async () => {
    // Backup original environment
    originalEnv = process.env;

    // Generate test keys
    testServerKeyPair = AsymmetricEncryption.generateKeyPair();

    // Set test environment variables
    process.env = {
      ...originalEnv,
      SERVER_PUBLIC_KEY: testServerKeyPair.publicKey,
      SERVER_PRIVATE_KEY: testServerKeyPair.privateKey,
      DATABASE_URL:
        'postgresql://postgres:secretPassword@localhost:5432/woocer',
      APP_URL: 'http://localhost:3000',
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, WooCommerceService],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    wooCommerceService =
      moduleFixture.get<WooCommerceService>(WooCommerceService);

    await app.init();
  });

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    // await prismaService.organization.deleteMany();
    // await prismaService.user.deleteMany();
  });

  describe('Organization Creation Flow', () => {
    const testOrgData = {
      name: 'Test WooCommerce Store',
      slug: 'test-woocommerce-store',
      consumerKey: 'ck_1234567890abcdef1234567890abcdef12345678',
      consumerSecret: 'cs_abcdef1234567890abcdef1234567890abcdef12',
      wooCommerceUrl: 'https://teststore.com/wp-json/wc/v3/',
    };

    it('should simulate complete organization creation flow with encryption', async () => {
      // Step 1: Simulate frontend encrypting data before sending
      const frontendEncryptedData = {
        name: testOrgData.name,
        slug: testOrgData.slug,
        consumerKey: AsymmetricEncryption.encryptData(
          testOrgData.consumerKey,
          testServerKeyPair.publicKey,
        ),
        consumerSecret: AsymmetricEncryption.encryptData(
          testOrgData.consumerSecret,
          testServerKeyPair.publicKey,
        ),
        wooCommerceUrl: AsymmetricEncryption.encryptData(
          testOrgData.wooCommerceUrl,
          testServerKeyPair.publicKey,
        ),
      };

      // Step 2: Simulate beforeCreate hook processing
      const mockOrgCreationData = {
        organization: frontendEncryptedData,
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      // Simulate the beforeCreate hook logic
      const processedData =
        OrganizationEncryptionManager.processOrganizationData({
          consumerKey: mockOrgCreationData.organization.consumerKey,
          consumerSecret: mockOrgCreationData.organization.consumerSecret,
          wooCommerceUrl: mockOrgCreationData.organization.wooCommerceUrl,
        });

      // Verify data is encrypted for storage
      expect(processedData.consumerKey).toEqual(expect.any(String));
      expect(processedData.consumerSecret).toEqual(expect.any(String));
      expect(processedData.wooCommerceUrl).toEqual(expect.any(String));

      // Verify they are JSON strings of EncryptedData objects
      const parsedConsumerKey = JSON.parse(processedData.consumerKey);
      const parsedConsumerSecret = JSON.parse(processedData.consumerSecret);
      const parsedWooCommerceUrl = JSON.parse(processedData.wooCommerceUrl);

      expect(parsedConsumerKey).toHaveProperty('encryptedData');
      expect(parsedConsumerKey).toHaveProperty('encryptedSymmetricKey');
      expect(parsedConsumerSecret).toHaveProperty('encryptedData');
      expect(parsedConsumerSecret).toHaveProperty('encryptedSymmetricKey');
      expect(parsedWooCommerceUrl).toHaveProperty('encryptedData');
      expect(parsedWooCommerceUrl).toHaveProperty('encryptedSymmetricKey');

      // Step 3: Simulate storing in database
      const createdOrg = await prismaService.organization.create({
        data: {
          id: randomUUID(),
          name: testOrgData.name,
          slug: testOrgData.slug,
          consumerKey: processedData.consumerKey,
          consumerSecret: processedData.consumerSecret,
          wooCommerceUrl: processedData.wooCommerceUrl,
          createdAt: new Date(),
        },
      });

      expect(createdOrg).toBeDefined();
      expect(createdOrg.name).toBe(testOrgData.name);

      // Step 4: Verify data can be decrypted when retrieved
      const config = await wooCommerceService.getOrganizationConfig(
        createdOrg.id,
      );

      expect(config).toBeDefined();
      expect(config!.consumerKey).toBe(testOrgData.consumerKey);
      expect(config!.consumerSecret).toBe(testOrgData.consumerSecret);
      expect(config!.wooCommerceUrl).toBe(testOrgData.wooCommerceUrl);
    });

    it('should handle organization creation with plain text data (fallback)', async () => {
      // Simulate case where frontend sends plain text (development mode)
      const plainData = {
        consumerKey: testOrgData.consumerKey,
        consumerSecret: testOrgData.consumerSecret,
        wooCommerceUrl: testOrgData.wooCommerceUrl,
      };

      const processedData =
        OrganizationEncryptionManager.processOrganizationData(plainData);

      // Should still encrypt for storage
      expect(processedData.consumerKey).toEqual(expect.any(String));
      expect(processedData.consumerSecret).toEqual(expect.any(String));
      expect(processedData.wooCommerceUrl).toEqual(expect.any(String));

      // Store in database
      const createdOrg = await prismaService.organization.create({
        data: {
          id: randomUUID(),
          name: testOrgData.name,
          slug: 'test-org-plain',
          consumerKey: processedData.consumerKey,
          consumerSecret: processedData.consumerSecret,
          wooCommerceUrl: processedData.wooCommerceUrl,
          createdAt: new Date(),
        },
      });

      // Verify data can be decrypted
      const config = await wooCommerceService.getOrganizationConfig(
        createdOrg.id,
      );
      expect(config!.consumerKey).toBe(testOrgData.consumerKey);
      expect(config!.consumerSecret).toBe(testOrgData.consumerSecret);
      expect(config!.wooCommerceUrl).toBe(testOrgData.wooCommerceUrl);
    });

    it('should fail gracefully when encryption keys are missing', async () => {
      // Temporarily remove encryption keys
      delete process.env.SERVER_PUBLIC_KEY;
      delete process.env.SERVER_PRIVATE_KEY;

      const testData = {
        consumerKey: testOrgData.consumerKey,
        consumerSecret: testOrgData.consumerSecret,
        wooCommerceUrl: testOrgData.wooCommerceUrl,
      };

      expect(() => {
        OrganizationEncryptionManager.processOrganizationData(testData);
      }).toThrow('SERVER_PRIVATE_KEY is not configured or is empty');

      // Restore keys for other tests
      process.env.SERVER_PUBLIC_KEY = testServerKeyPair.publicKey;
      process.env.SERVER_PRIVATE_KEY = testServerKeyPair.privateKey;
    });

    it('should handle corrupted encrypted data gracefully', async () => {
      // Create organization with corrupted encrypted data
      const corruptedOrg = await prismaService.organization.create({
        data: {
          id: randomUUID(),
          name: 'Corrupted Org',
          slug: 'corrupted-org',
          consumerKey: '{"corrupted": "data"}',
          consumerSecret: '{"corrupted": "data"}',
          wooCommerceUrl: '{"corrupted": "data"}',
          createdAt: new Date(),
        },
      });

      // Should return null when unable to decrypt
      const config = await wooCommerceService.getOrganizationConfig(
        corruptedOrg.id,
      );
      expect(config).toBeNull();
    });
  });

  describe('End-to-End Encryption Security', () => {
    it('should ensure encrypted data cannot be read without private key', async () => {
      const sensitiveData = {
        consumerKey: 'ck_super_secret_key_123456789',
        consumerSecret: 'cs_super_secret_456789012345',
      };

      // Encrypt with correct key
      const encrypted = AsymmetricEncryption.encryptOrganizationData(
        sensitiveData.consumerKey,
        sensitiveData.consumerSecret,
        testServerKeyPair.publicKey,
      );

      // Try to decrypt with wrong key
      const wrongKeyPair = AsymmetricEncryption.generateKeyPair();

      expect(() => {
        AsymmetricEncryption.decryptOrganizationData(
          encrypted.consumerKey,
          encrypted.consumerSecret,
          wrongKeyPair.privateKey,
        );
      }).toThrow('Decryption failed');
    });

    it('should verify data integrity with authentication tags', async () => {
      const originalData = 'ck_test_data_integrity';
      const encrypted = AsymmetricEncryption.encryptData(
        originalData,
        testServerKeyPair.publicKey,
      );

      // Tamper with encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: encrypted.encryptedData.replace('a', 'b'), // Modify a character
      };

      expect(() => {
        AsymmetricEncryption.decryptData(
          tamperedEncrypted,
          testServerKeyPair.privateKey,
        );
      }).toThrow('Decryption failed');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large organization data efficiently', async () => {
      const largeData = {
        consumerKey: 'ck_' + 'a'.repeat(1000), // Large consumer key
        consumerSecret: 'cs_' + 'b'.repeat(1000), // Large consumer secret
        wooCommerceUrl: 'https://verylongdomainname'.repeat(10) + '.com',
      };

      const startTime = Date.now();

      const encrypted = AsymmetricEncryption.encryptOrganizationData(
        largeData.consumerKey,
        largeData.consumerSecret,
        testServerKeyPair.publicKey,
      );

      const decrypted = AsymmetricEncryption.decryptOrganizationData(
        encrypted.consumerKey,
        encrypted.consumerSecret,
        testServerKeyPair.privateKey,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(decrypted).toEqual(largeData);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle empty organization data', async () => {
      // Ensure environment variables are set for this test
      process.env.SERVER_PUBLIC_KEY = testServerKeyPair.publicKey;
      process.env.SERVER_PRIVATE_KEY = testServerKeyPair.privateKey;

      const emptyData = {
        consumerKey: '',
        consumerSecret: '',
        wooCommerceUrl: '',
      };

      const processedData =
        OrganizationEncryptionManager.processOrganizationData(emptyData);

      expect(processedData.consumerKey).toEqual(expect.any(String));
      expect(processedData.consumerSecret).toEqual(expect.any(String));
    });

    it('should handle special characters in WooCommerce URLs', async () => {
      const specialUrlData = {
        consumerKey: 'ck_test123',
        consumerSecret: 'cs_test456',
        wooCommerceUrl:
          'https://test.example.com/wp-json/wc/v3/?param=value&other=special%20chars',
      };

      const encrypted = AsymmetricEncryption.encryptOrganizationData(
        specialUrlData.consumerKey,
        specialUrlData.consumerSecret,
        testServerKeyPair.publicKey,
      );

      const decrypted = AsymmetricEncryption.decryptOrganizationData(
        encrypted.consumerKey,
        encrypted.consumerSecret,
        testServerKeyPair.privateKey,
      );

      expect(decrypted).toEqual(specialUrlData);
    });
  });
});
