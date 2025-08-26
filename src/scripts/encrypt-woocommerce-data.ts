#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
import { AsymmetricEncryption } from '../common/utilities/encryption.util';

// Load environment variables from .env file
dotenv.config();

interface WooCommerceCredentials {
  consumerKey: string;
  consumerSecret: string;
  serverPublicKey: string;
}

interface EncryptedWooCommerceData {
  consumerKey: {
    encryptedData: string;
    encryptedSymmetricKey: string;
  };
  consumerSecret: {
    encryptedData: string;
    encryptedSymmetricKey: string;
  };
}

/**
 * Format public key for use with crypto operations
 * Converts escaped newlines (\\n) to actual newlines
 * @param publicKey - The public key string to format
 * @returns Properly formatted public key
 */
function formatPublicKey(publicKey: string): string {
  // Convert escaped newlines to actual newlines
  const formattedKey = publicKey.replace(/\\n/g, '\n');

  // Ensure proper PEM format
  if (!formattedKey.startsWith('-----BEGIN PUBLIC KEY-----')) {
    throw new Error('Public key must start with "-----BEGIN PUBLIC KEY-----"');
  }

  if (!formattedKey.endsWith('-----END PUBLIC KEY-----')) {
    throw new Error('Public key must end with "-----END PUBLIC KEY-----"');
  }

  return formattedKey;
}

/**
 * Encrypt WooCommerce credentials using the server's public key
 * @param credentials - The WooCommerce credentials to encrypt
 * @returns The encrypted data
 */
function encryptWooCommerceData(
  credentials: WooCommerceCredentials,
): EncryptedWooCommerceData {
  try {
    console.log('🔐 Encrypting WooCommerce credentials...');

    // Format the public key properly
    const formattedPublicKey = formatPublicKey(credentials.serverPublicKey);

    const encryptedData = AsymmetricEncryption.encryptOrganizationData(
      credentials.consumerKey,
      credentials.consumerSecret,
      formattedPublicKey,
    );

    console.log('✅ Encryption completed successfully!');
    return encryptedData;
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    throw error;
  }
}

/**
 * Get credentials from environment variables
 */
function getCredentialsFromEnv(): WooCommerceCredentials {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const serverPublicKey = process.env.SERVER_PUBLIC_KEY;
  console.log('consumerKey', consumerKey);
  console.log('consumerSecret', consumerSecret);
  console.log('serverPublicKey', serverPublicKey);
  if (!consumerKey || !consumerSecret || !serverPublicKey) {
    throw new Error(
      'Missing required environment variables: CONSUMER_KEY, CONSUMER_SECRET, SERVER_PUBLIC_KEY',
    );
  }

  return {
    consumerKey,
    consumerSecret,
    serverPublicKey,
  };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 WooCommerce Data Encryption Script');
    console.log('=====================================');

    const credentials = getCredentialsFromEnv();

    // Validate and preview public key format
    try {
      const formattedKey = formatPublicKey(credentials.serverPublicKey);
      console.log('✅ Public key format validated');
      console.log('🔍 Public key preview:');
      const lines = formattedKey.split('\n');
      console.log(`   ${lines[0]}`);
      console.log(`   ${lines[1]?.substring(0, 20)}...`);
      console.log(`   ${lines[lines.length - 1]}`);
    } catch (error) {
      throw new Error(`Invalid public key: ${error.message}`);
    }

    // Encrypt the data
    const encryptedData = encryptWooCommerceData(credentials);

    // Output the results
    console.log('');
    console.log('📦 Encrypted Data:');
    console.log('==================');
    console.log(JSON.stringify(encryptedData, null, 2));

    // Also output in a format ready for database storage
    console.log('');
    console.log('💾 Database Storage Format:');
    console.log('============================');
    console.log('consumerKey:', JSON.stringify(encryptedData.consumerKey));
    console.log(
      'consumerSecret:',
      JSON.stringify(encryptedData.consumerSecret),
    );

    console.log('');
    console.log('✨ Encryption completed successfully!');
    console.log('🔒 Your WooCommerce credentials are now securely encrypted');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.log('');
    console.log('💡 Common issues and solutions:');
    console.log('- Ensure your public key is in proper PEM format');
    console.log('- Check that newlines in the key are properly formatted');
    console.log(
      '- Verify that the key starts with "-----BEGIN PUBLIC KEY-----"',
    );
    console.log(
      '- Make sure all required arguments/environment variables are provided',
    );
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

// Export for use as a module
export {
  encryptWooCommerceData,
  EncryptedWooCommerceData,
  WooCommerceCredentials,
  formatPublicKey,
};
