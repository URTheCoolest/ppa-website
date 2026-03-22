export const metadata = {
  title: 'Privacy Policy - PPA',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src="/ppa-logo.png" alt="PPA Logo" className="h-8 w-auto" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700">
              At PPA (People Press Agency), we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our platform. By accessing PPA, you agree to 
              this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Name and email address (account registration)</li>
              <li>Profile information (photographer bio, portfolio URL)</li>
              <li>Payment information (processed securely through third parties)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-semibold mb-2">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Browser type and device information</li>
              <li>IP address and usage data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process transactions and send related information</li>
              <li>Verify identity and approve photographer accounts</li>
              <li>Communicate with you about updates, support, and promotional offers</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Service providers who assist in our operations</li>
              <li>Payment processors for transaction handling</li>
              <li>Other users as necessary (e.g., photographer profiles visible to clients)</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">5. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your personal information, 
              including encryption, access controls, and regular security assessments. However, no method of transmission 
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-gray-700 mb-4">Under GDPR and similar regulations, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access</strong> - Request a copy of your personal data</li>
              <li><strong>Rectification</strong> - Request correction of inaccurate data</li>
              <li><strong>Erasure</strong> - Request deletion of your personal data ("right to be forgotten")</li>
              <li><strong>Restriction</strong> - Request limitation of processing</li>
              <li><strong>Portability</strong> - Request your data in a portable format</li>
              <li><strong>Objection</strong> - Object to processing for certain purposes</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at info@peoplepressagency.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as your account is active, or as needed to provide services. 
              We will delete or anonymize your data upon account deletion, except where we are legally required to retain it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">8. Cookies</h2>
            <p className="text-gray-700">
              We use cookies and similar tracking technologies to enhance your experience. You can control cookies 
              through your browser settings. Disabling cookies may affect certain features of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites. We are not responsible for the privacy 
              practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not intended for individuals under 16 years of age. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. We will notify you of any material changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-gray-700">
              For questions about this Privacy Policy, contact us at: info@peoplepressagency.com
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
