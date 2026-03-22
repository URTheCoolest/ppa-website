'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Header from '@/components/Header'
import { Search, Camera, Video, Grid, Layout, Lock, Loader2 } from 'lucide-react'

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
  
  if (path.startsWith('backblaze:')) {
    path = path.replace('backblaze:', '')
  } else if (path.includes('/ppa-media/')) {
    path = path.split('/ppa-media/')[1]
  } else if (path.includes('/media/')) {
    path = path.split('/media/')[1]
  }
  
  const styles = ['diagonal', 'centered', 'tiled']
  const randomStyle = styles[Math.floor(Math.random() * styles.length)]
  return `/api/preview?path=${encodeURIComponent(path)}&width=600&watermark=true&style=${randomStyle}&v=v4`
}

const ITEMS_PER_PAGE = 12

export default function BrowsePage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaType, setMediaType] = useState<'all' | 'photo' | 'video'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry')
  
  // Pagination
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    loadMedia(true)
  }, [])

  const loadMedia = async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }
    
    const currentPage = reset ? 0 : page
    
    let query = supabase
      .from('media')
      .select('*', { count: 'exact' })
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1)

    if (mediaType !== 'all') {
      query = query.eq('media_type', mediaType)
    }

    if (searchQuery) {
      query = query.or(`filename.ilike.%${searchQuery}%,media_id.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`)
    }

    const { data, count } = await query
    
    if (data) {
      if (reset) {
        setMedia(data)
      } else {
        setMedia(prev => [...prev, ...data])
      }
      setTotalCount(count || 0)
      setHasMore(data.length === ITEMS_PER_PAGE)
    }
    
    setLoading(false)
    setLoadingMore(false)
  }

  const handleSearch = async () => {
    setPage(0)
    loadMedia(true)
  }

  const handleMediaTypeChange = (type: 'all' | 'photo' | 'video') => {
    setMediaType(type)
    setPage(0)
    loadMedia(true)
  }

  // Infinite scroll with Intersection Observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    if (target.isIntersecting && hasMore && !loadingMore && !loading) {
      setPage(prev => prev + 1)
    }
  }, [hasMore, loadingMore, loading])

  useEffect(() => {
    if (hasMore && !loading) {
      loadMedia(false)
    }
  }, [page])

  useEffect(() => {
    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(handleObserver, {
        root: null,
        rootMargin: '100px',
        threshold: 0
      })
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, handleObserver])

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      <Header currentPage="browse" showNav={true} />

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
                onClick={() => handleMediaTypeChange('all')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  mediaType === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleMediaTypeChange('photo')}
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
                onClick={() => handleMediaTypeChange('video')}
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
            {loading ? 'Loading...' : `${media.length}${hasMore ? '+' : ''} of ${totalCount} items`}
          </p>
          <select className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-700 dark:text-gray-300 text-sm">
            <option>Newest First</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading media...</p>
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
                <div className="bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-all">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Link
                        href={`/portal/license/${item.id}`}
                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-all group">
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Link
                      href={`/portal/license/${item.id}`}
                      className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
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
              </div>
            ))}
          </div>
        )}

        {/* Load More Trigger / Loading Indicator */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loadingMore && (
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!hasMore && media.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400">You've seen all {totalCount} items</p>
          )}
        </div>
      </main>
    </div>
  )
}
