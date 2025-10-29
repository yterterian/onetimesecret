import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { encrypt, generateSecretKey, hash } from '@/lib/crypto'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { CreateSecretRequest, CreateSecretResponse } from '@/types/api'
import { z } from 'zod'

// Validation schema
const createSecretSchema = z.object({
  secret: z.string().min(1).max(10000),
  passphrase: z.string().optional(),
  ttl: z.number().min(60).max(604800).default(86400), // 1 min to 7 days
  maxViews: z.number().min(1).max(100).default(1),
  recipientEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        } as CreateSecretResponse,
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSecretSchema.parse(body)

    // Generate unique key
    const key = generateSecretKey()

    // Encrypt the secret
    const encryptedContent = encrypt(
      validatedData.secret,
      validatedData.passphrase
    )

    // Hash passphrase if provided
    const passphraseHash = validatedData.passphrase
      ? hash(validatedData.passphrase)
      : null

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + validatedData.ttl * 1000)

    // Store in database
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from('secrets').insert({
      key,
      encrypted_content: encryptedContent,
      passphrase_hash: passphraseHash,
      has_passphrase: !!validatedData.passphrase,
      max_views: validatedData.maxViews,
      expires_at: expiresAt.toISOString(),
      recipient_email: validatedData.recipientEmail,
      created_ip: clientIp,
    }).select().single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create secret',
        } as CreateSecretResponse,
        { status: 500 }
      )
    }

    // Create metadata entry
    await supabase.from('secret_metadata').insert({
      secret_id: data.id,
      secret_key: key,
      state: 'new',
    })

    // Generate the secret URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const secretUrl = `${baseUrl}/secret/${key}`

    return NextResponse.json(
      {
        success: true,
        key,
        url: secretUrl,
        expiresAt: expiresAt.toISOString(),
      } as CreateSecretResponse,
      {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Error creating secret:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
        } as CreateSecretResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      } as CreateSecretResponse,
      { status: 500 }
    )
  }
}
