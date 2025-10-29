/**
 * TypeScript types for the Supabase database schema
 */

export interface Database {
  public: {
    Tables: {
      secrets: {
        Row: Secret
        Insert: SecretInsert
        Update: SecretUpdate
      }
      secret_metadata: {
        Row: SecretMetadata
        Insert: SecretMetadataInsert
        Update: SecretMetadataUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      rate_limits: {
        Row: RateLimit
        Insert: RateLimitInsert
        Update: RateLimitUpdate
      }
    }
  }
}

export interface Secret {
  id: string
  key: string
  encrypted_content: string
  passphrase_hash: string | null
  has_passphrase: boolean
  created_by: string | null
  recipient_email: string | null
  max_views: number
  current_views: number
  expires_at: string
  created_at: string
  viewed_at: string | null
  created_ip: string | null
  viewed_ip: string | null
}

export interface SecretInsert {
  key: string
  encrypted_content: string
  passphrase_hash?: string | null
  has_passphrase?: boolean
  created_by?: string | null
  recipient_email?: string | null
  max_views?: number
  expires_at: string
  created_ip?: string | null
}

export interface SecretUpdate {
  current_views?: number
  viewed_at?: string
  viewed_ip?: string
}

export interface SecretMetadata {
  id: string
  secret_id: string
  created_by: string | null
  created_at: string
  state: 'new' | 'viewed' | 'destroyed'
  secret_key: string
}

export interface SecretMetadataInsert {
  secret_id: string
  created_by?: string | null
  state?: 'new' | 'viewed' | 'destroyed'
  secret_key: string
}

export interface SecretMetadataUpdate {
  state?: 'new' | 'viewed' | 'destroyed'
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  plan: 'free' | 'basic' | 'professional'
  secrets_created: number
  secrets_viewed: number
  default_ttl: number
  default_max_views: number
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  email?: string | null
  full_name?: string | null
  plan?: 'free' | 'basic' | 'professional'
}

export interface ProfileUpdate {
  email?: string | null
  full_name?: string | null
  plan?: 'free' | 'basic' | 'professional'
  secrets_created?: number
  secrets_viewed?: number
  default_ttl?: number
  default_max_views?: number
  updated_at?: string
}

export interface RateLimit {
  id: string
  identifier: string
  action: string
  count: number
  window_start: string
  expires_at: string
}

export interface RateLimitInsert {
  identifier: string
  action: string
  count?: number
  expires_at: string
}

export interface RateLimitUpdate {
  count?: number
}
