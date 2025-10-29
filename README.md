# OneTimeSecret - Vercel Edition

A secure, modern secret sharing application built with Next.js 14, TypeScript, and Supabase. Deploy to Vercel in minutes.

## What is OneTimeSecret?

A one-time secret is a link that can be viewed only once. A single-use URL.

When you send people sensitive info like passwords and private links via email or chat, there are copies of that information stored in many places. If you use a one-time link instead, the information persists for a single viewing which means it can't be read by someone else later. This allows you to send sensitive information in a safe way knowing it's seen by one person only. Think of it like a self-destructing message.

## Features

- 🔒 **End-to-End Encryption**: AES-256 encryption with PBKDF2 key derivation
- ⏱️ **Auto-Expiring Secrets**: Secrets automatically delete after viewing or time expiration
- 🛡️ **Zero-Knowledge Architecture**: Encrypted before storage, we can't see your secrets
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 🚀 **Serverless**: Runs on Vercel with edge functions
- 📊 **Rate Limiting**: Protection against abuse
- 🔐 **Passphrase Protection**: Optional additional security layer
- 📱 **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Security**: crypto-js, zod validation

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/onetimesecret.git
cd onetimesecret
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security (RLS) policies
4. Get your API keys from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your_32_byte_encryption_key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/onetimesecret)

### Manual Deploy

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from `.env.example`
   - Redeploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Reference

### Create Secret

```bash
POST /api/secrets/create

{
  "secret": "your secret message",
  "passphrase": "optional passphrase",
  "ttl": 86400,  // seconds (default: 24 hours)
  "maxViews": 1  // default: 1
}
```

### View Secret

```bash
GET /api/secrets/{key}  // Get status

POST /api/secrets/{key}  // Reveal secret
{
  "passphrase": "if required"
}
```

## Security Features

### Encryption
- AES-256 encryption
- PBKDF2 key derivation (10,000 iterations)
- Unique keys per secret using nanoid (128-bit entropy)

### Rate Limiting
- 10 requests per 15 minutes for secret creation
- 50 requests per 15 minutes for viewing

### Security Headers
- HSTS
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Row Level Security
- Service role required for secret access
- Users can only view their own metadata
- Passphrase verification in API layer

## Migration from Ruby

This is a complete rewrite of the original Ruby OneTimeSecret application. Key differences:

- **Ruby → TypeScript**: Full type safety
- **Rack → Next.js**: Modern serverless architecture
- **Redis → PostgreSQL**: Simplified with Supabase
- **Thin → Vercel**: Cloud-native, globally distributed
- **Mustache → React**: Component-based UI

The original Ruby implementation is preserved in `README-RUBY.md` for reference.

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Support

- 📧 Email: support@onetimesecret.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/onetimesecret/issues)

---

Built with ❤️ using Next.js, TypeScript, and Supabase
