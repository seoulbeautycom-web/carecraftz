import { Link } from 'react-router-dom'
import PageFrame from '../components/PageFrame'

function PrivacyInner() {
  return (
    <div>
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-light mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: June 14, 2026</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-medium mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              CareCraftz (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
              and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">2. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, billing and shipping address</li>
              <li><strong>Payment Information:</strong> Credit card details (processed securely by our payment providers)</li>
              <li><strong>Order Information:</strong> Products purchased, order history, preferences</li>
              <li><strong>Usage Data:</strong> IP address, browser type, pages visited, time spent on pages</li>
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our products and services</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">4. Information Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Service Providers:</strong> Payment processors, shipping carriers, email service providers</li>
              <li><strong>Business Partners:</strong> With your consent or as necessary to provide services</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">5. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">6. Your Rights</h2>
            <p className="leading-relaxed mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Request restriction of processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">7. Cookies</h2>
            <p className="leading-relaxed">
              We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. 
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">8. Third-Party Links</h2>
            <p className="leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites. 
              We encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">9. Children&apos;s Privacy</h2>
            <p className="leading-relaxed">
              Our services are not intended for individuals under 16 years of age. We do not knowingly collect personal information 
              from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">10. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-4">
              Email: <a href="mailto:privacy@carecraftz.com" className="text-blue-600 hover:underline">privacy@carecraftz.com</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

    </div>
  )
}

export default function Privacy() {
  return (
    <PageFrame frameColor="#D4B896">
      <PrivacyInner />
    </PageFrame>
  )
}
