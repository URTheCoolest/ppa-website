'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: 'client' | 'photographer' | 'admin'
  photographer_id: string | null
  is_approved: boolean
  total_earnings: number
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'client' | 'photographer' | 'admin'>('all')
  const [search, setSearch] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    loadUsers()
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

  const loadUsers = async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('role', filter)
    }

    const { data } = await query
    if (data) setUsers(data)
    setLoading(false)
  }

  const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: role })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role: ' + error.message)
    } else {
      loadUsers()
    }
  }

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', userId)
    loadUsers()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'photographer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-2xl font-bold text-blue-600">PPA</Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-600 dark:text-gray-300">Manage Users</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin/users" className="text-blue-600 dark:text-blue-400">Users</Link>
              <Link href="/admin/media" className="text-gray-600 dark:text-gray-300">Media</Link>
              <Link href="/admin/partners" className="text-gray-600 dark:text-gray-300">Partners</Link>
              <Link href="/admin/settings" className="text-gray-600 dark:text-gray-300">Settings</Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300">Logout</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Users</h1>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {(['all', 'client', 'photographer', 'admin'] as const).map(f => (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Photographer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center dark:text-white">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center dark:text-white">No users found</td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="dark:text-white">
                  <td className="px-6 py-4">
                    <div>{user.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'photographer' ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${user.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{user.photographer_id || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.role !== 'admin' && (
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-sm border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value="client">Client</option>
                          <option value="photographer">Photographer</option>
                        </select>
                      )}
                      {user.role === 'photographer' && (
                        <button
                          onClick={() => toggleApproval(user.id, user.is_approved)}
                          className={`px-2 py-1 rounded text-xs ${user.is_approved ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {user.is_approved ? 'Revoke' : 'Approve'}
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
