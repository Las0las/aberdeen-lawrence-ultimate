import { createHmac, randomBytes } from 'crypto';

/**
 * Generate HMAC signature for tamper detection
 */
export function generateSignature(data: string, secret?: string): string {
  const key = secret || process.env.AUDIT_SECRET || 'default-secret-key';
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifySignature(data: string, signature: string, secret?: string): boolean {
  const expected = generateSignature(data, secret);
  return signature === expected;
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}
