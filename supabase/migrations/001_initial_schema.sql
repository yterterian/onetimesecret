-- OneTimeSecret Database Schema for Supabase
-- Ultra-secure secret sharing with auto-expiration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Secrets table
CREATE TABLE secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL, -- URL-safe key for accessing the secret
  encrypted_content TEXT NOT NULL, -- AES-256 encrypted secret
  passphrase_hash TEXT, -- Optional passphrase hash (SHA-256)
  has_passphrase BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,

  -- Expiration settings
  max_views INTEGER DEFAULT 1,
  current_views INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- Tracking
  created_ip TEXT,
  viewed_ip TEXT,

  CONSTRAINT valid_max_views CHECK (max_views > 0 AND max_views <= 100),
  CONSTRAINT valid_views CHECK (current_views <= max_views)
);

-- Index for fast lookups
CREATE INDEX idx_secrets_key ON secrets(key);
CREATE INDEX idx_secrets_expires_at ON secrets(expires_at);
CREATE INDEX idx_secrets_created_by ON secrets(created_by);

-- Metadata table for tracking
CREATE TABLE secret_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secret_id UUID REFERENCES secrets(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state TEXT DEFAULT 'new', -- new, viewed, destroyed
  secret_key TEXT NOT NULL
);

CREATE INDEX idx_metadata_secret_id ON secret_metadata(secret_id);
CREATE INDEX idx_metadata_created_by ON secret_metadata(created_by);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  plan TEXT DEFAULT 'free', -- free, basic, professional

  -- Usage limits
  secrets_created INTEGER DEFAULT 0,
  secrets_viewed INTEGER DEFAULT 0,

  -- Settings
  default_ttl INTEGER DEFAULT 86400, -- 24 hours in seconds
  default_max_views INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP or user ID
  action TEXT NOT NULL, -- create_secret, view_secret, etc.
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Function to automatically delete expired secrets
CREATE OR REPLACE FUNCTION delete_expired_secrets()
RETURNS void AS $$
BEGIN
  DELETE FROM secrets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically delete expired rate limits
CREATE OR REPLACE FUNCTION delete_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Secrets: Anyone can insert (anonymous secret creation)
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create secrets"
  ON secrets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Secrets: Only accessible via service role (API routes handle access control)
CREATE POLICY "Service role can read all secrets"
  ON secrets FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update secrets"
  ON secrets FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete secrets"
  ON secrets FOR DELETE
  TO service_role
  USING (true);

-- Metadata: Users can view their own metadata
ALTER TABLE secret_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metadata"
  ON secret_metadata FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Service role can manage metadata"
  ON secret_metadata FOR ALL
  TO service_role
  USING (true);

-- Profiles: Users can view and update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Rate limits: Service role only
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  TO service_role
  USING (true);

-- Schedule cleanup jobs (run every hour)
-- Note: You'll need to set this up in Supabase dashboard or using pg_cron
-- SELECT cron.schedule('cleanup-expired-secrets', '0 * * * *', 'SELECT delete_expired_secrets()');
-- SELECT cron.schedule('cleanup-expired-rate-limits', '0 * * * *', 'SELECT delete_expired_rate_limits()');
