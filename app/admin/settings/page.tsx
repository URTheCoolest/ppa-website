'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Setting {
  key: string
  value: string
  description: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

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
    loadSettings()
  }

  const loadSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .order('key')

    if (data) setSettings(data)
    setLoading(false)
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => 
      s.key === key ? { ...s, value } : s
    ))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      for (const setting of settings) {
        await supabase
          .from('settings')
          .update({ value: setting.value })
          .eq('key', setting.key)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const getSettingValue = (key: string) => {
    return settings.find(s => s.key === key)?.value || ''
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-8 w-auto" />
              </Link>
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-gray-600 dark:text-gray-300">Site Settings</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin/users" className="text-gray-600 dark:text-gray-300">Users</Link>
              <Link href="/admin/media" className="text-gray-600 dark:text-gray-300">Media</Link>
              <Link href="/admin/partners" className="text-gray-600 dark:text-gray-300">Partners</Link>
              <Link href="/admin/settings" className="text-blue-600 dark:text-blue-400">Settings</Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300">Logout</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Site Settings</h1>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 dark:text-white">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Site Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Site Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={getSettingValue('site_name')}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Site Tagline</label>
                  <input
                    type="text"
                    value={getSettingValue('site_tagline')}
                    onChange={(e) => updateSetting('site_tagline', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Pricing</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Stock Photo Price (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('photo_price')}
                    onChange={(e) => updateSetting('photo_price', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Photographer Share (%)</label>
                  <input
                    type="number"
                    value={getSettingValue('photographer_share')}
                    onChange={(e) => updateSetting('photographer_share', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Short Video HD (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_short_hd')}
                    onChange={(e) => updateSetting('video_base_short_hd', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Short Video 4K (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_short_4k')}
                    onChange={(e) => updateSetting('video_base_short_4k', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Medium Video HD (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_medium_hd')}
                    onChange={(e) => updateSetting('video_base_medium_hd', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Medium Video 4K (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_medium_4k')}
                    onChange={(e) => updateSetting('video_base_medium_4k', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Long Video HD (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_long_hd')}
                    onChange={(e) => updateSetting('video_base_long_hd', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 mb-1">Long Video 4K (PLN)</label>
                  <input
                    type="number"
                    value={getSettingValue('video_base_long_4k')}
                    onChange={(e) => updateSetting('video_base_long_4k', e.target.value)}
                    className="w-full p-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Partner Discounts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Partner Discounts</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium dark:text-white mb-2">Bronze</h3>
                  <p className="text-2xl font-bold text-orange-600">5%</p>
                  <p className="text-sm text-gray-500">Basic partnership</p>
                </div>
                <div className="p-4 border dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium dark:text-white mb-2">Silver</h3>
                  <p className="text-2xl font-bold text-gray-600">10%</p>
                  <p className="text-sm text-gray-500">500+ PLN monthly</p>
                </div>
                <div className="p-4 border dark:border-gray-600 rounded-lg">
                  <h3 className="font-medium dark:text-white mb-2">Gold</h3>
                  <p className="text-2xl font-bold text-yellow-600">15%</p>
                  <p className="text-sm text-gray-500">2000+ PLN monthly</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
