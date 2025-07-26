import * as crypto from 'node:crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  encryptedData: string;
  encryptedSymmetricKey: string;
}

export class AsymmetricEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly RSA_ALGORITHM = 'rsa';
  private static readonly KEY_SIZE = 2048;

  /**
   * Generate RSA key pair for asymmetric encryption
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync(
      this.RSA_ALGORITHM,
      {
        modulusLength: this.KEY_SIZE,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
    );

    return { publicKey, privateKey };
  }

  /**
   * Encrypt sensitive organization data using hybrid encryption
   * @param data - The data to encrypt
   * @param publicKey - RSA public key for encryption
   */
  static encryptData(data: string, publicKey: string): EncryptedData {
    try {
      // Validate inputs
      if (!data || typeof data !== 'string') {
        throw new Error('Data to encrypt must be a non-empty string');
      }

      if (!publicKey || typeof publicKey !== 'string') {
        throw new Error('Public key must be a non-empty string');
      }

      // Generate a random symmetric key for AES encryption
      const symmetricKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);

      // Encrypt the data with AES-GCM
      const cipher = crypto.createCipheriv(this.ALGORITHM, symmetricKey, iv);
      cipher.setAAD(Buffer.from('organization-data'));

      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      const authTag = cipher.getAuthTag();
      const encryptedDataWithIvAndTag =
        iv.toString('hex') +
        ':' +
        authTag.toString('hex') +
        ':' +
        encryptedData;

      // Encrypt the symmetric key with RSA public key
      const encryptedSymmetricKey = crypto
        .publicEncrypt(
          {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          symmetricKey,
        )
        .toString('base64');

      return {
        encryptedData: encryptedDataWithIvAndTag,
        encryptedSymmetricKey,
      };
    } catch (error) {
      // Provide more context for debugging
      if (error.code === 'ERR_OSSL_UNSUPPORTED') {
        throw new Error(
          `Public key format is invalid or unsupported. Please ensure the RSA public key is in valid PEM format. Original error: ${error.message}`,
        );
      }

      if (error.code === 'ERR_OSSL_RSA_PADDING_CHECK_FAILED') {
        throw new Error(
          `RSA encryption failed due to padding issues. This usually indicates a corrupted or invalid public key. Original error: ${error.message}`,
        );
      }

      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt organization data using hybrid decryption
   * @param encryptedData - The encrypted data object
   * @param privateKey - RSA private key for decryption
   */
  static decryptData(encryptedData: EncryptedData, privateKey: string): string {
    try {
      // Decrypt the symmetric key with RSA private key
      const symmetricKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encryptedData.encryptedSymmetricKey, 'base64'),
      );

      // Parse the encrypted data (format: iv:authTag:encryptedData)
      const parts = encryptedData.encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Decrypt the data with AES-GCM
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        symmetricKey,
        iv,
      );
      decipher.setAAD(Buffer.from('organization-data'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive organization fields
   */
  static encryptOrganizationData(
    consumerKey: string,
    consumerSecret: string,
    publicKey: string,
  ): {
    consumerKey: EncryptedData;
    consumerSecret: EncryptedData;
  } {
    return {
      consumerKey: this.encryptData(consumerKey, publicKey),
      consumerSecret: this.encryptData(consumerSecret, publicKey),
    };
  }

  /**
   * Decrypt sensitive organization fields
   */
  static decryptOrganizationData(
    encryptedConsumerKey: EncryptedData,
    encryptedConsumerSecret: EncryptedData,
    privateKey: string,
  ): {
    consumerKey: string;
    consumerSecret: string;
  } {
    return {
      consumerKey: this.decryptData(encryptedConsumerKey, privateKey),
      consumerSecret: this.decryptData(encryptedConsumerSecret, privateKey),
    };
  }
}

export class OrganizationEncryptionManager {
  /**
   * Get server keys dynamically from environment variables
   */
  private static getServerKeys(): { privateKey: string; publicKey: string } {
    const rawPrivateKey = process.env.SERVER_PRIVATE_KEY;
    const rawPublicKey = process.env.SERVER_PUBLIC_KEY;

    if (!rawPrivateKey || rawPrivateKey.length === 0) {
      throw new Error(
        'SERVER_PRIVATE_KEY is not configured or is empty. Please check your .env file.',
      );
    }

    if (!rawPublicKey || rawPublicKey.length === 0) {
      throw new Error(
        'SERVER_PUBLIC_KEY is not configured or is empty. Please check your .env file.',
      );
    }

    // Convert escaped newlines back to actual newlines for PEM format
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    const publicKey = rawPublicKey.replace(/\\n/g, '\n');

    // Validate PEM format
    const isValidPemFormat = (key: string): boolean => {
      return key.includes('-----BEGIN') && key.includes('-----END');
    };

    if (!isValidPemFormat(privateKey)) {
      throw new Error(
        'SERVER_PRIVATE_KEY does not appear to be in valid PEM format. Please check your .env file.',
      );
    }

    if (!isValidPemFormat(publicKey)) {
      throw new Error(
        'SERVER_PUBLIC_KEY does not appear to be in valid PEM format. Please check your .env file.',
      );
    }

    return { privateKey, publicKey };
  }

  /**
   * Decrypt data received from client and re-encrypt for server storage
   */
  static processOrganizationData(encryptedData: any): any {
    const { privateKey, publicKey } = this.getServerKeys();

    try {
      // Decrypt data that was encrypted with client's intention
      const decryptedData = {
        consumerKey:
          typeof encryptedData.consumerKey === 'string'
            ? encryptedData.consumerKey
            : AsymmetricEncryption.decryptData(
                encryptedData.consumerKey,
                privateKey,
              ),
        consumerSecret:
          typeof encryptedData.consumerSecret === 'string'
            ? encryptedData.consumerSecret
            : AsymmetricEncryption.decryptData(
                encryptedData.consumerSecret,
                privateKey,
              ),
      };
      // Re-encrypt for secure server storage
      const reEncryptedData = AsymmetricEncryption.encryptOrganizationData(
        decryptedData.consumerKey,
        decryptedData.consumerSecret,
        publicKey,
      );

      return {
        ...encryptedData,
        consumerKey: JSON.stringify(reEncryptedData.consumerKey),
        consumerSecret: JSON.stringify(reEncryptedData.consumerSecret),
      };
    } catch (error) {
      console.error('Failed to process organization encryption:', error);
      throw new Error('Failed to process encrypted organization data');
    }
  }

  /**
   * Decrypt organization data for use in application
   */
  static decryptStoredOrganizationData(storedData: any): {
    consumerKey: string;
    consumerSecret: string;
  } {
    const { privateKey } = this.getServerKeys();

    try {
      const consumerKey = JSON.parse(storedData.consumerKey);
      const consumerSecret = JSON.parse(storedData.consumerSecret);

      // Validate that the parsed data has the expected structure
      const isValidEncryptedData = (data: any): data is EncryptedData => {
        return (
          data &&
          typeof data === 'object' &&
          typeof data.encryptedData === 'string' &&
          typeof data.encryptedSymmetricKey === 'string'
        );
      };

      if (
        !isValidEncryptedData(consumerKey) ||
        !isValidEncryptedData(consumerSecret)
      ) {
        throw new Error('Invalid encrypted data structure');
      }

      return AsymmetricEncryption.decryptOrganizationData(
        consumerKey,
        consumerSecret,
        privateKey,
      );
    } catch (error) {
      console.error('Failed to decrypt stored organization data:', error);
      throw new Error('Failed to decrypt organization data');
    }
  }
}
