'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { CheckSquare, Square, Trash2, CheckCircle, XCircle, Star, Image, Video, Loader2, MousePointer2 } from 'lucide-react'

// Helper to get preview image URL (watermarked)
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
  
  return `/api/preview?path=${encodeURIComponent(path)}&width=400&watermark=true&style=diagonal`
}

interface Media {
  id: string
  media_id: string
  filename: string
  media_type: 'photo' | 'video'
  file_path: string
  thumbnail_path: string | null
  description: string | null
  category: string | null
  is_approved: boolean
  is_featured: boolean
  price_pln: number
  photographer_id: string
  created_at: string
  profiles?: { full_name: string; photographer_id: string }
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    loadMedia()
  }, [filter])

  const checkAdmin = async () => {
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
    if (!profile || profile.role !== 'admin') {
      router.push('/login')
    }
  }

  const loadMedia = async () => {
    setLoading(true)
    setSelectedIds(new Set())
    setLastClickedId(null)
    
    let query = supabase
      .from('media')
      .select('*, profiles(full_name, photographer_id)')
      .order('created_at', { ascending: false })

    if (filter === 'approved') {
      query = query.eq('is_approved', true)
    } else if (filter === 'pending') {
      query = query.eq('is_approved', false)
    }

    const { data } = await query
    if (data) setMedia(data)
    setLoading(false)
  }

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('media')
      .update({ is_approved: !currentStatus })
      .eq('id', id)
    loadMedia()
  }

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('media')
      .update({ is_featured: !currentStatus })
      .eq('id', id)
    loadMedia()
  }

  const deleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return
    
    await supabase
      .from('media')
      .delete()
      .eq('id', id)
    loadMedia()
  }

  const deleteMediaBatch = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} item(s)? This cannot be undone.`)) return
    
    setProcessing(true)
    for (const id of ids) {
      await supabase.from('media').delete().eq('id', id)
    }
    setSelectedIds(new Set())
    setLastClickedId(null)
    setProcessing(false)
    loadMedia()
  }

  const updateApprovalBatch = async (ids: string[], approve: boolean) => {
    setProcessing(true)
    for (const id of ids) {
      await supabase.from('media').update({ is_approved: approve }).eq('id', id)
    }
    setSelectedIds(new Set())
    setLastClickedId(null)
    setProcessing(false)
    loadMedia()
  }

  const updateFeaturedBatch = async (ids: string[], feature: boolean) => {
    setProcessing(true)
    for (const id of ids) {
      await supabase.from('media').update({ is_featured: feature }).eq('id', id)
    }
    setSelectedIds(new Set())
    setLastClickedId(null)
    setProcessing(false)
    loadMedia()
  }

  const executeBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) return
    
    const ids = Array.from(selectedIds)
    
    switch (bulkAction) {
      case 'approve':
        updateApprovalBatch(ids, true)
        break
      case 'unapprove':
        updateApprovalBatch(ids, false)
        break
      case 'feature':
        updateFeaturedBatch(ids, true)
        break
      case 'unfeature':
        updateFeaturedBatch(ids, false)
        break
      case 'delete':
        deleteMediaBatch(ids)
        break
    }
    setBulkAction('')
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set())
      setLastClickedId(null)
    } else {
      setSelectedIds(new Set(filteredMedia.map(m => m.id)))
      if (filteredMedia.length > 0) {
        setLastClickedId(filteredMedia[filteredMedia.length - 1].id)
      }
    }
  }

  // Click handler with Shift-click range selection
  const handleCardClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedId) {
      // Shift-click: select range
      const visibleIds = filteredMedia.map(m => m.id)
      const lastIndex = visibleIds.indexOf(lastClickedId)
      const currentIndex = visibleIds.indexOf(id)
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangeIds = visibleIds.slice(start, end + 1)
        
        setSelectedIds(prev => {
          const newSet = new Set(prev)
          rangeIds.forEach(rangeId => newSet.add(rangeId))
          return newSet
        })
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd-click: toggle individual
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        return newSet
      })
    } else {
      // Regular click: toggle single
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        if (newSet.has(id)) {
          newSet.delete(id)
        } else {
          newSet.add(id)
        }
        return newSet
      })
    }
    
    setLastClickedId(id)
  }

  // Checkbox click (doesn't interfere with card selection)
  const handleCheckboxClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
    setLastClickedId(id)
  }

  const filteredMedia = media.filter(m => 
    m.filename.toLowerCase().includes(search.toLowerCase()) ||
    m.media_id.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
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
              <span className="text-gray-600 dark:text-gray-300">Manage Media</span>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/admin" className="text-gray-600 dark:text-gray-300 text-sm hover:text-blue-600">← Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Library</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filteredMedia.length} items</p>
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] dark:text-white w-full md:w-72"
          />
        </div>

        {/* Selection Tips */}
        {selectedIds.size === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-6 flex items-center gap-3">
            <MousePointer2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Click cards to select • Shift+click for range • Ctrl/Cmd+click to toggle • Use Select All below
            </p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Select All */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
            >
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All ({filteredMedia.length})
            </button>

            {/* Selection Count */}
            {selectedIds.size > 0 && (
              <span className="text-sm text-blue-600 font-medium bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {selectedIds.size} selected
              </span>
            )}

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden md:block" />
                
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#2A2A2A] dark:text-white text-sm"
                >
                  <option value="">Choose action...</option>
                  <option value="approve">✓ Approve</option>
                  <option value="unapprove">✗ Unapprove</option>
                  <option value="feature">★ Feature</option>
                  <option value="unfeature">☆ Unfeature</option>
                  <option value="delete" className="text-red-600">🗑 Delete</option>
                </select>

                <button
                  onClick={executeBulkAction}
                  disabled={!bulkAction || processing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedIds(new Set())
                    setLastClickedId(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-75">
                ({f === 'all' ? media.length : media.filter(m => f === 'approved' ? m.is_approved : !m.is_approved).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading media...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No media found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((item, index) => (
              <div 
                key={item.id} 
                onClick={(e) => handleCardClick(item.id, e)}
                className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all relative ${
                  selectedIds.has(item.id) 
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#121212] bg-blue-50 dark:bg-blue-900/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg'
                }`}
              >
                {/* Selection Indicator (Corner Checkmark) */}
                <div 
                  onClick={(e) => handleCheckboxClick(item.id, e)}
                  className={`absolute top-2 left-2 z-20 w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    selectedIds.has(item.id)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/90 hover:bg-white text-gray-400 hover:text-blue-600'
                  }`}
                >
                  {selectedIds.has(item.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>

                {/* Number indicator for range selection */}
                {selectedIds.has(item.id) && (
                  <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {Array.from(selectedIds).indexOf(item.id) + 1}
                  </div>
                )}

                {/* Image */}
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  {getPreviewUrl(item) ? (
                    <img src={getPreviewUrl(item)} alt={item.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                      {item.media_type === 'photo' ? <Image /> : <Video />}
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {item.is_featured && (
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center" title="Featured">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </span>
                    )}
                    {item.is_approved ? (
                      <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center" title="Approved">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center" title="Pending">
                        <XCircle className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded flex items-center gap-1">
                      {item.media_type === 'photo' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-medium text-gray-900 dark:text-white truncate text-sm" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.media_id}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {item.profiles?.full_name || 'Unknown'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-blue-600">{item.price_pln} PLN</p>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleApproval(item.id, item.is_approved)
                        }}
                        className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${
                          item.is_approved 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        title={item.is_approved ? 'Unapprove' : 'Approve'}
                      >
                        {item.is_approved ? '✗' : '✓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMedia(item.id)
                        }}
                        className="w-7 h-7 rounded bg-red-100 text-red-800 hover:bg-red-200 flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
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
