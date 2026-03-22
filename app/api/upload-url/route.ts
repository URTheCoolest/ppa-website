import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Route segment config
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Backblaze B2 S3-compatible configuration
const B2_KEY_ID = process.env.BACKBLAZE_KEY_ID || '00329dfb0600d150000000001'
const B2_APP_KEY = process.env.BACKBLAZE_APP_KEY || 'K003QYkZaYvX9VJxFv+Ee8EwKEC+EJc'
const B2_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME || 'ppa-media'
const B2_REGION = 'eu-central-003'
const B2_ENDPOINT = `https://s3.${B2_REGION}.backblazeb2.com`

// Create S3 client for Backblaze B2
const s3Client = new S3Client({
  region: B2_REGION,
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
})

/**
 * Generate a presigned PUT URL for direct browser-to-Backblaze upload
 * Uses S3-compatible API which supports CORS
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

    // Create PUT command
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    // Generate presigned URL (valid for 1 hour)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({
      uploadUrl,
      key,
    })

  } catch (error: any) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
