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

  const updatePrice = async (id: string, price: number) => {
    await supabase
      .from('media')
      .update({ price_pln: price })
      .eq('id', id)
    loadMedia()
  }

  const filteredMedia = media.filter(m => 
    m.filename.toLowerCase().includes(search.toLowerCase()) ||
    m.media_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-600 dark:text-gray-300">Manage Media</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin/users" className="text-gray-600 dark:text-gray-300">Users</Link>
              <Link href="/admin/media" className="text-blue-600 dark:text-blue-400">Media</Link>
              <Link href="/admin/partners" className="text-gray-600 dark:text-gray-300">Partners</Link>
              <Link href="/admin/settings" className="text-gray-600 dark:text-gray-300">Settings</Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300">Logout</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Media Library</h1>
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 dark:text-gray-300 border dark:border-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 dark:text-white">Loading...</div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12 dark:text-white">No media found</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map(item => {
              // Get image URL - handle different storage types
              const getImageUrl = () => {
                if (item.file_path?.startsWith('backblaze:')) {
                  const path = item.file_path.replace('backblaze:', '')
                  return `/api/download?path=${encodeURIComponent(path)}`
                }
                return item.file_path || item.thumbnail_path
              }
              
              return (
              <div key={item.id} className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative">
                  {getImageUrl() ? (
                    <img src={getImageUrl()} alt={item.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {item.media_type === 'photo' ? '📷' : '🎬'}
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs ${item.is_approved ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                      {item.is_approved ? '✓' : '⏳'}
                    </span>
                  </div>
                  {item.is_featured && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">★</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium dark:text-white truncate text-sm">{item.filename}</p>
                  <p className="text-xs text-gray-500">{item.media_id}</p>
                  <p className="text-xs text-gray-500">{item.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-sm font-bold text-blue-600">{item.price_pln} PLN</p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <button
                      onClick={() => toggleApproval(item.id, item.is_approved)}
                      className={`px-2 py-1 rounded text-xs ${item.is_approved ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {item.is_approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(item.id, item.is_featured)}
                      className={`px-2 py-1 rounded text-xs ${item.is_featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {item.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
