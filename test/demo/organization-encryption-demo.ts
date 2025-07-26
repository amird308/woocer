#!/usr/bin/env npx tsx

/**
 * Organization Encryption Flow Demo
 *
 * This script demonstrates the complete organization creation flow with encryption:
 * 1. Generate encryption keys
 * 2. Simulate frontend encrypting organization data
 * 3. Simulate server processing (beforeCreate hook)
 * 4. Simulate database storage
 * 5. Simulate WooCommerce service decryption
 *
 * Run: npx tsx test/demo/organization-encryption-demo.ts
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import {
  AsymmetricEncryption,
  OrganizationEncryptionManager,
} from '../../src/common/utilities/encryption.util';
import { generateEncryptionKeys } from '../../src/common/utilities/key-generator.util';

// Demo configuration
const DEMO_CONFIG = {
  organization: {
    name: 'Demo WooCommerce Store',
    slug: 'demo-woocommerce-store',
    consumerKey: 'ck_1234567890abcdef1234567890abcdef12345678',
    consumerSecret: 'cs_abcdef1234567890abcdef1234567890abcdef12',
    wooCommerceUrl: 'https://demo-store.com/wp-json/wc/v3/',
  },
  user: {
    id: 'demo-user-123',
    name: 'Demo User',
    email: 'demo@example.com',
  },
};

class OrganizationEncryptionDemo {
  private serverKeyPair: { publicKey: string; privateKey: string };
  private clientKeyPair: { publicKey: string; privateKey: string };

  constructor() {
    console.log('🔐 Organization Encryption Security Demo');
    console.log('========================================\n');
  }

  async runDemo(): Promise<void> {
    try {
      // Step 1: Setup encryption keys
      await this.step1_generateKeys();

      // Step 2: Simulate frontend encryption
      const frontendEncryptedData = await this.step2_frontendEncryption();

      // Step 3: Simulate server processing (beforeCreate hook)
      const processedData = await this.step3_serverProcessing(
        frontendEncryptedData,
      );

      // Step 4: Simulate database storage and retrieval
      const storedData = await this.step4_databaseStorage(processedData);

      // Step 5: Simulate WooCommerce service decryption
      await this.step5_woocommerceDecryption(storedData);

      // Step 6: Security validation
      await this.step6_securityValidation();

      console.log('\n✅ Demo completed successfully!');
      console.log('\n📝 Summary:');
      console.log('- Organization data was encrypted by frontend');
      console.log('- Server decrypted and re-encrypted for storage');
      console.log('- WooCommerce service successfully decrypted for API use');
      console.log('- Security measures validated (wrong keys rejected)');
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
      throw error;
    }
  }

  private async step1_generateKeys(): Promise<void> {
    console.log('📍 Step 1: Generating encryption keys...');

    const keyGenResult = generateEncryptionKeys();
    this.serverKeyPair = keyGenResult.serverKeyPair;
    this.clientKeyPair = keyGenResult.clientKeyPair;

    // Set environment variables for the demo
    process.env.SERVER_PUBLIC_KEY = this.serverKeyPair.publicKey;
    process.env.SERVER_PRIVATE_KEY = this.serverKeyPair.privateKey;

    console.log('   ✓ Server key pair generated');
    console.log('   ✓ Client key pair generated');
    console.log('   ✓ Environment variables set');
    console.log('');
  }

  private async step2_frontendEncryption(): Promise<any> {
    console.log('📍 Step 2: Frontend encrypting organization data...');

    const { organization } = DEMO_CONFIG;

    // Simulate frontend using server's public key to encrypt data
    const encryptedData = {
      name: organization.name, // Non-sensitive fields remain plain
      slug: organization.slug,
      consumerKey: AsymmetricEncryption.encryptData(
        organization.consumerKey,
        this.serverKeyPair.publicKey, // Frontend uses server's public key
      ),
      consumerSecret: AsymmetricEncryption.encryptData(
        organization.consumerSecret,
        this.serverKeyPair.publicKey,
      ),
      wooCommerceUrl: AsymmetricEncryption.encryptData(
        organization.wooCommerceUrl,
        this.serverKeyPair.publicKey,
      ),
    };

    console.log('   ✓ Consumer key encrypted');
    console.log('   ✓ Consumer secret encrypted');
    console.log('   ✓ WooCommerce URL encrypted');
    console.log(`   ✓ Ready to send to server`);
    console.log('');

    return encryptedData;
  }

  private async step3_serverProcessing(frontendData: any): Promise<any> {
    console.log('📍 Step 3: Server processing (beforeCreate hook)...');

    // Simulate the beforeCreate hook processing
    const processedData = OrganizationEncryptionManager.processOrganizationData(
      {
        consumerKey: frontendData.consumerKey,
        consumerSecret: frontendData.consumerSecret,
        wooCommerceUrl: frontendData.wooCommerceUrl,
      },
    );

    console.log('   ✓ Frontend encrypted data decrypted');
    console.log('   ✓ Data re-encrypted for secure storage');
    console.log('   ✓ Data ready for database storage');
    console.log('');

    return {
      ...frontendData,
      ...processedData,
    };
  }

  private async step4_databaseStorage(processedData: any): Promise<any> {
    console.log('📍 Step 4: Database storage simulation...');

    // Simulate storing in database and retrieving
    const databaseRecord = {
      id: 'org-demo-123',
      name: processedData.name,
      slug: processedData.slug,
      consumerKey: processedData.consumerKey,
      consumerSecret: processedData.consumerSecret,
      wooCommerceUrl: processedData.wooCommerceUrl,
      createdAt: new Date(),
    };

    console.log('   ✓ Organization record created in database');
    console.log(`   ✓ Organization ID: ${databaseRecord.id}`);
    console.log('   ✓ Sensitive data stored encrypted');

    // Simulate retrieving from database
    const retrievedData = {
      id: databaseRecord.id,
      wooCommerceUrl: databaseRecord.wooCommerceUrl,
      consumerKey: databaseRecord.consumerKey,
      consumerSecret: databaseRecord.consumerSecret,
    };

    console.log('   ✓ Data retrieved from database');
    console.log('');

    return retrievedData;
  }

  private async step5_woocommerceDecryption(storedData: any): Promise<void> {
    console.log('📍 Step 5: WooCommerce service decryption...');

    // Simulate WooCommerce service decrypting stored data
    const decryptedConfig =
      OrganizationEncryptionManager.decryptStoredOrganizationData({
        wooCommerceUrl: storedData.wooCommerceUrl,
        consumerKey: storedData.consumerKey,
        consumerSecret: storedData.consumerSecret,
      });

    console.log('   ✓ Encrypted data decrypted successfully');
    console.log('   ✓ Original data recovered:');
    console.log(`      - Consumer Key: ${decryptedConfig.consumerKey}`);
    console.log(`      - Consumer Secret: ${decryptedConfig.consumerSecret}`);

    // Verify the data matches original
    const original = DEMO_CONFIG.organization;
    const isValid =
      decryptedConfig.consumerKey === original.consumerKey &&
      decryptedConfig.consumerSecret === original.consumerSecret;

    if (isValid) {
      console.log('   ✅ Data integrity verified - matches original!');
    } else {
      throw new Error('Data integrity check failed!');
    }

    console.log('');
  }

  private async step6_securityValidation(): Promise<void> {
    console.log('📍 Step 6: Security validation...');

    const original = DEMO_CONFIG.organization;

    // Test 1: Wrong private key should fail
    console.log('   🔒 Test 1: Wrong private key rejection...');
    const wrongKeyPair = AsymmetricEncryption.generateKeyPair();
    const encrypted = AsymmetricEncryption.encryptData(
      original.consumerKey,
      this.serverKeyPair.publicKey,
    );

    try {
      AsymmetricEncryption.decryptData(encrypted, wrongKeyPair.privateKey);
      throw new Error('Should have failed with wrong key');
    } catch (error) {
      if (error.message.includes('Decryption failed')) {
        console.log('      ✓ Wrong private key correctly rejected');
      } else {
        throw error;
      }
    }

    // Test 2: Data tampering should fail
    console.log('   🔒 Test 2: Data tampering detection...');
    const tamperedEncrypted = {
      ...encrypted,
      encryptedData: encrypted.encryptedData.replace('a', 'b'), // Tamper with data
    };

    try {
      AsymmetricEncryption.decryptData(
        tamperedEncrypted,
        this.serverKeyPair.privateKey,
      );
      throw new Error('Should have failed with tampered data');
    } catch (error) {
      if (error.message.includes('Decryption failed')) {
        console.log('      ✓ Tampered data correctly rejected');
      } else {
        throw error;
      }
    }

    // Test 3: Environment key validation
    console.log('   🔒 Test 3: Environment key validation...');
    delete process.env.SERVER_PRIVATE_KEY;

    try {
      OrganizationEncryptionManager.processOrganizationData({
        consumerKey: 'test',
        consumerSecret: 'test',
        wooCommerceUrl: 'test',
      });
      throw new Error('Should have failed with missing keys');
    } catch (error) {
      if (error.message.includes('SERVER_PRIVATE_KEY is not configured')) {
        console.log('      ✓ Missing environment keys correctly detected');
      } else {
        throw error;
      }
    }

    // Restore key for cleanup
    process.env.SERVER_PRIVATE_KEY = this.serverKeyPair.privateKey;

    console.log('   ✅ All security validations passed');
    console.log('');
  }
}

// Performance testing
class PerformanceDemo {
  static async runPerformanceTests(): Promise<void> {
    console.log('🚀 Performance Tests');
    console.log('===================\n');

    const keyPair = AsymmetricEncryption.generateKeyPair();
    const testData = DEMO_CONFIG.organization;

    // Test encryption performance
    console.log('📊 Testing encryption performance...');
    const encryptStartTime = Date.now();

    for (let i = 0; i < 10; i++) {
      AsymmetricEncryption.encryptOrganizationData(
        testData.consumerKey,
        testData.consumerSecret,
        keyPair.publicKey,
      );
    }

    const encryptEndTime = Date.now();
    const encryptDuration = encryptEndTime - encryptStartTime;
    console.log(
      `   ✓ 10 encryptions completed in ${encryptDuration}ms (avg: ${encryptDuration / 10}ms)`,
    );

    // Test decryption performance
    console.log('📊 Testing decryption performance...');
    const encrypted = AsymmetricEncryption.encryptOrganizationData(
      testData.consumerKey,
      testData.consumerSecret,
      keyPair.publicKey,
    );

    const decryptStartTime = Date.now();

    for (let i = 0; i < 10; i++) {
      AsymmetricEncryption.decryptOrganizationData(
        encrypted.consumerKey,
        encrypted.consumerSecret,
        keyPair.privateKey,
      );
    }

    const decryptEndTime = Date.now();
    const decryptDuration = decryptEndTime - decryptStartTime;
    console.log(
      `   ✓ 10 decryptions completed in ${decryptDuration}ms (avg: ${decryptDuration / 10}ms)`,
    );

    console.log('');
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const demo = new OrganizationEncryptionDemo();
    await demo.runDemo();

    await PerformanceDemo.runPerformanceTests();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main();
}

export { OrganizationEncryptionDemo, PerformanceDemo };
