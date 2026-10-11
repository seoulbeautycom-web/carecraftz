import { useState, type FormEvent } from 'react'
import { Check, ArrowRight, Building2, Globe, Mail, FileText, Shield, Star, Upload } from 'lucide-react'
import PageFrame from '../components/PageFrame'
import { supabase } from '../lib/supabase'

type DocType = 'business_license' | 'certifications' | 'lab_reports'

const REQUIRED_DOCS: { type: DocType; label: string; help: string }[] = [
  { type: 'business_license', label: 'Business license', help: 'Trade license or company registration (PDF or image)' },
  { type: 'certifications', label: 'Certifications', help: 'Organic, cruelty-free, GMP, or similar certificates' },
  { type: 'lab_reports', label: 'Lab / testing reports', help: 'Safety assessments or third-party lab results' },
]

function PartnersInner() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [documents, setDocuments] = useState<Partial<Record<DocType, File | null>>>({
    business_license: null,
    certifications: null,
    lab_reports: null,
  })
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
    // Step 6: Additional + docs
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

    const missingDocs = REQUIRED_DOCS.filter((doc) => !documents[doc.type])
    if (missingDocs.length > 0) {
      setSubmitError(`Please upload: ${missingDocs.map((d) => d.label).join(', ')}.`)
      setIsSubmitting(false)
      return
    }

    try {
      const { data: application, error } = await supabase.from('partner_applications').insert({
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
      }).select('id').single()

      if (error) throw error
      if (!application?.id) throw new Error('Application was created but no id was returned.')

      for (const doc of REQUIRED_DOCS) {
        const file = documents[doc.type]
        if (!file) continue

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `applications/${application.id}/${doc.type}_${Date.now()}_${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('partner-documents')
          .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })

        if (uploadError) throw uploadError

        const { error: docError } = await supabase.from('partner_application_documents').insert({
          application_id: application.id,
          document_type: doc.type,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
        })

        if (docError) throw docError
      }

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
        <h1 className="text-4xl md:text-5xl font-light text-[#2b2b2b] mb-4">Sell on CareCraftz</h1>
        <p className="text-[#696a67] max-w-2xl mx-auto mb-6">
          CareCraftz is a trusted skincare marketplace. We verify every seller before products go live. Submit your credentials and evidence — our team reviews business identity, formula safety, claims accuracy, packaging, and documentation.
        </p>
        <ul className="text-left max-w-xl mx-auto text-sm text-[#696a67] space-y-2 bg-white/60 border border-[#2b2b2b]/10 rounded-2xl px-5 py-4">
          <li><span className="font-semibold text-[#2b2b2b]">1.</span> Business identity &amp; license</li>
          <li><span className="font-semibold text-[#2b2b2b]">2.</span> Formula safety &amp; testing methods</li>
          <li><span className="font-semibold text-[#2b2b2b]">3.</span> Claims accuracy vs product evidence</li>
          <li><span className="font-semibold text-[#2b2b2b]">4.</span> Packaging &amp; sustainability standards</li>
          <li><span className="font-semibold text-[#2b2b2b]">5.</span> Required documents (license, certs, lab reports)</li>
        </ul>
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

        {/* Step 6: Documents + Additional */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2">
              <Upload className="w-6 h-6" /> Verification Documents
            </h2>
            <p className="text-sm text-[#696a67]">
              Upload evidence for our verification checklist. All three document types are required before we can review your application.
            </p>
            <div className="space-y-4">
              {REQUIRED_DOCS.map((doc) => {
                const file = documents[doc.type]
                return (
                  <div key={doc.type} className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <label className="block text-sm font-medium text-[#2b2b2b] mb-1">{doc.label} *</label>
                    <p className="text-xs text-[#696a67] mb-3">{doc.help}</p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
                      required={!file}
                      onChange={(e) => {
                        const next = e.target.files?.[0] ?? null
                        setDocuments((prev) => ({ ...prev, [doc.type]: next }))
                      }}
                      className="block w-full text-sm text-[#696a67] file:mr-4 file:rounded-full file:border-0 file:bg-[#2b2b2b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
                    />
                    {file ? (
                      <p className="mt-2 text-xs font-medium text-emerald-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {file.name}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <h2 className="text-2xl font-semibold text-[#2b2b2b] flex items-center gap-2 pt-2">
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
                I confirm that all information and documents are accurate and I agree to CareCraftz&apos;s partner terms, quality standards, and authenticity verification process. Only sellers who pass our checklist may list products.
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
