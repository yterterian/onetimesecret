# Deployment Guide - OneTimeSecret on Vercel

Complete guide to deploy OneTimeSecret to Vercel with Supabase.

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Supabase account (free tier works)
- [ ] Node.js 18+ installed locally

## Step-by-Step Deployment

### Step 1: Set up Supabase

1. **Create a new project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and region (choose closest to your users)
   - Set database password (save this!)
   - Wait for project to initialize (~2 minutes)

2. **Run the database migration**
   - Go to "SQL Editor" in Supabase dashboard
   - Click "New Query"
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"
   - Verify tables created: secrets, secret_metadata, profiles, rate_limits

3. **Get API keys**
   - Go to Settings > API
   - Copy these values:
     - Project URL → \`NEXT_PUBLIC_SUPABASE_URL\`
     - \`anon\` \`public\` key → \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
     - \`service_role\` \`secret\` key → \`SUPABASE_SERVICE_ROLE_KEY\`

4. **Enable pg_cron for auto-cleanup** (Optional but recommended)
   - Go to Database > Extensions
   - Search for "pg_cron"
   - Click "Enable"
   - Go back to SQL Editor and run:
     \`\`\`sql
     SELECT cron.schedule(
       'cleanup-expired-secrets',
       '0 * * * *',
       'SELECT delete_expired_secrets()'
     );

     SELECT cron.schedule(
       'cleanup-expired-rate-limits',
       '0 * * * *',
       'SELECT delete_expired_rate_limits()'
     );
     \`\`\`

### Step 2: Generate Encryption Key

Run this command in your terminal:

\`\`\`bash
openssl rand -base64 32
\`\`\`

Save the output - this is your \`ENCRYPTION_KEY\`

**⚠️ IMPORTANT**: Never commit this key to version control!

### Step 3: Push to GitHub

\`\`\`bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: OneTimeSecret on Vercel"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/onetimesecret.git
git branch -M main
git push -u origin main
\`\`\`

### Step 4: Deploy to Vercel

#### Option A: Deploy via Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: \`npm run build\`
   - **Output Directory**: (leave default)
   - **Install Command**: \`npm install\`

5. **Add Environment Variables**:

   Click "Environment Variables" and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | \`NEXT_PUBLIC_SUPABASE_URL\` | Your Supabase URL | Production, Preview, Development |
   | \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Your Supabase anon key | Production, Preview, Development |
   | \`SUPABASE_SERVICE_ROLE_KEY\` | Your Supabase service role key | Production, Preview, Development |
   | \`ENCRYPTION_KEY\` | Generated encryption key | Production, Preview, Development |
   | \`NEXT_PUBLIC_SITE_URL\` | Your Vercel domain | Production only |

6. Click "Deploy"

7. Wait for deployment (~2-3 minutes)

8. **Update \`NEXT_PUBLIC_SITE_URL\`**:
   - After first deployment, copy your Vercel URL (e.g., \`https://your-app.vercel.app\`)
   - Go to Settings > Environment Variables
   - Update \`NEXT_PUBLIC_SITE_URL\` with your Vercel URL
   - Redeploy from Deployments tab

#### Option B: Deploy via CLI

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to link to your Vercel account

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ENCRYPTION_KEY
vercel env add NEXT_PUBLIC_SITE_URL

# Deploy to production
vercel --prod
\`\`\`

### Step 5: Verify Deployment

1. **Test Secret Creation**
   - Go to your deployed URL
   - Create a test secret
   - Copy the link
   - Open link in incognito/private window
   - Verify secret displays correctly
   - Verify secret is destroyed after viewing

2. **Check Security Headers**
   \`\`\`bash
   curl -I https://your-app.vercel.app
   \`\`\`

   Should see headers like:
   - \`strict-transport-security\`
   - \`x-frame-options\`
   - \`x-content-type-options\`
   - \`content-security-policy\`

3. **Test Rate Limiting**
   - Try creating 11 secrets quickly
   - Should see rate limit error on 11th attempt

### Step 6: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Settings > Domains
2. Add your custom domain (e.g., \`secrets.yourdomain.com\`)
3. Update DNS records as instructed
4. Update \`NEXT_PUBLIC_SITE_URL\` environment variable
5. Redeploy

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| \`NEXT_PUBLIC_SUPABASE_URL\` | Supabase project URL | \`https://xyz.supabase.co\` |
| \`NEXT_PUBLIC_SUPABASE_ANON_KEY\` | Supabase anonymous key | \`eyJhbG...\` |
| \`SUPABASE_SERVICE_ROLE_KEY\` | Supabase service role key | \`eyJhbG...\` |
| \`ENCRYPTION_KEY\` | 32-byte encryption key (base64) | \`abc123...\` |
| \`NEXT_PUBLIC_SITE_URL\` | Your deployed URL | \`https://your-app.vercel.app\` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`RATE_LIMIT_SECRET_CREATE\` | Max secret creations per window | 10 |
| \`RATE_LIMIT_SECRET_VIEW\` | Max secret views per window | 50 |
| \`RATE_LIMIT_WINDOW_MS\` | Rate limit window in ms | 900000 (15 min) |

## Troubleshooting

### Build Errors

**Error: Cannot find module '@supabase/supabase-js'**
- Solution: Make sure \`package.json\` has all dependencies
- Run: \`npm install\`

**Error: Type error in TypeScript**
- Solution: Check \`tsconfig.json\` is present
- Run: \`npm run type-check\`

### Runtime Errors

**Error: Secret not found immediately after creation**
- Check: Supabase connection is working
- Verify: Environment variables are set correctly
- Check: Row Level Security policies are applied

**Error: Rate limit exceeded**
- Normal behavior after 10 creations in 15 minutes
- Wait 15 minutes or adjust rate limits in code

**Error: Failed to decrypt secret**
- Check: \`ENCRYPTION_KEY\` is set
- Verify: Same key used for encryption and decryption
- Check: Passphrase matches (if used)

### Database Issues

**Error: relation "secrets" does not exist**
- Solution: Run migration script in Supabase SQL Editor
- File: \`supabase/migrations/001_initial_schema.sql\`

**Secrets not auto-deleting**
- Check: pg_cron extension is enabled
- Verify: Cron jobs are scheduled
- Run manually: \`SELECT delete_expired_secrets();\`

## Monitoring

### Vercel Analytics

1. Go to Vercel Dashboard > Analytics
2. View request metrics, performance, errors

### Supabase Logs

1. Go to Supabase Dashboard > Logs
2. Check API logs for errors
3. Monitor query performance

## Security Checklist

- [ ] Encryption key is 32 bytes and randomly generated
- [ ] Service role key is never exposed to client
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Security headers are present
- [ ] Rate limiting is working
- [ ] Expired secrets are being cleaned up
- [ ] Row Level Security policies are active

## Backup & Disaster Recovery

### Database Backups

Supabase automatically backs up your database:
- Point-in-time recovery available
- Daily backups on paid plans
- Manual backups via:
  \`\`\`bash
  # Export via Supabase CLI
  supabase db dump -f backup.sql
  \`\`\`

### Restore from Backup

\`\`\`bash
# Restore via Supabase SQL Editor
# Upload backup.sql and execute
\`\`\`

## Scaling

### Free Tier Limits

**Vercel (Hobby)**
- 100 GB bandwidth/month
- Unlimited requests
- 10 second function timeout

**Supabase (Free)**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

### Upgrade Considerations

Consider upgrading when:
- Database > 400 MB (80% of free tier)
- Consistent > 1M requests/month
- Need longer retention of secrets
- Need custom domain on Supabase

## Support

- 📧 Email: support@onetimesecret.com
- 💬 Issues: [GitHub Issues](https://github.com/yourusername/onetimesecret/issues)
- 📖 Docs: [Vercel Docs](https://vercel.com/docs), [Supabase Docs](https://supabase.com/docs)

---

Last updated: 2024
