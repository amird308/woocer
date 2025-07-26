import {
  generateEncryptionKeys,
  runKeyGeneration,
  EncryptionKeyGenerator,
} from './key-generator.util';
import * as crypto from 'node:crypto';

describe('Key Generator Utilities', () => {
  describe('generateEncryptionKeys', () => {
    it('should generate server and client key pairs', () => {
      const result = generateEncryptionKeys();

      expect(result).toHaveProperty('serverKeyPair');
      expect(result).toHaveProperty('clientKeyPair');
      expect(result).toHaveProperty('envVariables');

      // Verify server key pair structure
      expect(result.serverKeyPair).toHaveProperty('publicKey');
      expect(result.serverKeyPair).toHaveProperty('privateKey');
      expect(result.serverKeyPair.publicKey).toContain(
        '-----BEGIN PUBLIC KEY-----',
      );
      expect(result.serverKeyPair.publicKey).toContain(
        '-----END PUBLIC KEY-----',
      );
      expect(result.serverKeyPair.privateKey).toContain(
        '-----BEGIN PRIVATE KEY-----',
      );
      expect(result.serverKeyPair.privateKey).toContain(
        '-----END PRIVATE KEY-----',
      );

      // Verify client key pair structure
      expect(result.clientKeyPair).toHaveProperty('publicKey');
      expect(result.clientKeyPair).toHaveProperty('privateKey');
      expect(result.clientKeyPair.publicKey).toContain(
        '-----BEGIN PUBLIC KEY-----',
      );
      expect(result.clientKeyPair.publicKey).toContain(
        '-----END PUBLIC KEY-----',
      );
      expect(result.clientKeyPair.privateKey).toContain(
        '-----BEGIN PRIVATE KEY-----',
      );
      expect(result.clientKeyPair.privateKey).toContain(
        '-----END PRIVATE KEY-----',
      );
    });

    it('should generate different key pairs each time', () => {
      const result1 = generateEncryptionKeys();
      const result2 = generateEncryptionKeys();

      expect(result1.serverKeyPair.publicKey).not.toBe(
        result2.serverKeyPair.publicKey,
      );
      expect(result1.serverKeyPair.privateKey).not.toBe(
        result2.serverKeyPair.privateKey,
      );
      expect(result1.clientKeyPair.publicKey).not.toBe(
        result2.clientKeyPair.publicKey,
      );
      expect(result1.clientKeyPair.privateKey).not.toBe(
        result2.clientKeyPair.privateKey,
      );
    });

    it('should generate proper environment variables string', () => {
      const result = generateEncryptionKeys();

      expect(result.envVariables).toContain('SERVER_PUBLIC_KEY=');
      expect(result.envVariables).toContain('SERVER_PRIVATE_KEY=');
      expect(result.envVariables).toContain('NEXT_PUBLIC_SERVER_PUBLIC_KEY=');
      expect(result.envVariables).toContain('# CLIENT_PUBLIC_KEY=');
      expect(result.envVariables).toContain('# CLIENT_PRIVATE_KEY=');

      // Verify keys are properly escaped for environment variables
      expect(result.envVariables).toContain('\\n');
      expect(result.envVariables).not.toContain('\n-----BEGIN');
    });

    it('should include proper comments and documentation in env variables', () => {
      const result = generateEncryptionKeys();

      expect(result.envVariables).toContain(
        '# Encryption Keys for Organization Security System',
      );
      expect(result.envVariables).toContain(
        '# Server keys (used for server-side encryption/decryption)',
      );
      expect(result.envVariables).toContain(
        "# Frontend needs the server's public key",
      );
      expect(result.envVariables).toContain(
        '# Optional: Client keys for future bidirectional encryption',
      );
    });

    it('should ensure server public key appears twice (SERVER_PUBLIC_KEY and NEXT_PUBLIC_SERVER_PUBLIC_KEY)', () => {
      const result = generateEncryptionKeys();

      const serverPublicKeyEscaped = result.serverKeyPair.publicKey.replace(
        /\n/g,
        '\\n',
      );

      expect(result.envVariables).toContain(
        `SERVER_PUBLIC_KEY="${serverPublicKeyEscaped}"`,
      );
      expect(result.envVariables).toContain(
        `NEXT_PUBLIC_SERVER_PUBLIC_KEY="${serverPublicKeyEscaped}"`,
      );
    });
  });

  describe('runKeyGeneration', () => {
    it('should execute without throwing errors', () => {
      // Mock console methods to avoid cluttering test output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => {
        runKeyGeneration();
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log appropriate messages during key generation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runKeyGeneration();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔐 ENCRYPTION KEYS GENERATED SUCCESSFULLY\n',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Copy the following environment variables to your .env file:\n',
      );
      expect(consoleSpy).toHaveBeenCalledWith('\n⚠️  SECURITY NOTES:');
      expect(consoleSpy).toHaveBeenCalledWith(
        '- Keep all private keys secure and never commit them to version control',
      );

      consoleSpy.mockRestore();
    });

    it('should output valid environment variables', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      runKeyGeneration();

      // Find the call that contains the environment variables
      const envVarCall = consoleSpy.mock.calls.find(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('SERVER_PUBLIC_KEY='),
      );

      expect(envVarCall).toBeDefined();

      const envVarString = envVarCall![0];
      expect(envVarString).toContain(
        'SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----',
      );
      expect(envVarString).toContain(
        'SERVER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('EncryptionKeyGenerator', () => {
    describe('generateKeyPair', () => {
      it('should be an alias for AsymmetricEncryption.generateKeyPair', () => {
        const keyPair = EncryptionKeyGenerator.generateKeyPair();

        expect(keyPair).toHaveProperty('publicKey');
        expect(keyPair).toHaveProperty('privateKey');
        expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
        expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
      });
    });

    describe('generateServerKeys', () => {
      it('should generate a new key pair', () => {
        const serverKeys = EncryptionKeyGenerator.generateServerKeys();

        expect(serverKeys).toHaveProperty('publicKey');
        expect(serverKeys).toHaveProperty('privateKey');
        expect(serverKeys.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
        expect(serverKeys.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
      });
    });

    describe('generateClientKeys', () => {
      it('should generate a new key pair', () => {
        const clientKeys = EncryptionKeyGenerator.generateClientKeys();

        expect(clientKeys).toHaveProperty('publicKey');
        expect(clientKeys).toHaveProperty('privateKey');
        expect(clientKeys.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
        expect(clientKeys.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
      });
    });

    describe('formatKeyForEnv', () => {
      it('should replace newlines with \\n for environment variables', () => {
        const keyWithNewlines = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`;

        const formatted =
          EncryptionKeyGenerator.formatKeyForEnv(keyWithNewlines);

        expect(formatted).not.toContain('\n');
        expect(formatted).toContain('\\n');
        expect(formatted).toBe(
          '-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\\n-----END PUBLIC KEY-----',
        );
      });

      it('should handle keys that already have escaped newlines', () => {
        const alreadyFormatted = 'key\\nwith\\nescaped\\nnewlines';
        const result = EncryptionKeyGenerator.formatKeyForEnv(alreadyFormatted);

        expect(result).toBe(alreadyFormatted);
      });

      it('should handle empty strings', () => {
        const result = EncryptionKeyGenerator.formatKeyForEnv('');
        expect(result).toBe('');
      });
    });

    describe('parseKeyFromEnv', () => {
      it('should replace \\n with actual newlines', () => {
        const envKey = 'line1\\nline2\\nline3';
        const parsed = EncryptionKeyGenerator.parseKeyFromEnv(envKey);

        expect(parsed).toContain('\n');
        expect(parsed).not.toContain('\\n');
        expect(parsed).toBe('line1\nline2\nline3');
      });

      it('should handle keys with actual newlines unchanged', () => {
        const keyWithNewlines = 'line1\nline2\nline3';
        const result = EncryptionKeyGenerator.parseKeyFromEnv(keyWithNewlines);

        expect(result).toBe(keyWithNewlines);
      });

      it('should handle empty strings', () => {
        const result = EncryptionKeyGenerator.parseKeyFromEnv('');
        expect(result).toBe('');
      });

      it('should be inverse of formatKeyForEnv', () => {
        const originalKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`;

        const formatted = EncryptionKeyGenerator.formatKeyForEnv(originalKey);
        const parsed = EncryptionKeyGenerator.parseKeyFromEnv(formatted);

        expect(parsed).toBe(originalKey);
      });
    });
  });

  describe('Key Quality and Security', () => {
    it('should generate keys with sufficient length and complexity', () => {
      const keyPair = EncryptionKeyGenerator.generateKeyPair();

      // RSA 2048-bit keys should have minimum base64 content length
      const publicKeyContent = keyPair.publicKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\s/g, '');

      const privateKeyContent = keyPair.privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');

      // RSA 2048-bit public key should be around 294 characters in base64
      expect(publicKeyContent.length).toBeGreaterThan(200);
      // RSA 2048-bit private key should be around 1600+ characters in base64
      expect(privateKeyContent.length).toBeGreaterThan(1000);
    });

    it('should generate cryptographically unique keys', () => {
      const keyPairs = Array.from({ length: 5 }, () =>
        EncryptionKeyGenerator.generateKeyPair(),
      );

      // All public keys should be unique
      const publicKeys = keyPairs.map((kp) => kp.publicKey);
      const uniquePublicKeys = new Set(publicKeys);
      expect(uniquePublicKeys.size).toBe(5);

      // All private keys should be unique
      const privateKeys = keyPairs.map((kp) => kp.privateKey);
      const uniquePrivateKeys = new Set(privateKeys);
      expect(uniquePrivateKeys.size).toBe(5);
    });

    it('should generate keys that work together for encryption/decryption', () => {
      const keyPair = EncryptionKeyGenerator.generateKeyPair();
      const testData = 'test-encryption-data-123';

      // Encrypt with public key
      const encrypted = crypto.publicEncrypt(
        {
          key: keyPair.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(testData),
      );

      // Decrypt with private key
      const decrypted = crypto.privateDecrypt(
        {
          key: keyPair.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encrypted,
      );

      expect(decrypted.toString()).toBe(testData);
    });
  });

  describe('Performance', () => {
    it('should generate keys within reasonable time', () => {
      const startTime = Date.now();
      const keyPair = EncryptionKeyGenerator.generateKeyPair();
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(keyPair).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should generate multiple key pairs efficiently', () => {
      const startTime = Date.now();

      const keyPairs = Array.from({ length: 3 }, () =>
        EncryptionKeyGenerator.generateKeyPair(),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(keyPairs).toHaveLength(3);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
