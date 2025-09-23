// LS-108: Encryption module for securing sensitive data at rest
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * In production, this should be a securely managed key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // For development, generate a consistent key from session secret
    const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-key';
    return crypto.createHash('sha256').update(sessionSecret).digest();
  }
  
  // Decode base64 key or hash if it's not the right length
  try {
    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length === KEY_LENGTH) {
      return keyBuffer;
    }
  } catch (e) {
    // Fall through to hash the key
  }
  
  // Hash the key to ensure it's the right length
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt data using AES-256-GCM with proper authentication
 * Returns base64 encoded JSON with iv, tag, and ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    // Store format with versioning for future upgrades
    const result = {
      v: 1,
      alg: 'AES-256-GCM',
      iv: iv.toString('base64'),
      ct: encrypted,
      tag: tag.toString('base64')
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fail closed - throw error instead of returning plaintext
    throw new Error('Encryption failed - cannot store sensitive data unencrypted');
  }
}

/**
 * Decrypt data using AES-256-GCM with authentication verification
 * Expects base64 encoded JSON with v, alg, iv, ct, and tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    const key = getEncryptionKey();
    const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    
    // Check if it's our encrypted format
    if (!parsed.v || !parsed.alg || !parsed.iv || !parsed.ct || !parsed.tag) {
      // Not our encrypted format - might be legacy plaintext
      // For backwards compatibility during migration
      return encryptedData;
    }
    
    // Verify algorithm
    if (parsed.alg !== 'AES-256-GCM') {
      throw new Error(`Unsupported encryption algorithm: ${parsed.alg}`);
    }
    
    const iv = Buffer.from(parsed.iv, 'base64');
    const tag = Buffer.from(parsed.tag, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(parsed.ct, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fail closed for corrupted encrypted data
    throw new Error('Decryption failed - data may be corrupted');
  }
}

/**
 * LS-108: Safe backward-compatible decryption for audit logs
 * Only decrypts if data matches encrypted envelope format
 */
export function decryptOptional(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  try {
    // Quick check if it looks like our encrypted format
    const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    
    // Only attempt decryption if it has our envelope format
    if (parsed.v && parsed.alg && parsed.iv && parsed.ct && parsed.tag) {
      return decrypt(encryptedData);
    } else {
      // Legacy plaintext - return as-is
      return encryptedData;
    }
  } catch (error) {
    // Not base64 or not JSON - likely legacy plaintext
    return encryptedData;
  }
}

/**
 * Encrypt sensitive fields in an object
 */
export function encryptSensitiveFields(obj: any, fields: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypt sensitive fields in an object with backward compatibility
 */
export function decryptSensitiveFields(obj: any, fields: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        // LS-108: Use safe optional decryption for backward compatibility
        result[field] = decryptOptional(result[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep original value if decryption fails
        result[field] = obj[field];
      }
    }
  }
  return result;
}

/**
 * Session encryption wrapper for express-session store
 * LS-108: Fail-closed - never return plaintext on failure
 */
export function encryptSessionData(sessionData: any): string {
  try {
    const jsonData = JSON.stringify(sessionData);
    return encrypt(jsonData);
  } catch (error) {
    console.error('Session encryption failed:', error);
    // LS-108: Fail closed - throw error, never store plaintext
    throw new Error('Session data encryption failed - cannot store unencrypted session data');
  }
}

/**
 * Session decryption wrapper for express-session store
 * LS-108: Fail-closed - never return plaintext on failure for encrypted sessions
 */
export function decryptSessionData(encryptedData: string): any {
  try {
    const decryptedJson = decrypt(encryptedData);
    return JSON.parse(decryptedJson);
  } catch (error) {
    console.error('Session decryption failed:', error);
    // LS-108: Fail closed for corrupted encrypted data
    throw new Error('Session data decryption failed - session may be corrupted');
  }
}

export default {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptSessionData,
  decryptSessionData
};