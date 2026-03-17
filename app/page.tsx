'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { Search, Camera, Video, Users, Star, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      {/* ========================================
          NAVBAR
      ======================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                  People Press Agency
                </span>
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/portal/browse" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                Photos
              </Link>
              <Link href="/portal/browse?type=video" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                Videos
              </Link>
              <Link href="/photographers" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                Photographers
              </Link>
              <Link href="/partners" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                Partners
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Search Icon */}
              <Link 
                href="/portal/browse"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Login */}
              <Link 
                href="/login" 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium hidden sm:block"
              >
                Login
              </Link>

              {/* CTA Button */}
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================
          HERO SECTION (Cinematic)
      ======================================== */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80")',
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Premium Photo & Video
            <span className="block text-blue-400 mt-2">From World-Class Photographers</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Access high-quality editorial and commercial media from verified professionals. 
            Simple licensing, instant delivery, fair compensation for creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/portal/browse"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              Browse Photos
            </Link>
            <Link
              href="/portal/browse?type=video"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105"
            >
              <Video className="w-5 h-5" />
              Browse Videos
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-gray-300">Photos & Videos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-300">Photographers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">80%</div>
              <div className="text-sm text-gray-300">Creator Revenue</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* ========================================
          SEARCH / FILTERS SECTION
      ======================================== */}
      <section className="py-12 bg-gray-50 dark:bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search photos, videos, photographers..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select className="px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Categories</option>
                <option>Editorial</option>
                <option>Commercial</option>
                <option>Stock</option>
              </select>
              <select className="px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Types</option>
                <option>Photos</option>
                <option>Videos</option>
              </select>
              <Link
                href="/portal/browse"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-medium transition-colors whitespace-nowrap"
              >
                Search
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          TRUSTED BY SECTION
      ======================================== */}
      <section className="py-16 bg-white dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
            <img src="/trusted-logos/aj247smedia.jpg" alt="AJ247s Media" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
            <img src="/trusted-logos/fox-photography.jpg" alt="Fox Photography" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
            <img src="/trusted-logos/mjak-maloposka.jpg" alt="Mjak Maloposka" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
            <img src="/trusted-logos/red-light.jpg" alt="Red Light Media" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
            <img src="/trusted-logos/rnr.jpg" alt="RnR" className="h-12 w-auto grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100" />
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURED CATEGORIES
      ======================================== */}
      <section className="py-20 bg-gray-50 dark:bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Our Collections
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Browse thousands of high-quality images and videos across various categories
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Category 1 */}
            <Link href="/portal/browse?category=nature" className="group relative h-80 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80")' }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Nature & Landscapes</h3>
                <p className="text-gray-200">Breathtaking scenery from around the world</p>
              </div>
            </Link>

            {/* Category 2 */}
            <Link href="/portal/browse?category=business" className="group relative h-80 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80")' }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Business & Corporate</h3>
                <p className="text-gray-200">Professional imagery for your brand</p>
              </div>
            </Link>

            {/* Category 3 */}
            <Link href="/portal/browse?category=people" className="group relative h-80 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80")' }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <h3 className="text-2xl font-bold text-white mb-2">People & Lifestyle</h3>
                <p className="text-gray-200">Authentic moments and human stories</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          FEATURES SECTION
      ======================================== */}
      <section className="py-20 bg-white dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose PPA?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're building the future of stock media with fairness and quality at our core
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Quality Media</h3>
              <p className="text-gray-600 dark:text-gray-300">
                High-resolution editorial and commercial photos and videos from verified professional photographers. Every piece is curated for excellence.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Fair Compensation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Photographers receive 80% of every sale. Transparent revenue sharing with no hidden fees. Your work deserves fair pay.
              </p>
            </div>
            
            <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#1E1E1E] hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Secure Licensing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple, secure licensing process with clear usage rights and instant delivery after approval. Buy with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PHOTOGRAPHER SPOTLIGHT
      ======================================== */}
      <section className="py-20 bg-gray-50 dark:bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Meet Our Photographers
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Talented creators behind the lens
              </p>
            </div>
            <Link
              href="/photographers"
              className="hidden md:inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:gap-3 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Photographer 1 */}
            <div className="group bg-white dark:bg-[#2A2A2A] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">AJ</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold dark:text-white">Alex Johnson</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Landscape & Nature</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium dark:text-white">4.9</span>
                  <span className="text-sm text-gray-400">(127 photos)</span>
                </div>
              </div>
            </div>

            {/* Photographer 2 */}
            <div className="group bg-white dark:bg-[#2A2A2A] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-orange-400 to-red-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">SM</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold dark:text-white">Sarah Miller</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Portrait & Lifestyle</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium dark:text-white">4.8</span>
                  <span className="text-sm text-gray-400">(89 photos)</span>
                </div>
              </div>
            </div>

            {/* Photographer 3 */}
            <div className="group bg-white dark:bg-[#2A2A2A] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-green-400 to-teal-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">MC</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold dark:text-white">Mike Chen</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Business & Corporate</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium dark:text-white">4.7</span>
                  <span className="text-sm text-gray-400">(156 photos)</span>
                </div>
              </div>
            </div>

            {/* Photographer 4 */}
            <div className="group bg-white dark:bg-[#2A2A2A] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="aspect-square bg-gradient-to-br from-pink-400 to-rose-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">EW</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold dark:text-white">Emma Wilson</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Events & Weddings</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium dark:text-white">4.9</span>
                  <span className="text-sm text-gray-400">(203 photos)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/photographers"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
            >
              View All Photographers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          PRICING SECTION
      ======================================== */}
      <section className="py-20 bg-white dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Pay only for what you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-[#1E1E1E] hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold dark:text-white">Stock Photos</h3>
              </div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                20 PLN<span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/image</span>
              </p>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 mt-6">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  High-resolution delivery
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Multiple usage types
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Instant download after approval
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Commercial & editorial use
                </li>
              </ul>
            </div>
            
            <div className="p-8 border-2 border-blue-500 rounded-2xl bg-white dark:bg-[#1E1E1E] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold dark:text-white">Stock Videos</h3>
              </div>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                From 50 PLN<span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/video</span>
              </p>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 mt-6">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  HD & 4K available
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Duration-based pricing
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Custom usage licensing
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Bulk discounts available
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA SECTION
      ======================================== */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join PPA today and access premium media or start selling your photography.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/about"
              className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          FOOTER
      ======================================== */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="text-xl font-bold">PPA</span>
              </div>
              <p className="text-gray-400 text-sm">
                People Press Agency - Premium Photo & Video Agency connecting talented photographers with media companies worldwide.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/portal/browse" className="hover:text-white transition-colors">Browse Photos</Link></li>
                <li><Link href="/portal/browse?type=video" className="hover:text-white transition-colors">Browse Videos</Link></li>
                <li><Link href="/photographers" className="hover:text-white transition-colors">Photographers</Link></li>
                <li><Link href="/partners" className="hover:text-white transition-colors">Partners</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/licensing" className="hover:text-white transition-colors">Licensing Info</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@peoplepressagency.com</li>
                <li>support@peoplepressagency.com</li>
                <li className="pt-2">
                  <span className="text-sm">Based in Poland</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2026 PPA - People Press Agency. Owned by AJ247Studios.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
