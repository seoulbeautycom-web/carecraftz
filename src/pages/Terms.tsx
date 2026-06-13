import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-light mb-8">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: June 14, 2026</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-medium mb-4">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using CareCraftz&apos;s website and services, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">2. Description of Services</h2>
            <p className="leading-relaxed">
              CareCraftz provides an online platform for purchasing beauty and skincare products. 
              We reserve the right to modify, suspend, or discontinue any part of our services at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">3. Account Registration</h2>
            <p className="leading-relaxed mb-4">
              To access certain features, you may need to create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">4. Ordering and Payment</h2>
            <p className="leading-relaxed mb-4">
              When you place an order:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You agree to pay all charges at the prices in effect when you place your order</li>
              <li>We reserve the right to refuse or cancel any order for any reason</li>
              <li>Prices are subject to change without notice</li>
              <li>All payments are processed securely through our payment providers</li>
              <li>Product availability is subject to change</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">5. Shipping and Delivery</h2>
            <p className="leading-relaxed mb-4">
              Shipping terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Risk of loss transfers upon delivery to the carrier</li>
              <li>You are responsible for providing accurate shipping information</li>
              <li>Additional duties and taxes may apply for international orders</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">6. Returns and Refunds</h2>
            <p className="leading-relaxed mb-4">
              Our return policy:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Items may be returned within 30 days of delivery</li>
              <li>Products must be unused and in original packaging</li>
              <li>Refunds will be processed within 7-14 business days</li>
              <li>Shipping costs for returns are the customer&apos;s responsibility unless the item is defective</li>
              <li>Sale items are final and non-refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content on our website, including text, graphics, logos, images, and software, is the property of CareCraftz 
              or its licensors and is protected by copyright and other intellectual property laws. 
              You may not use, reproduce, or distribute any content without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">8. Prohibited Activities</h2>
            <p className="leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use our services for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with other users&apos; access to our services</li>
              <li>Submit false or misleading information</li>
              <li>Engage in fraudulent transactions</li>
              <li>Harvest or collect user information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">9. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              Our services are provided &quot;as is&quot; without any warranties, express or implied. 
              We do not guarantee that our services will be uninterrupted, timely, secure, or error-free. 
              Product descriptions are for informational purposes only and are not guaranteed to be accurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">10. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, CareCraftz shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising from your use of our services. 
              Our total liability shall not exceed the amount you paid for the products or services giving rise to the liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">11. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify and hold harmless CareCraftz and its officers, directors, employees, 
              and agents from any claims, damages, losses, or expenses arising from your use of our services 
              or violation of these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">12. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. 
              Any disputes shall be resolved in the courts of Dubai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">13. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. 
              Your continued use of our services after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium mb-4">14. Contact Information</h2>
            <p className="leading-relaxed">
              For questions about these Terms, please contact us:
            </p>
            <p className="mt-4">
              Email: <a href="mailto:legal@carecraftz.com" className="text-blue-600 hover:underline">legal@carecraftz.com</a>
            </p>
            <p className="mt-2">
              Address: Dubai, United Arab Emirates
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
