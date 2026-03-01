import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derive a 32-byte encryption key from JWT_SECRET (or a dedicated ENCRYPTION_KEY).
 * In production, use a separate ENCRYPTION_KEY env var.
 */
const getKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'sentinel_dev_secret_2024';
  return crypto.createHash('sha256').update(secret).digest();
};

/** Encrypt a plaintext string → returns "iv:tag:ciphertext" (hex encoded) */
export const encrypt = (plaintext: string): string => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/** Decrypt an "iv:tag:ciphertext" string → returns plaintext */
export const decrypt = (encrypted: string): string => {
  const key = getKey();
  const parts = encrypted.split(':');

  // If it doesn't look encrypted (no colons), return as-is (legacy plaintext)
  if (parts.length !== 3) return encrypted;

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/** Check if a string looks like it's already encrypted (iv:tag:ciphertext format) */
export const isEncrypted = (value: string): boolean => {
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
};
