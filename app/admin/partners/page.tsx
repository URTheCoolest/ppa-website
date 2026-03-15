'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Partner {
  id: string
  company_name: string
  contact_name: string | null
  email: string
  website: string | null
  logo_url: string | null
  description: string | null
  partnership_type: 'bronze' | 'silver' | 'gold' | 'none'
  status: 'pending' | 'approved' | 'rejected'
  total_spent: number
  created_at: string
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    loadPartners()
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

  const loadPartners = async () => {
    setLoading(true)
    let query = supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setPartners(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('partners')
      .update({ status } as any)
      .eq('id', id)
    loadPartners()
  }

  const updateTier = async (id: string, tier: string) => {
    await supabase
      .from('partners')
      .update({ partnership_type: tier as any })
      .eq('id', id)
    loadPartners()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-600 dark:text-gray-300">Manage Partners</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin/users" className="text-gray-600 dark:text-gray-300">Users</Link>
              <Link href="/admin/media" className="text-gray-600 dark:text-gray-300">Media</Link>
              <Link href="/admin/partners" className="text-blue-600 dark:text-blue-400">Partners</Link>
              <Link href="/admin/settings" className="text-gray-600 dark:text-gray-300">Settings</Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300">Logout</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Partners</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center dark:text-white">Loading...</td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center dark:text-white">No partners found</td></tr>
              ) : partners.map(partner => (
                <tr key={partner.id} className="dark:text-white">
                  <td className="px-6 py-4">
                    <div className="font-medium">{partner.company_name}</div>
                    {partner.website && (
                      <a href={partner.website} target="_blank" className="text-sm text-blue-600 hover:underline">
                        {partner.website}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>{partner.contact_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{partner.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={partner.partnership_type}
                      onChange={(e) => updateTier(partner.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs ${getTierColor(partner.partnership_type)}`}
                    >
                      <option value="none">None</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(partner.status)}`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{partner.total_spent} PLN</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {partner.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(partner.id, 'approved')}
                            className="px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(partner.id, 'rejected')}
                            className="px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {partner.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(partner.id, 'rejected')}
                          className="px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                        >
                          Revoke
                        </button>
                      )}
                      {partner.status === 'rejected' && (
                        <button
                          onClick={() => updateStatus(partner.id, 'approved')}
                          className="px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
