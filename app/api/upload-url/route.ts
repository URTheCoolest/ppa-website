import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Route segment config
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Backblaze B2 Configuration (S3-compatible)
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_ENDPOINT = 'https://s3.eu-central-003.backblazeb2.com'

/**
 * Generate a presigned POST URL for S3-compatible upload
 * This works with CORS unlike the native B2 API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, contentType, photographerId, folderId, mediaId } = body

    if (!filename || !photographerId || !folderId || !mediaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build the file path
    const fileExt = filename.split('.').pop()
    const key = `${photographerId}/${folderId}/${mediaId}.${fileExt}`

    // Generate presigned POST using AWS Signature V4
    const region = 'eu-central-003'
    const service = 's3'
    const now = new Date()
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')

    // Policy document
    const policy = {
      expiration: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      conditions: [
        { bucket: B2_BUCKET_NAME },
        { key: key },
        { 'Content-Type': contentType },
        ['content-length-range', 0, 500000000], // Max 500MB
      ]
    }

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64')

    // Sign the policy
    const signature = getSignature(policyBase64, dateStamp, region, service, B2_KEY_ID, B2_APP_KEY)

    // Return presigned POST data
    return NextResponse.json({
      url: `${B2_ENDPOINT}/${B2_BUCKET_NAME}`,
      fields: {
        key: key,
        'Content-Type': contentType,
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': `${B2_KEY_ID}/${dateStamp}/${region}/${service}/aws4_request`,
        'X-Amz-Date': amzDate,
        'X-Amz-Signature': signature,
        Policy: policyBase64,
      },
      key: key
    })

  } catch (error: any) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// AWS Signature V4 helpers
function getSignature(policyBase64: string, dateStamp: string, region: string, service: string, accessKey: string, secretKey: string): string {
  const kDate = hmac('AWS4' + secretKey, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kCredentials = hmac(kService, 'aws4_request')
  return hmacHex(kCredentials, policyBase64)
}

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest()
}

function hmacHex(key: Buffer, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}
