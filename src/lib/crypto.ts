import CryptoJS from 'crypto-js'
import { nanoid } from 'nanoid'

/**
 * Ultra-secure encryption utilities for OneTimeSecret
 * Uses AES-256 encryption with PBKDF2 key derivation
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

/**
 * Encrypt a secret using AES-256
 * @param plaintext The secret to encrypt
 * @param passphrase Optional user-provided passphrase for additional security
 * @returns Encrypted string
 */
export function encrypt(plaintext: string, passphrase?: string): string {
  const key = passphrase
    ? CryptoJS.PBKDF2(passphrase, ENCRYPTION_KEY, {
        keySize: 256 / 32,
        iterations: 10000,
      })
    : ENCRYPTION_KEY

  const encrypted = CryptoJS.AES.encrypt(plaintext, key.toString())
  return encrypted.toString()
}

/**
 * Decrypt a secret
 * @param ciphertext The encrypted secret
 * @param passphrase Optional user-provided passphrase
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string, passphrase?: string): string {
  try {
    const key = passphrase
      ? CryptoJS.PBKDF2(passphrase, ENCRYPTION_KEY, {
          keySize: 256 / 32,
          iterations: 10000,
        })
      : ENCRYPTION_KEY

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key.toString())
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    throw new Error('Failed to decrypt secret')
  }
}

/**
 * Generate a secure random key for the secret URL
 * Uses nanoid for cryptographically strong random IDs
 * @returns A unique, URL-safe identifier
 */
export function generateSecretKey(): string {
  return nanoid(21) // 21 chars = ~128 bits of entropy
}

/**
 * Hash a value using SHA-256 (one-way, for verification)
 * @param value The value to hash
 * @returns SHA-256 hash
 */
export function hash(value: string): string {
  return CryptoJS.SHA256(value).toString()
}

/**
 * Verify a passphrase against its hash
 * @param passphrase The passphrase to verify
 * @param hashedPassphrase The stored hash
 * @returns True if passphrase matches
 */
export function verifyPassphrase(
  passphrase: string,
  hashedPassphrase: string
): boolean {
  return hash(passphrase) === hashedPassphrase
}

/**
 * Generate a cryptographically secure random passphrase
 * @param length Length of the passphrase
 * @returns Random passphrase
 */
export function generatePassphrase(length: number = 16): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  return Array.from(values)
    .map((x) => charset[x % charset.length])
    .join('')
}
