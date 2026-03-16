'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

// Helper to get preview image URL (watermarked)
function getPreviewUrl(item: any): string {
  if (!item.file_path) return ''
  if (item.file_path.startsWith('backblaze:')) {
    const path = item.file_path.replace('backblaze:', '')
    return `/api/preview?path=${encodeURIComponent(path)}&width=400&watermark=true`
  }
  return item.thumbnail_path || item.file_path
}

export default function ClientPortal() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

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

    setUser(user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'client') {
      router.push('/login')
      return
    }

    setProfile(profile)
    loadMedia()
  }

  const loadMedia = async () => {
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20)

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
      query = query.or(`keywords.cs.{${searchQuery}},filename.ilike.%${searchQuery}%,media_id.ilike.%${searchQuery}%`)
    }

    const { data } = await query.limit(20)
    if (data) setMedia(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Client Portal</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal/browse" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Browse</Link>
              <Link href="/portal/my-requests" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">My Requests</Link>
              <ThemeToggle />
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {profile.full_name}</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and license premium media</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link href="/portal/browse" className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700">
            <h3 className="text-xl font-bold mb-2">🔍 Browse Media</h3>
            <p>Search and license photos and videos</p>
          </Link>
          <Link href="/portal/my-requests" className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <h3 className="text-xl font-bold mb-2 dark:text-white">📋 My Requests</h3>
            <p className="text-gray-600 dark:text-gray-400">View your license requests and purchases</p>
          </Link>
        </div>

        {/* Media Grid */}
        <h2 className="text-xl font-bold dark:text-white mb-4">Featured Media</h2>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {media.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative">
                  {getPreviewUrl(item) ? (
                    <img 
                      src={getPreviewUrl(item)} 
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                    License
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {media.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No media found. Browse our collection to get started.
            <br />
            <Link href="/portal/browse" className="text-blue-600 hover:underline">Go to Browse →</Link>
          </div>
        )}
      </main>
    </div>
  )
}
