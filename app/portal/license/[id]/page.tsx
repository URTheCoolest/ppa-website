'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { MapPin, Tag, Folder, User, Calendar, Hash, Download } from 'lucide-react'

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
  location: string | null
  created_at: string
  photographer?: {
    full_name: string
    email: string
  }
}

// Helper to get image URL for preview (watermarked)
function getPreviewUrl(item: Media): string {
  if (!item.file_path) return ''
  
  let path = item.file_path
  
  if (path.startsWith('backblaze:')) {
    path = path.replace('backblaze:', '')
  } else if (path.includes('/ppa-media/')) {
    path = path.split('/ppa-media/')[1]
  } else if (path.includes('/media/')) {
    path = path.split('/media/')[1]
  }
  
  return `/api/preview?path=${encodeURIComponent(path)}&width=1200&watermark=true&style=diagonal&v=v4`
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
  const [user, setUser] = useState<any>(null)
  
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
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'client') {
      router.push('/login')
      return
    }

    setUser({ ...user, profile })
    loadMedia()
  }

  const loadMedia = async () => {
    const { data, error } = await supabase
      .from('media')
      .select(`
        *,
        photographer:profiles(full_name, email)
      `)
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

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
  
  if (!media) return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Media not found</h2>
        <Link href="/portal/browse" className="text-blue-600 hover:underline">← Back to Browse</Link>
      </div>
    </div>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">License Request Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your license request has been submitted. You'll be redirected to payment, or notified once it's approved.
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
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-10 w-auto" />
              </Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <Link href="/portal/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                ← Back to Browse
              </Link>
            </div>
            
            {/* Profile Dropdown */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user?.profile?.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                  <span className="text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Media Details Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{media.filename}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Hash className="w-4 h-4" /> {media.media_id}
            </span>
            <span className="flex items-center gap-1">
              {media.media_type === 'photo' ? '📷 Photo' : '🎬 Video'}
            </span>
            {media.category && (
              <span className="flex items-center gap-1">
                <Folder className="w-4 h-4" /> {media.category}
              </span>
            )}
            {media.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {media.location}
              </span>
            )}
            {media.photographer && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> {media.photographer.full_name || media.photographer.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {new Date(media.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {/* Keywords */}
          {media.keywords && media.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {media.keywords.map((keyword, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {keyword}
                </span>
              ))}
            </div>
          )}
          
          {media.description && (
            <p className="mt-3 text-gray-600 dark:text-gray-400">{media.description}</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Media Preview - Full width image, no rounded corners, actual aspect ratio */}
          <div className="lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-900 relative">
              {(() => {
                const imgUrl = getPreviewUrl(media)
                return imgUrl ? (
                  <img 
                    src={imgUrl} 
                    alt={media.filename}
                    className="w-full h-auto block"
                  />
                ) : (
                  <div className="aspect-video w-full flex items-center justify-center text-6xl text-gray-400">
                    {media.media_type === 'photo' ? '📷' : '🎬'}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* License Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold dark:text-white mb-4">License This Media</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Usage Type */}
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                    Usage Type
                  </label>
                  <select
                    value={usageType}
                    onChange={(e) => setUsageType(e.target.value)}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                          Duration
                        </label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your intended use..."
                  />
                </div>

                {/* Price */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="dark:text-gray-300">Total Price:</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{calculatePrice()} PLN</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {media.media_type === 'photo' 
                      ? `Base: ${media.price_pln} PLN × ${USAGE_TYPES.find(u => u.value === usageType)?.multiplier}x usage`
                      : `Based on ${duration} ${resolution} video + ${usageType} usage`
                    }
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Proceed to Payment
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  By purchasing, you agree to our licensing terms. Full resolution file delivered after payment confirmation.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
