import { AsymmetricEncryption } from './encryption.util';

/**
 * Utility to generate RSA key pairs for the encryption system.
 * Run this script to generate the required environment variables.
 */
export function generateEncryptionKeys(): {
  serverKeyPair: { publicKey: string; privateKey: string };
  clientKeyPair: { publicKey: string; privateKey: string };
  envVariables: string;
} {
  console.log('Generating RSA key pairs for encryption system...\n');

  // Generate server key pair
  const serverKeyPair = AsymmetricEncryption.generateKeyPair();
  console.log('✅ Server key pair generated');

  // Generate client key pair
  const clientKeyPair = AsymmetricEncryption.generateKeyPair();
  console.log('✅ Client key pair generated\n');

  // Format environment variables
  const envVariables = `# Encryption Keys for Organization Security System
# Add these to your .env file

# Server keys (used for server-side encryption/decryption)
SERVER_PUBLIC_KEY="${serverKeyPair.publicKey.replace(/\n/g, '\\n')}"
SERVER_PRIVATE_KEY="${serverKeyPair.privateKey.replace(/\n/g, '\\n')}"

# Frontend needs the server's public key to encrypt data before sending
# Share this with your frontend application:
NEXT_PUBLIC_SERVER_PUBLIC_KEY="${serverKeyPair.publicKey.replace(/\n/g, '\\n')}"

# Optional: Client keys for future bidirectional encryption (server -> client)
# Uncomment if you need server to encrypt responses back to client:
# CLIENT_PUBLIC_KEY="${clientKeyPair.publicKey.replace(/\n/g, '\\n')}"
# CLIENT_PRIVATE_KEY="${clientKeyPair.privateKey.replace(/\n/g, '\\n')}"
`;

  return {
    serverKeyPair,
    clientKeyPair,
    envVariables,
  };
}

/**
 * Main execution function for standalone script usage
 */
export function runKeyGeneration(): void {
  const result = generateEncryptionKeys();

  console.log('🔐 ENCRYPTION KEYS GENERATED SUCCESSFULLY\n');
  console.log(
    '📋 Copy the following environment variables to your .env file:\n',
  );
  console.log(result.envVariables);
  console.log('\n⚠️  SECURITY NOTES:');
  console.log(
    '- Keep all private keys secure and never commit them to version control',
  );
  console.log(
    '- The SERVER_PRIVATE_KEY is used to decrypt organization data on the server',
  );
  console.log(
    '- The CLIENT_PUBLIC_KEY should be shared with your frontend application',
  );
  console.log(
    '- Store the client private key securely in your frontend environment',
  );
}

// Export individual key generation functions for flexibility
export const EncryptionKeyGenerator = {
  generateKeyPair: AsymmetricEncryption.generateKeyPair,
  generateServerKeys: () => AsymmetricEncryption.generateKeyPair(),
  generateClientKeys: () => AsymmetricEncryption.generateKeyPair(),
  formatKeyForEnv: (key: string) => key.replace(/\n/g, '\\n'),
  parseKeyFromEnv: (key: string) => key.replace(/\\n/g, '\n'),
};

// If this file is run directly, execute key generation
if (require.main === module) {
  runKeyGeneration();
}
