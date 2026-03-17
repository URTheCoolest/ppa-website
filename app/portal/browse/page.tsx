'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { Search, Camera, Video, LogOut, Grid, Layout } from 'lucide-react'

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

// Helper to get preview image URL (watermarked, smaller)
function getPreviewUrl(item: Media): string {
  if (!item.file_path) return ''
  
  let path = item.file_path
  
  // Extract path from different formats
  if (path.startsWith('backblaze:')) {
    path = path.replace('backblaze:', '')
  } else if (path.includes('/ppa-media/')) {
    // Extract from Backblaze S3 URL
    path = path.split('/ppa-media/')[1]
  } else if (path.includes('/media/')) {
    // Extract from Supabase storage URL
    path = path.split('/media/')[1]
  }
  
  // Use our preview API with different watermark styles
  const styles = ['diagonal', 'centered', 'tiled']
  const randomStyle = styles[Math.floor(Math.random() * styles.length)]
  return `/api/preview?path=${encodeURIComponent(path)}&width=600&watermark=true&style=${randomStyle}`
}

export default function BrowsePage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaType, setMediaType] = useState<'all' | 'photo' | 'video'>('all')
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry')

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
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
              </Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-900 dark:text-white font-medium">Browse Media</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/portal/my-requests" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                My Requests
              </Link>
              <ThemeToggle />
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-gray-50 dark:bg-[#1E1E1E] py-6 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by keyword, filename, or Media ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Media Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setMediaType('all')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  mediaType === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaType('photo')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  mediaType === 'photo' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }`}
              >
                <Camera className="w-4 h-4" />
                Photos
              </button>
              <button
                onClick={() => setMediaType('video')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  mediaType === 'video' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }`}
              >
                <Video className="w-4 h-4" />
                Videos
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('masonry')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'masonry' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Masonry View"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {media.length} items found
          </p>
          <select className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 text-sm">
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading media...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No media found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try a different search or filter.</p>
          </div>
        ) : viewMode === 'masonry' ? (
          /* Masonry Layout (Pinterest-style) */
          <div className="masonry-grid">
            {media.map((item) => (
              <div key={item.id} className="masonry-item group">
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-all">
                  <div className="relative bg-gray-100 dark:bg-gray-800">
                    {getPreviewUrl(item) ? (
                      <img 
                        src={getPreviewUrl(item)} 
                        alt={item.filename}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full flex items-center justify-center text-gray-400 text-4xl">
                        {item.media_type === 'photo' ? <Camera /> : <Video />}
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Link
                        href={`/portal/license/${item.id}`}
                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all"
                      >
                        License This
                      </Link>
                    </div>
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-3 left-3">
                      {item.media_type === 'video' && (
                        <div className="bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                          <Video className="w-3 h-3" /> Video
                        </div>
                      )}
                    </div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {item.price_pln} PLN
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{item.filename}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.media_id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-all group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                  {getPreviewUrl(item) ? (
                    <img 
                      src={getPreviewUrl(item)} 
                      alt={item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      {item.media_type === 'photo' ? <Camera /> : <Video />}
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Link
                      href={`/portal/license/${item.id}`}
                      className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all"
                    >
                      License This
                    </Link>
                  </div>
                  
                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {item.price_pln} PLN
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.filename}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.media_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
