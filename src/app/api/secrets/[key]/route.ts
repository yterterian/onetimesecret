import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decrypt, verifyPassphrase } from '@/lib/crypto'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { ViewSecretResponse, SecretStatusResponse } from '@/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params

    // Rate limiting
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
        } as ViewSecretResponse,
        { status: 429 }
      )
    }

    // Check if secret exists and get status
    const supabase = await createAdminClient()
    const { data: secret, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('key', key)
      .single()

    if (error || !secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Secret not found or has expired',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(secret.expires_at) < new Date()) {
      // Delete expired secret
      await supabase.from('secrets').delete().eq('key', key)
      return NextResponse.json(
        {
          success: false,
          error: 'Secret has expired',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Check if max views reached
    if (secret.current_views >= secret.max_views) {
      await supabase.from('secrets').delete().eq('key', key)
      return NextResponse.json(
        {
          success: false,
          error: 'Secret has already been viewed',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Return status without decrypting (for checking if passphrase needed)
    return NextResponse.json({
      exists: true,
      needsPassphrase: secret.has_passphrase,
      expiresAt: secret.expires_at,
      viewsRemaining: secret.max_views - secret.current_views,
    } as SecretStatusResponse)
  } catch (error) {
    console.error('Error fetching secret:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      } as ViewSecretResponse,
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    const body = await request.json()
    const { passphrase } = body

    // Rate limiting
    const clientIp = getClientIp(request.headers)
    const rateLimit = checkRateLimit(clientIp, {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000,
    })

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
        } as ViewSecretResponse,
        { status: 429 }
      )
    }

    // Fetch secret
    const supabase = await createAdminClient()
    const { data: secret, error } = await supabase
      .from('secrets')
      .select('*')
      .eq('key', key)
      .single()

    if (error || !secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Secret not found or has expired',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Check if expired
    if (new Date(secret.expires_at) < new Date()) {
      await supabase.from('secrets').delete().eq('key', key)
      return NextResponse.json(
        {
          success: false,
          error: 'Secret has expired',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Check if max views reached
    if (secret.current_views >= secret.max_views) {
      await supabase.from('secrets').delete().eq('key', key)
      return NextResponse.json(
        {
          success: false,
          error: 'Secret has already been viewed',
        } as ViewSecretResponse,
        { status: 404 }
      )
    }

    // Verify passphrase if required
    if (secret.has_passphrase && secret.passphrase_hash) {
      if (!passphrase) {
        return NextResponse.json(
          {
            success: false,
            error: 'Passphrase required',
            needsPassphrase: true,
          } as ViewSecretResponse,
          { status: 401 }
        )
      }

      if (!verifyPassphrase(passphrase, secret.passphrase_hash)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid passphrase',
            needsPassphrase: true,
          } as ViewSecretResponse,
          { status: 401 }
        )
      }
    }

    // Decrypt the secret
    const decryptedSecret = decrypt(secret.encrypted_content, passphrase)

    // Increment view count
    const newViewCount = secret.current_views + 1
    await supabase
      .from('secrets')
      .update({
        current_views: newViewCount,
        viewed_at: new Date().toISOString(),
        viewed_ip: clientIp,
      })
      .eq('key', key)

    // Update metadata
    await supabase
      .from('secret_metadata')
      .update({ state: 'viewed' })
      .eq('secret_key', key)

    // Delete if max views reached
    if (newViewCount >= secret.max_views) {
      await supabase.from('secrets').delete().eq('key', key)
      await supabase
        .from('secret_metadata')
        .update({ state: 'destroyed' })
        .eq('secret_key', key)
    }

    return NextResponse.json({
      success: true,
      secret: decryptedSecret,
      expiresAt: secret.expires_at,
      viewsRemaining: secret.max_views - newViewCount,
    } as ViewSecretResponse)
  } catch (error) {
    console.error('Error viewing secret:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to decrypt secret',
      } as ViewSecretResponse,
      { status: 500 }
    )
  }
}
