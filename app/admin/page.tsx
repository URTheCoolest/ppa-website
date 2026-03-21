'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { 
  Users, 
  Image, 
  DollarSign, 
  TrendingUp, 
  Download, 
  FileCheck, 
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle,
  Star,
  Award,
  BarChart3
} from 'lucide-react'

interface Stats {
  photographers: number
  clients: number
  media: number
  revenue: number
  pendingPhotographers: number
  pendingMedia: number
  pendingRequests: number
  totalDownloads: number
  totalLicenses: number
  photographerEarnings: number
}

interface TopPhotographer {
  id: string
  full_name: string
  email: string
  media_count: number
  total_earnings: number
  sales_count: number
}

interface TopBuyer {
  id: string
  full_name: string
  email: string
  purchases_count: number
  total_spent: number
}

interface RecentTransaction {
  id: string
  created_at: string
  amount_pln: number
  type: 'license' | 'payout'
  status: string
  photographer?: {
    full_name: string
    email: string
  }
  client?: {
    full_name: string
    email: string
  }
  media?: {
    filename: string
    media_id: string
  }
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<Stats>({
    photographers: 0,
    clients: 0,
    media: 0,
    revenue: 0,
    pendingPhotographers: 0,
    pendingMedia: 0,
    pendingRequests: 0,
    totalDownloads: 0,
    totalLicenses: 0,
    photographerEarnings: 0
  })
  const [topPhotographers, setTopPhotographers] = useState<TopPhotographer[]>([])
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [pendingPhotographers, setPendingPhotographers] = useState<any[]>([])
  const [pendingMedia, setPendingMedia] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
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
    setLoading(true)

    // Get counts
    const [
      photographersCount,
      clientsCount,
      mediaCount,
      pendingPhotographersRes,
      pendingMediaRes,
      pendingRequestsRes,
      transactionsRes,
      downloadsRes,
      licensesRes
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'photographer').eq('is_approved', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'client'),
      supabase.from('media').select('id', { count: 'exact' }).eq('is_approved', true),
      supabase.from('profiles').select('*').eq('role', 'photographer').eq('is_approved', false),
      supabase.from('media').select('*').eq('is_approved', false),
      supabase.from('license_requests').select('*').eq('status', 'pending'),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('downloads').select('id', { count: 'exact' }),
      supabase.from('license_requests').select('id', { count: 'exact' }).eq('status', 'approved')
    ])

    // Calculate revenue
    const totalRevenue = transactionsRes.data?.filter(t => t.type === 'license' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount_pln || 0), 0) || 0

    const photographerEarnings = totalRevenue * 0.8

    setStats({
      photographers: photographersCount.count || 0,
      clients: clientsCount.count || 0,
      media: mediaCount.count || 0,
      revenue: totalRevenue,
      pendingPhotographers: pendingPhotographersRes.data?.length || 0,
      pendingMedia: pendingMediaRes.data?.length || 0,
      pendingRequests: pendingRequestsRes.data?.length || 0,
      totalDownloads: downloadsRes.count || 0,
      totalLicenses: licensesRes.count || 0,
      photographerEarnings
    })

    setPendingPhotographers(pendingPhotographersRes.data || [])
    setPendingMedia(pendingMediaRes.data || [])
    setPendingRequests(pendingRequestsRes.data || [])
    setRecentTransactions(transactionsRes.data || [])

    // Get top photographers by sales
    const { data: topPhotogs } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        photographer_media (count),
        transactions!transactions_photographer_id_fkey (sum_amount: amount_pln, count)
      `)
      .eq('role', 'photographer')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get top buyers
    const { data: topBuys } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        license_requests (count, sum_price: price_pln)
      `)
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(5)

    if (topPhotogs) {
      setTopPhotographers(topPhotogs.map(p => ({
        id: p.id,
        full_name: p.full_name || p.email?.split('@')[0] || 'Unknown',
        email: p.email,
        media_count: p.photographer_media?.[0]?.count || 0,
        total_earnings: p.transactions?.[0]?.sum_amount || 0,
        sales_count: p.transactions?.[0]?.count || 0
      })))
    }

    if (topBuys) {
      setTopBuyers(topBuys.map(b => ({
        id: b.id,
        full_name: b.full_name || b.email?.split('@')[0] || 'Unknown',
        email: b.email,
        purchases_count: b.license_requests?.[0]?.count || 0,
        total_spent: b.license_requests?.[0]?.sum_price || 0
      })).filter(b => b.purchases_count > 0))
    }

    setLoading(false)
  }

  const approvePhotographer = async (id: string) => {
    const count = stats.photographers
    const photographerId = `PPA-${String(count + 1).padStart(3, '0')}`

    await supabase
      .from('profiles')
      .update({ is_approved: true, photographer_id: photographerId })
      .eq('id', id)

    loadData()
  }

  const unapproveMedia = async (id: string) => {
    await supabase
      .from('media')
      .update({ is_approved: false })
      .eq('id', id)

    loadData()
  }

  const deleteMedia = async (id: string) => {
    if (confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      await supabase
        .from('media')
        .delete()
        .eq('id', id)

      loadData()
    }
  }

  const approveRequest = async (id: string) => {
    await supabase
      .from('license_requests')
      .update({ status: 'approved' })
      .eq('id', id)

    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
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
              <span className="text-red-600 dark:text-red-400 font-bold">Admin Panel</span>
            </div>
            <nav className="flex items-center gap-4">
              <ThemeToggle />
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-blue-500" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-500">
                  <span className="text-white font-medium text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <button onClick={loadData} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Photographers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.photographers}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clients</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.clients}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Media</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.media}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.revenue} PLN</p>
          </div>
          
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Platform 20%</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.round(stats.revenue * 0.2)} PLN</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Total Licenses</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalLicenses}</p>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Downloads</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</p>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Photographer Earnings</p>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{Math.round(stats.photographerEarnings)} PLN</p>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">Pending Actions</p>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.pendingPhotographers + stats.pendingMedia + stats.pendingRequests}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'photographers', label: 'Photographers', icon: Users, badge: stats.pendingPhotographers },
            { id: 'media', label: 'Media', icon: Image, badge: stats.pendingMedia },
            { id: 'requests', label: 'Requests', icon: FileCheck, badge: stats.pendingRequests },
            { id: 'top-performers', label: 'Top Performers', icon: Award },
            { id: 'transactions', label: 'Transactions', icon: DollarSign }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pending Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('photographers')}
                  className="w-full flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Pending Photographers</span>
                  </div>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.pendingPhotographers}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('media')}
                  className="w-full flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Image className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Pending Media</span>
                  </div>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.pendingMedia}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className="w-full flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Pending License Requests</span>
                  </div>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    {stats.pendingRequests}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/users" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Users className="w-5 h-5" />
                  Manage Users
                </Link>
                <Link href="/admin/media" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Image className="w-5 h-5" />
                  Manage Media
                </Link>
                <Link href="/admin/partners" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <Award className="w-5 h-5" />
                  Partners
                </Link>
                <Link href="/admin/settings" className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                  <BarChart3 className="w-5 h-5" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photographers' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Photographer Approvals</h3>
            </div>
            {pendingPhotographers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No pending photographers to approve</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingPhotographers.map((p) => (
                  <div key={p.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{p.full_name || 'No name'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.email}</p>
                    </div>
                    <button
                      onClick={() => approvePhotographer(p.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Media Management</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unapprove or delete media as needed</p>
            </div>
            {pendingMedia.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No unapproved media</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingMedia.map((m) => (
                  <div key={m.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{m.filename}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {m.media_id} • {m.media_type} • {m.category || 'No category'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => unapproveMedia(m.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        title="Unapprove"
                      >
                        Unapprove
                      </button>
                      <button
                        onClick={() => deleteMedia(m.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">License Requests</h3>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingRequests.map((r) => (
                  <div key={r.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{r.media?.filename || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {r.media_id} • {r.price_pln} PLN • {r.usage_type}
                      </p>
                    </div>
                    <button
                      onClick={() => approveRequest(r.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'top-performers' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Photographers */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Photographers</h3>
              </div>
              {topPhotographers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No photographer data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topPhotographers.map((p, i) => (
                    <div key={p.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-amber-100 text-amber-600' : 
                          i === 1 ? 'bg-gray-200 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{p.full_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {p.media_count} items • {p.sales_count} sales
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">{p.total_earnings} PLN</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Buyers */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Buyers</h3>
              </div>
              {topBuyers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No buyer data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topBuyers.map((b, i) => (
                    <div key={b.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-blue-100 text-blue-600' : 
                          i === 1 ? 'bg-gray-200 text-gray-600' :
                          i === 2 ? 'bg-cyan-100 text-cyan-600' :
                          'bg-gray-100 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{b.full_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {b.purchases_count} purchases
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{b.total_spent} PLN</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t.type === 'license' ? 'License Sale' : 'Payout'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.photographer?.full_name || t.client?.full_name || 'Unknown'} • {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'license' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'license' ? '+' : '-'}{t.amount_pln} PLN
                      </p>
                      <p className={`text-xs ${t.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                        {t.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
