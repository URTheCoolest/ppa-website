import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar.${fileExt}`

    // Upload to Supabase storage (avatars bucket)
    const supabase = createAdminClient()

    // First, try to upload to a public avatars bucket
    // Create the file path
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true // Overwrite existing avatar
      })

    if (error) {
      console.error('Storage upload error:', error)
      
      // Fallback: Store as base64 in profile (for simpler setup)
      // This is a fallback if storage bucket doesn't exist
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      // Update profile with the data URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: dataUrl })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, url: dataUrl })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    // Update profile with avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId)

    return NextResponse.json({ success: true, url: urlData.publicUrl })

  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
