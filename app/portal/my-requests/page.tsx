'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface LicenseRequest {
  id: string
  media_id: string
  photographer_id: string
  usage_type: string
  usage_description: string | null
  duration: string | null
  resolution: string | null
  price_pln: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  created_at: string
  media: {
    filename: string
    media_id: string
    media_type: string
    file_path: string | null
    thumbnail_path: string | null
  }
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<LicenseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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

    setUser(user)
    loadRequests()
  }

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('license_requests')
      .select('*, media(filename, media_id, media_type, file_path, thumbnail_path)')
      .order('created_at', { ascending: false })

    if (data) setRequests(data)
    setLoading(false)
  }

  // Helper to get thumbnail/preview URL (watermarked)
  const getThumbnailUrl = (request: LicenseRequest): string => {
    if (!request.media?.file_path) return ''
    
    let path = request.media.file_path
    
    if (path.startsWith('backblaze:')) {
      path = path.replace('backblaze:', '')
    } else if (path.includes('/ppa-media/')) {
      path = path.split('/ppa-media/')[1]
    } else if (path.includes('/media/')) {
      path = path.split('/media/')[1]
    }
    
    return `/api/preview?path=${encodeURIComponent(path)}&width=200&watermark=true&style=diagonal&v=v2`
  }

  // Helper to get download URL (raw, for approved licenses)
  const getDownloadUrl = (request: LicenseRequest): string => {
    if (!request.media?.file_path) return '#'
    
    let path = request.media.file_path
    
    if (path.startsWith('backblaze:')) {
      path = path.replace('backblaze:', '')
    } else if (path.includes('/ppa-media/')) {
      path = path.split('/ppa-media/')[1]
    } else if (path.includes('/media/')) {
      path = path.split('/media/')[1]
    }
    
    return `/api/download?path=${encodeURIComponent(path)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-600 dark:text-gray-300">My License Requests</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/portal/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Browse Media</Link>
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">My License Requests</h1>
          <Link
            href="/portal/browse"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse More Media
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't submitted any license requests yet.</p>
            <Link
              href="/portal/browse"
              className="text-blue-600 hover:underline"
            >
              Browse our media collection →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {getThumbnailUrl(request) ? (
                      <img
                        src={getThumbnailUrl(request)}
                        alt={request.media?.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {request.media?.media_type === 'photo' ? '📷' : '🎬'}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold dark:text-white">{request.media?.filename}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.media?.media_id} • {request.media?.media_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'approved' && (
                          <a
                            href={getDownloadUrl(request)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            📥 Download
                          </a>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                        <span className="ml-1 dark:text-gray-300">{request.usage_type.replace('_', ' ')}</span>
                      </div>
                      {request.duration && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                          <span className="ml-1 dark:text-gray-300">{request.duration}</span>
                        </div>
                      )}
                      {request.resolution && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                          <span className="ml-1 dark:text-gray-300">{request.resolution}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Price:</span>
                        <span className="ml-1 font-semibold text-blue-600">{request.price_pln} PLN</span>
                      </div>
                    </div>

                    {request.usage_description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {request.usage_description}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-400">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
