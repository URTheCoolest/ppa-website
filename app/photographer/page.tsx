'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function PhotographerPortal() {
  const [profile, setProfile] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'photographer') {
      router.push('/login')
      return
    }

    // Check if approved
    if (!profile.is_approved) {
      setProfile(profile)
      setLoading(false)
      return
    }

    setProfile(profile)
    loadData(profile.id)
  }

  const loadData = async (photographerId: string) => {
    const [mediaRes, foldersRes, txRes] = await Promise.all([
      supabase.from('media').select('*').eq('photographer_id', photographerId).order('created_at', { ascending: false }),
      supabase.from('media_folders').select('*').eq('photographer_id', photographerId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('photographer_id', photographerId).order('created_at', { ascending: false }).limit(10)
    ])

    if (mediaRes.data) setMedia(mediaRes.data)
    if (foldersRes.data) setFolders(foldersRes.data)
    if (txRes.data) setTransactions(txRes.data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return <div className="p-8">Loading...</div>

  // Show pending approval message
  if (profile.role === 'photographer' && !profile.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Account Pending Approval</h2>
          <p className="text-gray-600 mb-4">
            Your photographer account is currently under review. We will notify you once your account has been approved.
          </p>
          <button onClick={handleLogout} className="text-blue-600 hover:underline">
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Photographer Portal</span>
              {profile.photographer_id && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {profile.photographer_id}
                </span>
              )}
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/photographer/upload" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Upload</Link>
              <Link href="/photographer/media" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">My Media</Link>
              <Link href="/photographer/earnings" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Earnings</Link>
              <ThemeToggle />
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {profile.full_name}
          </h1>
          <p className="text-gray-600">Photographer ID: {profile.photographer_id || 'Pending'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Uploads</p>
            <p className="text-3xl font-bold">{media.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Earnings</p>
            <p className="text-3xl font-bold text-green-600">{profile.total_earnings || 0} PLN</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Pending Earnings</p>
            <p className="text-3xl font-bold text-yellow-600">{profile.pending_earnings || 0} PLN</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Folders</p>
            <p className="text-3xl font-bold">{folders.length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/photographer/upload" className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700">
            <h3 className="text-xl font-bold mb-2">📤 Upload Media</h3>
            <p>Upload new photos or videos</p>
          </Link>
          <Link href="/photographer/earnings" className="bg-white border p-6 rounded-lg hover:bg-gray-50">
            <h3 className="text-xl font-bold mb-2">💰 View Earnings</h3>
            <p className="text-gray-600">Check your sales and pending payments</p>
          </Link>
        </div>

        {/* Recent Media */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Uploads</h2>
          {loading ? (
            <p>Loading...</p>
          ) : media.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.slice(0, 8).map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-200">
                    {item.thumbnail_path ? (
                      <img src={item.thumbnail_path} alt={item.filename} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {item.media_type === 'photo' ? '📷' : '🎬'}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-gray-500">{item.media_id}</p>
                    <span className={`text-xs px-1 rounded ${item.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No uploads yet. Start uploading!</p>
          )}
        </div>
      </main>
    </div>
  )
}
