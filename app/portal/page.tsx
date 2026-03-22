'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { Search, Camera } from 'lucide-react'

export default function ClientPortal() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
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
              <Link href="/" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-8 w-auto" />
              </Link>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600 dark:text-gray-400">Client Portal</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal/my-requests" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">My Requests</Link>
              <ThemeToggle />
              <button onClick={handleLogout} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Button */}
      <main className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <div className="text-center max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {profile.full_name || 'Client'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Browse our collection of premium photos and videos
          </p>
          
          <Link
            href="/portal/browse"
            className="inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold px-12 py-8 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
          >
            <Search className="w-8 h-8" />
            Start Browsing
          </Link>
          
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            or visit{' '}
            <Link href="/portal/my-requests" className="text-blue-600 hover:underline">
              My Requests
            </Link>
            {' '}to view your purchases
          </p>
        </div>
      </main>
    </div>
  )
}
