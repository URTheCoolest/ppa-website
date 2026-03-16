'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  created_at: string
}

export default function BrowsePage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaType, setMediaType] = useState<'all' | 'photo' | 'video'>('all')
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
    loadMedia()
  }

  const loadMedia = async () => {
    setLoading(true)
    let query = supabase
      .from('media')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (mediaType !== 'all') {
      query = query.eq('media_type', mediaType)
    }

    const { data } = await query.limit(50)
    if (data) setMedia(data)
    setLoading(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    let query = supabase
      .from('media')
      .select('*')
      .eq('is_approved', true)

    if (searchQuery) {
      query = query.or(`filename.ilike.%${searchQuery}%,media_id.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`)
    }

    if (mediaType !== 'all') {
      query = query.eq('media_type', mediaType)
    }

    const { data } = await query.limit(50)
    if (data) setMedia(data)
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
  }, [mediaType])

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
              <span className="text-gray-600 dark:text-gray-300">Browse Media</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/portal/my-requests" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">My Requests</Link>
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="bg-gray-50 dark:bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by keyword, filename, or Media ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
            />
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="p-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Media</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-4">{media.length} items found</p>
        
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : media.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No media found. Try a different search.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => {
              // Get image URL - handle different storage types
              const getImageUrl = () => {
                if (item.file_path?.startsWith('backblaze:')) {
                  // New Backblaze upload - use download API
                  const path = item.file_path.replace('backblaze:', '')
                  return `/api/download?path=${encodeURIComponent(path)}`
                }
                return item.file_path || item.thumbnail_path
              }
              
              return (
              <div key={item.id} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <div className="aspect-square bg-gray-200 dark:bg-gray-800 relative">
                  {getImageUrl() ? (
                    <img 
                      src={getImageUrl()} 
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      {item.media_type === 'photo' ? '📷' : '🎬'}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                    {item.media_id}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium dark:text-white truncate">{item.filename}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.price_pln} PLN</p>
                  <Link
                    href={`/portal/license/${item.id}`}
                    className="mt-2 block text-center bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
                  >
                    License This
                  </Link>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>
    </div>
  )
}
