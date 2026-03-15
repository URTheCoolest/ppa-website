'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [pendingPhotographers, setPendingPhotographers] = useState<any[]>([])
  const [pendingMedia, setPendingMedia] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

    if (!profile || profile.role !== 'admin') {
      router.push('/login')
      return
    }

    setProfile(profile)
    loadData()
  }

  const loadData = async () => {
    // Get pending photographers
    const photographerRes = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'photographer')
      .eq('is_approved', false)

    // Get pending media
    const mediaRes = await supabase
      .from('media')
      .select('*, profiles(full_name)')
      .eq('is_approved', false)

    // Get pending license requests
    const requestsRes = await supabase
      .from('license_requests')
      .select('*, media(*), profiles!license_requests_client_id_fkey(full_name)')
      .eq('status', 'pending')

    // Get stats
    const [photographersCount, clientsCount, mediaCount, revenueRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'photographer').eq('is_approved', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'client'),
      supabase.from('media').select('id', { count: 'exact' }).eq('is_approved', true),
      supabase.from('transactions').select('amount_pln').eq('status', 'completed')
    ])

    if (photographerRes.data) setPendingPhotographers(photographerRes.data)
    if (mediaRes.data) setPendingMedia(mediaRes.data)
    if (requestsRes.data) setPendingRequests(requestsRes.data)

    const totalRevenue = revenueRes.data?.reduce((sum, t) => sum + (t.amount_pln || 0), 0) || 0

    setStats({
      photographers: photographersCount.count || 0,
      clients: clientsCount.count || 0,
      media: mediaCount.count || 0,
      revenue: totalRevenue
    })

    setLoading(false)
  }

  const approvePhotographer = async (id: string) => {
    // Generate photographer ID
    const count = pendingPhotographers.length
    const photographerId = `PPA-${String(count + 1).padStart(3, '0')}`

    await supabase
      .from('profiles')
      .update({ is_approved: true, photographer_id: photographerId })
      .eq('id', id)

    loadData()
  }

  const approveMedia = async (id: string) => {
    await supabase
      .from('media')
      .update({ is_approved: true })
      .eq('id', id)

    loadData()
  }

  const rejectMedia = async (id: string) => {
    await supabase
      .from('media')
      .delete()
      .eq('id', id)

    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500">|</span>
              <span className="text-red-600 font-bold">Admin Panel</span>
            </div>
            <nav className="flex items-center gap-4">
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">Logout</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Photographers</p>
            <p className="text-3xl font-bold">{stats.photographers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Clients</p>
            <p className="text-3xl font-bold">{stats.clients}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Media Items</p>
            <p className="text-3xl font-bold">{stats.media}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">{stats.revenue} PLN</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('photographers')}
            className={`pb-2 px-4 ${activeTab === 'photographers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Photographers ({pendingPhotographers.length})
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-2 px-4 ${activeTab === 'media' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Pending Media ({pendingMedia.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2 px-4 ${activeTab === 'requests' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            License Requests ({pendingRequests.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Pending Actions</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Pending Photographers</span>
                  <span className="font-bold">{pendingPhotographers.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Pending Media</span>
                  <span className="font-bold">{pendingMedia.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Pending Requests</span>
                  <span className="font-bold">{pendingRequests.length}</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/admin/users" className="block text-blue-600 hover:underline">Manage Users</Link>
                <Link href="/admin/media" className="block text-blue-600 hover:underline">Manage Media</Link>
                <Link href="/admin/partners" className="block text-blue-600 hover:underline">Manage Partners</Link>
                <Link href="/admin/settings" className="block text-blue-600 hover:underline">Site Settings</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photographers' && (
          <div className="bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold p-4 border-b">Pending Photographer Approvals</h3>
            {pendingPhotographers.length === 0 ? (
              <p className="p-4 text-gray-500">No pending photographers</p>
            ) : (
              <ul className="divide-y">
                {pendingPhotographers.map((p) => (
                  <li key={p.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{p.full_name}</p>
                      <p className="text-sm text-gray-500">{p.email}</p>
                    </div>
                    <button
                      onClick={() => approvePhotographer(p.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold p-4 border-b">Pending Media Approval</h3>
            {pendingMedia.length === 0 ? (
              <p className="p-4 text-gray-500">No pending media</p>
            ) : (
              <ul className="divide-y">
                {pendingMedia.map((m) => (
                  <li key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.filename}</p>
                      <p className="text-sm text-gray-500">
                        {m.media_id} • {m.media_type} • by {m.profiles?.full_name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMedia(m.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMedia(m.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold p-4 border-b">Pending License Requests</h3>
            {pendingRequests.length === 0 ? (
              <p className="p-4 text-gray-500">No pending requests</p>
            ) : (
              <ul className="divide-y">
                {pendingRequests.map((r) => (
                  <li key={r.id} className="p-4">
                    <p className="font-medium">{r.media?.filename}</p>
                    <p className="text-sm text-gray-500">
                      Requested by {r.profiles?.full_name} • {r.price_pln} PLN • {r.usage_type}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
