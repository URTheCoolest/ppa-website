'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Media {
  id: string
  media_id: string
  filename: string
  media_type: 'photo' | 'video'
  file_path: string
  thumbnail_path: string | null
  description: string | null
  category: string | null
  keywords: string[] | null
  price_pln: number
  photographer_id: string
}

// Helper to get image URL for preview (watermarked, smaller)
function getPreviewUrl(item: Media): string {
  if (!item.file_path) return ''
  
  let path = item.file_path
  
  // Extract path from different formats
  if (path.startsWith('backblaze:')) {
    path = path.replace('backblaze:', '')
  } else if (path.includes('/ppa-media/')) {
    path = path.split('/ppa-media/')[1]
  } else if (path.includes('/media/')) {
    path = path.split('/media/')[1]
  }
  
  return `/api/preview?path=${encodeURIComponent(path)}&width=800&watermark=true&style=tiled`
}

// Helper to get raw download URL (for after purchase)
function getDownloadUrl(item: Media): string {
  if (!item.file_path) return ''
  
  let path = item.file_path
  
  if (path.startsWith('backblaze:')) {
    path = path.replace('backblaze:', '')
  } else if (path.includes('/ppa-media/')) {
    path = path.split('/ppa-media/')[1]
  } else if (path.includes('/media/')) {
    path = path.split('/media/')[1]
  }
  
  return `/api/download?path=${encodeURIComponent(path)}`
}

const USAGE_TYPES = [
  { value: 'editorial', label: 'Editorial', multiplier: 1 },
  { value: 'social_media', label: 'Social Media', multiplier: 1.5 },
  { value: 'commercial', label: 'Commercial', multiplier: 2 },
  { value: 'print', label: 'Print', multiplier: 2.5 },
  { value: 'custom', label: 'Custom', multiplier: 1.5 },
]

const VIDEO_PRICING = {
  short_hd: 50,
  short_4k: 80,
  medium_hd: 80,
  medium_4k: 120,
  long_hd: 120,
  long_4k: 180,
}

export default function LicenseRequestPage() {
  const params = useParams()
  const mediaId = params.id as string
  
  const [media, setMedia] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [usageType, setUsageType] = useState('editorial')
  const [usageDescription, setUsageDescription] = useState('')
  const [duration, setDuration] = useState('short')
  const [resolution, setResolution] = useState('hd')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'client') {
      router.push('/login')
      return
    }

    loadMedia()
  }

  const loadMedia = async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .eq('is_approved', true)
      .single()

    if (error || !data) {
      router.push('/portal/browse')
      return
    }

    setMedia(data)
    setLoading(false)
  }

  const calculatePrice = () => {
    if (!media) return 0

    if (media.media_type === 'photo') {
      const usage = USAGE_TYPES.find(u => u.value === usageType)
      return media.price_pln * (usage?.multiplier || 1)
    } else {
      // Video pricing
      const key = `${duration}_${resolution}` as keyof typeof VIDEO_PRICING
      const basePrice = VIDEO_PRICING[key] || 50
      const usage = USAGE_TYPES.find(u => u.value === usageType)
      return Math.round(basePrice * (usage?.multiplier || 1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const price = calculatePrice()

      const { data: requestData, error: insertError } = await supabase
        .from('license_requests')
        .insert({
          client_id: user.id,
          media_id: mediaId,
          photographer_id: media?.photographer_id,
          usage_type: usageType,
          usage_description: usageDescription,
          duration: media?.media_type === 'video' ? duration : null,
          resolution: media?.media_type === 'video' ? resolution : null,
          price_pln: price,
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Create Stripe checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseRequestId: requestData.id,
          clientId: user.id
        })
      })

      const { url, error: checkoutError } = await response.json()

      if (checkoutError) throw new Error(checkoutError)

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!media) return <div className="p-8">Media not found</div>

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your license request has been submitted. You'll be notified once it's approved.
          </p>
          <Link
            href="/portal/my-requests"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            View My Requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <Link href="/portal/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                ← Back to Browse
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Media Preview */}
          <div>
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-200 dark:bg-gray-800 relative">
                {(() => {
                  const imgUrl = getPreviewUrl(media)
                  return imgUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={media.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                      {media.media_type === 'photo' ? '📷' : '🎬'}
                    </div>
                  )
                })()}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                  {media.media_id}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold dark:text-white">{media.filename}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {media.media_type === 'photo' ? 'Photo' : 'Video'} • {media.category || 'Uncategorized'}
                </p>
                {media.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{media.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* License Form */}
          <div>
            <h2 className="text-2xl font-bold dark:text-white mb-6">License Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usage Type */}
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Usage Type
                </label>
                <select
                  value={usageType}
                  onChange={(e) => setUsageType(e.target.value)}
                  className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                >
                  {USAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({type.multiplier}x)
                    </option>
                  ))}
                </select>
              </div>

              {/* Video-specific options */}
              {media.media_type === 'video' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                        Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                      >
                        <option value="short">Short (&lt;30s)</option>
                        <option value="medium">Medium (30-60s)</option>
                        <option value="long">Long (60s+)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                        Resolution
                      </label>
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                      >
                        <option value="hd">HD</option>
                        <option value="4k">4K</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Usage Description */}
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  How will you use this media?
                </label>
                <textarea
                  value={usageDescription}
                  onChange={(e) => setUsageDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  placeholder="Describe your intended use..."
                />
              </div>

              {/* Price */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Total Price:</span>
                  <span className="text-2xl font-bold text-blue-600">{calculatePrice()} PLN</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {media.media_type === 'photo' 
                    ? `Base: ${media.price_pln} PLN × ${USAGE_TYPES.find(u => u.value === usageType)?.multiplier}x usage`
                    : `Based on ${duration} ${resolution} video + ${usageType} usage`
                  }
                </p>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit License Request'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
