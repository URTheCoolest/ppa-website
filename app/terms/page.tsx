export const metadata = {
  title: 'Terms & Conditions - PPA',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-blue-600">PPA</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using PPA (People Press Agency), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-gray-700">
              PPA is a platform connecting photographers with media companies, brands, and businesses. 
              We provide licensing services for photos and videos, facilitating transactions between content creators (photographers) 
              and clients seeking to license media.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">
              Users must register for an account to access certain features. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">4. Photographer Terms</h2>
            <p className="text-gray-700 mb-4">
              By uploading media to PPA, photographers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Represent and warrant they own the rights to the uploaded content</li>
              <li>Grant PPA a license to display, distribute, and license the content</li>
              <li>Agree to the 80/20 revenue split (photographer receives 80% of each sale)</li>
              <li>Accept that all media requires admin approval before being listed</li>
              <li>Must comply with all relevant laws regarding content creation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">5. Client Licensing</h2>
            <p className="text-gray-700 mb-4">
              When licensing media from PPA:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Clients receive a license for specific usage as outlined in their request</li>
              <li>All licenses are subject to approval and payment</li>
              <li>High-resolution files are delivered after payment is confirmed</li>
              <li>Licenses are non-transferable</li>
              <li>Usage must comply with the stated license type (editorial, commercial, etc.)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">6. Pricing and Payment</h2>
            <p className="text-gray-700">
              Stock photos are priced at 20 PLN per image. Video pricing varies based on duration, resolution, and usage. 
              All prices are subject to change with notice. Payment is processed through our platform, and clients agree to 
              pay all fees associated with their purchases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on PPA, including but not limited to text, graphics, logos, and media, is the property of PPA 
              or its photographers and is protected by copyright laws. Users may not reproduce, distribute, or modify 
              any content without explicit permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700">
              PPA provides the platform "as is" without any warranties. We do not guarantee the accuracy of content 
              uploaded by photographers. PPA shall not be liable for any indirect, incidental, or consequential damages 
              arising from the use of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">9. Termination</h2>
            <p className="text-gray-700">
              We reserve the right to terminate user accounts for violation of these terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">10. Contact</h2>
            <p className="text-gray-700">
              For questions about these Terms & Conditions, contact us at: info@peoplepressagency.com
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
