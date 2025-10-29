/**
 * API request and response types
 */

export interface CreateSecretRequest {
  secret: string
  passphrase?: string
  ttl?: number // Time to live in seconds (default: 86400 = 24 hours)
  maxViews?: number // Maximum number of views (default: 1)
  recipientEmail?: string
}

export interface CreateSecretResponse {
  success: boolean
  key?: string
  url?: string
  expiresAt?: string
  error?: string
}

export interface ViewSecretRequest {
  key: string
  passphrase?: string
}

export interface ViewSecretResponse {
  success: boolean
  secret?: string
  expiresAt?: string
  viewsRemaining?: number
  error?: string
  needsPassphrase?: boolean
}

export interface SecretStatusResponse {
  exists: boolean
  needsPassphrase: boolean
  expiresAt?: string
  viewsRemaining?: number
}

export interface ApiError {
  error: string
  code?: string
}
