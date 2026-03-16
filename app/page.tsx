'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <img src="/images/logo.png" alt="PPA" className="h-10" />
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                About
              </Link>
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Login
              </Link>
              <ThemeToggle />
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Premium Photo & Video Agency
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Connecting talented photographers with media companies, brands, and businesses worldwide. 
              High-quality editorial and stock media with transparent licensing.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/signup?role=client"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
              >
                I'm a Client
              </Link>
              <Link
                href="/signup?role=photographer"
                className="border border-blue-600 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg text-lg hover:bg-blue-50 dark:hover:bg-gray-800"
              >
                I'm a Photographer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose PPA?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <div className="text-blue-600 text-4xl mb-4">📷</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Quality Media</h3>
              <p className="text-gray-600 dark:text-gray-300">
                High-resolution editorial and commercial photos and videos from verified professional photographers.
              </p>
            </div>
            <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <div className="text-blue-600 text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Fair Compensation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Photographers receive 80% of every sale. Transparent revenue sharing with no hidden fees.
              </p>
            </div>
            <div className="p-6 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <div className="text-blue-600 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Secure Licensing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple, secure licensing process with clear usage rights and instant delivery after approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 border dark:border-gray-700 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 dark:text-white">Stock Photos</h3>
              <p className="text-4xl font-bold text-blue-600 mb-4">20 PLN<span className="text-lg text-gray-500 dark:text-gray-400">/image</span></p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✓ High-resolution delivery</li>
                <li>✓ Multiple usage types</li>
                <li>✓ Instant download after approval</li>
                <li>✓ Commercial & editorial use</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 border dark:border-gray-700 rounded-lg">
              <h3 className="text-2xl font-bold mb-4 dark:text-white">Stock Videos</h3>
              <p className="text-4xl font-bold text-blue-600 mb-4">From 50 PLN<span className="text-lg text-gray-500 dark:text-gray-400">/video</span></p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>✓ HD & 4K available</li>
                <li>✓ Duration-based pricing</li>
                <li>✓ Custom usage licensing</li>
                <li>✓ Bulk discounts available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join PPA today and access premium media or start selling your photography.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg text-lg hover:bg-gray-100"
            >
              Create Account
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PPA</h3>
              <p className="text-gray-400">People Press Agency</p>
              <p className="text-gray-400 text-sm">Premium Photo & Video Agency</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/services" className="hover:text-white">Services</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">info@peoplepressagency.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 PPA - People Press Agency. Owned by AJ247Studios.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
