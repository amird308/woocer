#!/usr/bin/env npx tsx

/**
 * Standalone script to generate encryption keys for the organization security system.
 *
 * Usage:
 * npm run generate:keys
 * or
 * npx tsx scripts/generate-encryption-keys.ts
 */

import { runKeyGeneration } from '../common/utilities/key-generator.util.js';

console.log('🔐 Organization Encryption Key Generator');
console.log('=====================================\n');

try {
  runKeyGeneration();
} catch (error) {
  console.error('❌ Failed to generate encryption keys:', error);
  process.exit(1);
}
