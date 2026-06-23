import { useState, type FormEvent } from 'react'
import { Check, ArrowRight, Building2, Globe, Mail, FileText, Shield, Star } from 'lucide-react'
import PageFrame from '../components/PageFrame'
import { supabase } from '../lib/supabase'

function PartnersInner() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    companyName: '',
    businessType: '',
    website: '',
    foundedYear: '',
    companySize: '',
    // Step 2: Contact
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: '',
    // Step 3: Product Info
    productCategories: [] as string[],
    productDescription: '',
    certifications: [] as string[],
    // Step 4: Quality & Testing
    testingMethods: [] as string[],
    ingredientsPolicy: '',
    packagingSustainability: '',
    // Step 5: Business Terms
    wholesaleMargin: '',
    minimumOrder: '',
    leadTime: '',
    shippingLocations: [] as string[],
    // Step 6: Additional
    whyPartner: '',
    otherInfo: '',
    agreeTerms: false
  })

  const businessTypes = ['Brand', 'Manufacturer', 'Distributor', 'Artisan/Small Batch']
  const companySizes = ['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees']
  const productCategories = ['Skincare', 'Haircare', 'Body Care', 'Fragrance', 'Wellness', 'Home', 'Other']
  const certificationsList = ['Organic Certified', 'Cruelty-Free', 'Vegan', 'Fair Trade', 'ISO Certified', 'GMP Certified', 'Other']
  const testingMethods = ['In-house lab', 'Third-party lab', 'Dermatologist tested', 'Clinical trials', 'Safety assessments']
  const shippingLocations = ['UAE', 'Pakistan', 'GCC', 'International']

  const toggleArray = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(v => v !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }))
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (step < 6) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const { error } = await supabase.from('partner_applications').insert({
        company_name: formData.companyName.trim(),
        business_type: formData.businessType.trim(),
        website: formData.website.trim(),
        founded_year: formData.foundedYear ? Number.parseInt(formData.foundedYear, 10) : null,
        company_size: formData.companySize.trim(),
        contact_name: formData.contactName.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        contact_role: formData.contactRole.trim(),
        product_categories: formData.productCategories,
        product_description: formData.productDescription.trim(),
        certifications: formData.certifications,
        testing_methods: formData.testingMethods,
        ingredients_policy: formData.ingredientsPolicy.trim(),
        packaging_sustainability: formData.packagingSustainability.trim(),
        wholesale_margin: formData.wholesaleMargin.trim(),
        minimum_order: formData.minimumOrder.trim(),
        lead_time: formData.leadTime.trim(),
        shipping_locations: formData.shippingLocations,
        why_partner: formData.whyPartner.trim(),
        other_info: formData.otherInfo.trim(),
        terms_accepted: formData.agreeTerms,
        terms_accepted_at: formData.agreeTerms ? new Date().toISOString() : null,
        status: 'submitted',
      })

      if (error) throw error

      setStep(7)
    } catch (error) {
      console.error('Partner application submission failed:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit partner application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 7) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-3xl mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-[#8DEBD1] flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-[#2b2b2b]" />
        </div>
        <h1 className="text-4xl font-light text-[#2b2b2b] mb-4">Application Received</h1>
        <p className="text-[#696a67] mb-8">
          Thank you for your interest in partnering with CareCraftz. Our team will review your application within 5-7 business days. We'll contact you at the email provided.
        </p>
        <button
          onClick={() => setStep(1)}
          className="bg-[#2b2b2b] text-white px-8 py-3 rounded-full font-semibold hover:bg-black transition-colors"
        >
          Submit Another Application
        </button>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto">

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-4">Partner With Us</h1>
        <p className="text-[#696a67] max-w-2xl mx-auto">
          We're selective about who joins our platform. Only rigorously tested, high-quality products make it to CareCraftz. If you meet our standards, we'd love to hear from you.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3, 4, 5, 6].map(s => (
          <div
            key={s}
            className={`h-1 rounded-full transition-all ${s <= step ? 'bg-[#2b2b2b]' : 'bg-gray-200'}`}
            style={{ width: s === step ? '48px' : '24px' }}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Building2 className="w-6 h-6" /> Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={e => updateField('companyName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Business Type *</label>
                <select
                  required
                  value={formData.businessType}
                  onChange={e => updateField('businessType', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                >
                  <option value="">Select type</option>
                  {businessTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Website *</label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={e => updateField('website', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Year Founded *</label>
                <input
                  type="number"
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={e => updateField('foundedYear', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Company Size *</label>
                <select
                  required
                  value={formData.companySize}
                  onChange={e => updateField('companySize', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                >
                  <option value="">Select size</option>
                  {companySizes.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Mail className="w-6 h-6" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={e => updateField('contactName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Role *</label>
                <input
                  type="text"
                  required
                  value={formData.contactRole}
                  onChange={e => updateField('contactRole', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={e => updateField('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={e => updateField('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Product Info */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Star className="w-6 h-6" /> Product Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Product Categories (select all that apply) *</label>
              <div className="flex flex-wrap gap-2">
                {productCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleArray('productCategories', cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      formData.productCategories.includes(cat)
                        ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                        : 'bg-white text-[#2b2b2b] border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {formData.productCategories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Product Description *</label>
              <textarea
                required
                rows={4}
                value={formData.productDescription}
                onChange={e => updateField('productDescription', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                placeholder="Describe your products, unique selling points, and target market..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Certifications (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {certificationsList.map(cert => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleArray('certifications', cert)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      formData.certifications.includes(cert)
                        ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                        : 'bg-white text-[#2b2b2b] border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {formData.certifications.includes(cert) && <Check className="w-3 h-3 inline mr-1" />}
                    {cert}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Quality & Testing */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Shield className="w-6 h-6" /> Quality & Testing
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Testing Methods (select all that apply) *</label>
              <div className="flex flex-wrap gap-2">
                {testingMethods.map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleArray('testingMethods', method)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      formData.testingMethods.includes(method)
                        ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                        : 'bg-white text-[#2b2b2b] border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {formData.testingMethods.includes(method) && <Check className="w-3 h-3 inline mr-1" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Ingredients Policy *</label>
              <textarea
                required
                rows={3}
                value={formData.ingredientsPolicy}
                onChange={e => updateField('ingredientsPolicy', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                placeholder="Describe your ingredient sourcing, restrictions, and quality standards..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Packaging Sustainability *</label>
              <textarea
                required
                rows={3}
                value={formData.packagingSustainability}
                onChange={e => updateField('packagingSustainability', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                placeholder="Describe your packaging materials and sustainability initiatives..."
              />
            </div>
          </div>
        )}

        {/* Step 5: Business Terms */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Globe className="w-6 h-6" /> Business Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Wholesale Margin (%) *</label>
                <input
                  type="number"
                  required
                  value={formData.wholesaleMargin}
                  onChange={e => updateField('wholesaleMargin', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Minimum Order Quantity *</label>
                <input
                  type="text"
                  required
                  value={formData.minimumOrder}
                  onChange={e => updateField('minimumOrder', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Lead Time (days) *</label>
                <input
                  type="number"
                  required
                  value={formData.leadTime}
                  onChange={e => updateField('leadTime', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Shipping Locations (select all) *</label>
                <div className="flex flex-wrap gap-2">
                  {shippingLocations.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleArray('shippingLocations', loc)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        formData.shippingLocations.includes(loc)
                          ? 'bg-[#2b2b2b] text-white border-[#2b2b2b]'
                          : 'bg-white text-[#2b2b2b] border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {formData.shippingLocations.includes(loc) && <Check className="w-3 h-3 inline mr-1" />}
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Additional */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <FileText className="w-6 h-6" /> Additional Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Why do you want to partner with CareCraftz? *</label>
              <textarea
                required
                rows={4}
                value={formData.whyPartner}
                onChange={e => updateField('whyPartner', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2b2b] mb-2">Any other information?</label>
              <textarea
                rows={3}
                value={formData.otherInfo}
                onChange={e => updateField('otherInfo', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2b2b2b] focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeTerms"
                required
                checked={formData.agreeTerms}
                onChange={e => updateField('agreeTerms', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300"
              />
              <label htmlFor="agreeTerms" className="text-sm text-[#696a67]">
                I confirm that all information provided is accurate and I agree to CareCraftz's partner terms and quality standards. I understand that only products meeting rigorous quality and testing requirements will be accepted.
              </label>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-3 rounded-full border border-gray-300 text-[#2b2b2b] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Back
          </button>
          {step < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 rounded-full bg-[#2b2b2b] text-white font-medium hover:bg-black transition-colors flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full bg-[#2b2b2b] text-white font-medium hover:bg-black transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : <>Submit Application <Check className="w-4 h-4" /></>}
            </button>
          )}
        </div>

      </form>

    </div>
  )
}

export default function Partners() {
  return (
    <PageFrame frameColor="#E8A4E0" showFooter={true}>
      <PartnersInner />
    </PageFrame>
  )
}
