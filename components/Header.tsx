'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'
import { Menu, X, User, Settings, LogOut, Upload } from 'lucide-react'

interface HeaderProps {
  currentPage?: string
  showNav?: boolean
  showUserMenu?: boolean
}

export default function Header({ currentPage, showNav = false, showUserMenu = true }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="w-10" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/ppa-logo.png" alt="PPA Logo" className="h-10 w-auto" />
            </Link>
            
            {/* Desktop Navigation */}
            {showNav && user && (
              <nav className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                <Link 
                  href="/portal/browse" 
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'browse' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Photos
                </Link>
                <Link 
                  href="/portal/browse?type=video" 
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'videos' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Videos
                </Link>
                <Link 
                  href="/portal/my-requests" 
                  className={`text-sm font-medium transition-colors ${
                    currentPage === 'requests' 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  My Requests
                </Link>
              </nav>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {showUserMenu && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </button>
                    
                    {userMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setUserMenuOpen(false)} 
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {profile?.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                            {profile?.photographer_id && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {profile.photographer_id}
                              </p>
                            )}
                          </div>
                          
                          {profile?.role === 'photographer' && (
                            <>
                              <Link 
                                href="/photographer"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <User className="w-4 h-4" />
                                Photographer Dashboard
                              </Link>
                              <Link 
                                href="/photographer/upload"
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Upload className="w-4 h-4" />
                                Upload Media
                              </Link>
                            </>
                          )}
                          
                          {profile?.role === 'admin' && (
                            <Link 
                              href="/admin"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4" />
                              Admin Panel
                            </Link>
                          )}
                          
                          <Link 
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link 
                      href="/login"
                      className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/signup"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && showNav && user && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <Link 
                href="/portal/browse" 
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Photos
              </Link>
              <Link 
                href="/portal/browse?type=video" 
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Videos
              </Link>
              <Link 
                href="/portal/my-requests" 
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                My Requests
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
