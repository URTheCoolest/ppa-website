export const metadata = {
  title: 'About - PPA',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center gap-2">
                <img src="/ppa-logo.png" alt="PPA Logo" className="h-8 w-auto" />
              </a>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
              <a href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About PPA</h1>
        
        <div className="prose max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Founded in 2026 and owned by AJ247Studios, PPA – People Press Agency is a modern, independent 
            photo and video agency delivering high-quality editorial, commercial, and stock media to media 
            outlets, brands, and businesses worldwide.
          </p>

          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-8">
            We connect talented photographers with media companies, brands, and organizations, offering reliable, 
            impactful imagery and video content while ensuring fair compensation and transparent licensing. 
            Our platform combines professionalism, security, and efficiency.
          </p>

          <h2 className="text-2xl font-bold mb-4">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 border rounded-lg">
              <h3 className="font-bold mb-2">For Photographers</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• 80% revenue share on every sale</li>
                <li>• Easy media upload and organization</li>
                <li>• Automatic folder creation by event</li>
                <li>• Real-time earnings tracking</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-bold mb-2">For Clients</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• High-quality editorial & stock media</li>
                <li>• Simple, secure licensing</li>
                <li>• Direct photographer requests</li>
                <li>• Professional watermark previews</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">Our Values</h2>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li><strong>Fair Compensation</strong> – Photographers receive 80% of every sale</li>
            <li><strong>Transparency</strong> – Clear pricing and licensing terms</li>
            <li><strong>Quality</strong> – Verified professional media only</li>
            <li><strong>Security</strong> – Protected transactions and data</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">Owned by AJ247Studios</h2>
          <p className="text-gray-700 mb-8">
            PPA is proud to be part of AJ247Studios, a company dedicated to supporting creative professionals 
            and delivering premium media solutions globally.
          </p>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-bold mb-2">Contact Us</h3>
            <p className="text-gray-700">
              Email: info@peoplepressagency.com<br />
              We're here to help with any questions about our platform or services.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
