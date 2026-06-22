import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, X, Plus, Trash2, Upload, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Product {
  id?: string
  name: string
  subtitle: string
  description: string
  how_to_use: string
  ingredients: string
  brand_name: string
  brand_logo: string
  seller_name: string
  price: number
  price_pkr: number | null
  price_aed: number | null
  compare_at_price: number | null
  inventory: number
  low_stock_threshold: number
  category: string
  location: string
  delivery_charge: number
  images: string[]
  is_active: boolean
  is_featured: boolean
  sku: string
  weight: number | null
  discount_percent: number
  tag1: string
  tag2: string
  skin_type: string
}

interface ProductSection {
  id?: string
  section_type: 'manifesto' | 'breakdown'
  sort_order: number
  manifesto_title: string
  manifesto_body: string
  breakdown_title: string
  breakdown_body: string
  breakdown_image: string
  breakdown_left_image: string
  _uploading?: boolean
}

interface BlogPost {
  id: string
  title: string
  slug: string
}

interface Review {
  id: string
  customer_name: string
  rating: number
  review_text: string
  is_approved: boolean
  is_verified_purchase: boolean
  created_at: string
}

interface Props {
  product?: Product & { id: string }
  onClose: () => void
  onSaved: (productId?: string) => void
  layout?: 'modal' | 'page'
  closeOnSave?: boolean
}

type ModalTab = 'basics' | 'branding' | 'details' | 'sections' | 'blog' | 'reviews'

const TABS: { key: ModalTab; label: string }[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'branding', label: 'Branding' },
  { key: 'details', label: 'How To Use & Ingredients' },
  { key: 'sections', label: 'Page Sections' },
  { key: 'blog', label: 'Blog Assignment' },
  { key: 'reviews', label: 'Reviews' },
]

const EMPTY_PRODUCT: Product = {
  name: '', subtitle: '', description: '', how_to_use: '', ingredients: '',
  brand_name: '', brand_logo: '', seller_name: '',
  price: 0, price_pkr: null, price_aed: null, compare_at_price: null,
  inventory: 0, low_stock_threshold: 10, category: '', location: 'UAE',
  delivery_charge: 0, images: [], is_active: true, is_featured: false,
  sku: '', weight: null, discount_percent: 0, tag1: '', tag2: '', skin_type: '',
}

const buildProductForm = (product?: Partial<Product> & { id?: string }): Product => ({
  ...EMPTY_PRODUCT,
  ...product,
  name: product?.name || '',
  subtitle: product?.subtitle || '',
  description: product?.description || '',
  how_to_use: product?.how_to_use || '',
  ingredients: product?.ingredients || '',
  brand_name: product?.brand_name || '',
  brand_logo: product?.brand_logo || '',
  seller_name: product?.seller_name || '',
  category: product?.category || '',
  location: product?.location || 'UAE',
  sku: product?.sku || '',
  tag1: product?.tag1 || '',
  tag2: product?.tag2 || '',
  skin_type: product?.skin_type || '',
  images: Array.isArray(product?.images) ? product.images : [],
})

type SupabaseErrorLike = {
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | number | null
}

type ProductSaveStage = 'product details' | 'page sections' | 'blog assignment'

const cleanErrorText = (value?: string | null) => (value || '').trim()

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error.trim()
  if (error instanceof Error) return error.message.trim()

  if (error && typeof error === 'object') {
    const typedError = error as SupabaseErrorLike
    return [typedError.message, typedError.details, typedError.hint]
      .map(cleanErrorText)
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  return ''
}

const getFriendlyProductError = (error: unknown): string => {
  const message = extractErrorMessage(error)
  const lowerMessage = message.toLowerCase()
  const code = error && typeof error === 'object' ? String((error as SupabaseErrorLike).code ?? '') : ''

  if (!message) {
    return 'Please try again in a moment.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('networkerror') ||
    lowerMessage.includes('network request failed')
  ) {
    return 'The app could not reach the server. Please check your internet connection and try again.'
  }

  if (
    code === '42501' ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('rls')
  ) {
    return "Your account does not have permission to save products right now. Please sign in with an admin account and try again."
  }

  if (code === '23505' || lowerMessage.includes('duplicate key') || lowerMessage.includes('already exists')) {
    if (lowerMessage.includes('sku') || lowerMessage.includes('products_sku')) {
      return 'That SKU is already being used by another product. Please choose a different SKU.'
    }

    if (lowerMessage.includes('slug')) {
      return 'That slug is already being used. Please choose a different value.'
    }

    return 'One of the values you entered is already in use. Please change the duplicate field and try again.'
  }

  if (code === '23502' || lowerMessage.includes('null value in column') || lowerMessage.includes('violates not-null constraint')) {
    return 'Please fill in the missing required fields before saving.'
  }

  if (code === '23503' || lowerMessage.includes('foreign key')) {
    return 'One of the linked records could not be found. Please refresh the page and try again.'
  }

  if (lowerMessage.includes('violates check constraint') || lowerMessage.includes('check constraint')) {
    if (lowerMessage.includes('skin_type')) {
      return 'Please pick a valid skin type or leave it blank.'
    }

    return 'One of the values you selected is not allowed. Please review the form and try again.'
  }

  if (lowerMessage.includes('no product id after save')) {
    return 'The product was saved, but the app could not confirm the new product ID. Please refresh and try again.'
  }

  if (lowerMessage.includes('relation "') && lowerMessage.includes('does not exist')) {
    return 'A required database table is missing. Please contact support or run the latest database migration.'
  }

  if (lowerMessage.includes('invalid input syntax') || lowerMessage.includes('cannot cast') || lowerMessage.includes('parse')) {
    return 'One of the numbers or fields contains an invalid value. Please check prices, stock, and any numeric fields.'
  }

  if (lowerMessage.includes('storage') || lowerMessage.includes('upload')) {
    return 'A file upload failed. Please try a smaller image or upload again.'
  }

  const looksTechnical = /(postgres|postgrest|sql|rpc|uuid|constraint|relation|foreign key|null value|duplicate key|syntax error)/i.test(message)
  return looksTechnical ? 'Something went wrong while saving. Please try again.' : message
}

const buildProductSaveErrorMessage = (stage: ProductSaveStage, error: unknown, productWasSaved: boolean): string => {
  const reason = getFriendlyProductError(error)

  if (stage === 'product details') {
    return `We couldn't save the product details. ${reason}`
  }

  if (productWasSaved) {
    return `The product details were saved, but the ${stage} could not be updated. ${reason}`
  }

  return `We couldn't save the ${stage}. ${reason}`
}

const buildProductUploadErrorMessage = (label: string, error: unknown): string => {
  const reason = getFriendlyProductError(error)
  return `We couldn't upload the ${label}. ${reason}`
}

export default function ProductModal({ product, onClose, onSaved, layout = 'modal', closeOnSave = true }: Props) {
  const isPageLayout = layout === 'page'
  const [activeTab, setActiveTab] = useState<ModalTab>('basics')
  const [form, setForm] = useState<Product>(buildProductForm(product))
  const [sections, setSections] = useState<ProductSection[]>([])
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([])
  const [assignedBlogId, setAssignedBlogId] = useState<string>('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [brandLogoUploading, setBrandLogoUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const brandLogoInputRef = useRef<HTMLInputElement>(null)

  const fetchBlogPosts = useCallback(async () => {
    const { data } = await supabase.from('blog_posts').select('id,title,slug').eq('status', 'published').order('title')
    setAllBlogPosts(data || [])
  }, [])

  const fetchSections = useCallback(async (productId: string) => {
    const { data } = await supabase.from('product_sections').select('*').eq('product_id', productId).order('sort_order')
    setSections((data || []).map((s: ProductSection) => ({
      ...s,
      manifesto_title: s.manifesto_title || '',
      manifesto_body: s.manifesto_body || '',
      breakdown_title: s.breakdown_title || '',
      breakdown_body: s.breakdown_body || '',
      breakdown_image: s.breakdown_image || '',
      breakdown_left_image: s.breakdown_left_image || '',
    })))
  }, [])

  const fetchBlogAssignment = useCallback(async (productId: string) => {
    const { data } = await supabase.from('product_blog_assignments').select('blog_post_id').eq('product_id', productId).maybeSingle()
    if (data?.blog_post_id) setAssignedBlogId(data.blog_post_id)
  }, [])

  const fetchReviews = useCallback(async (productId: string) => {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false })
    setReviews(data || [])
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setImageUploading(true)
    const uploaded: string[] = []
    let uploadError: unknown = null

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('product-images').upload(path, file)

        if (error) {
          uploadError = error
          break
        }

        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }

      setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))

      if (uploadError) {
        throw uploadError
      }
    } catch (uploadError) {
      setError(buildProductUploadErrorMessage('product image', uploadError))
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setBrandLogoUploading(true)
    setError('')

    try {
      const ext = file.name.split('.').pop()
      const path = `product-branding/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm((current) => ({ ...current, brand_logo: data.publicUrl }))
    } catch (uploadError) {
      setError(buildProductUploadErrorMessage('brand logo', uploadError))
    } finally {
      setBrandLogoUploading(false)
      if (brandLogoInputRef.current) brandLogoInputRef.current.value = ''
    }
  }

  const handleSectionImageUpload = async (idx: number, field: 'breakdown_image' | 'breakdown_left_image', file: File) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, _uploading: true } : s))
    try {
      const ext = file.name.split('.').pop()
      const path = `product-sections/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)

      if (error) {
        throw error
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: data.publicUrl, _uploading: false } : s))
    } catch (uploadError) {
      setSections(prev => prev.map((s, i) => i === idx ? { ...s, _uploading: false } : s))
      setError(buildProductUploadErrorMessage('section image', uploadError))
    }
  }

  const addSection = (type: 'manifesto' | 'breakdown') => {
    setSections(prev => [...prev, {
      section_type: type,
      sort_order: prev.length,
      manifesto_title: '', manifesto_body: '',
      breakdown_title: '', breakdown_body: '',
      breakdown_image: '', breakdown_left_image: '',
    }])
  }

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx))

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBlogPosts()
      if (product?.id) {
        void fetchSections(product.id)
        void fetchBlogAssignment(product.id)
        void fetchReviews(product.id)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchBlogPosts, fetchSections, fetchBlogAssignment, fetchReviews, product?.id])

  const updateSection = (idx: number, field: keyof ProductSection, value: string | number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Please add a product name before saving.')
      return
    }

    setSaving(true)
    setError('')

    let productId = product?.id
    let productWasSaved = Boolean(productId)
    let saveStage: ProductSaveStage = 'product details'

    try {
      if (productId) {
        const { data: updatedProduct, error } = await supabase.from('products').update({
          name: form.name, subtitle: form.subtitle, description: form.description,
          how_to_use: form.how_to_use, ingredients: form.ingredients,
          brand_name: form.brand_name, brand_logo: form.brand_logo, seller_name: form.seller_name,
          price: form.price, price_pkr: form.price_pkr, price_aed: form.price_aed,
          compare_at_price: form.compare_at_price, inventory: form.inventory,
          low_stock_threshold: form.low_stock_threshold, category: form.category,
          location: form.location, delivery_charge: form.delivery_charge,
          images: form.images, is_active: form.is_active, is_featured: form.is_featured,
          sku: form.sku, weight: form.weight, discount_percent: form.discount_percent,
          tag1: form.tag1, tag2: form.tag2, skin_type: form.skin_type,
          updated_at: new Date().toISOString(),
        }).eq('id', productId).select('id').maybeSingle()
        if (error) throw error
        if (!updatedProduct?.id) {
          throw new Error('No product record was updated. This usually means your account no longer has product edit permission, or the product no longer exists.')
        }
      } else {
        const { data: insertedProduct, error } = await supabase.from('products').insert({
          name: form.name, subtitle: form.subtitle, description: form.description,
          how_to_use: form.how_to_use, ingredients: form.ingredients,
          brand_name: form.brand_name, brand_logo: form.brand_logo, seller_name: form.seller_name,
          price: form.price, price_pkr: form.price_pkr, price_aed: form.price_aed,
          compare_at_price: form.compare_at_price, inventory: form.inventory,
          low_stock_threshold: form.low_stock_threshold, category: form.category,
          location: form.location, delivery_charge: form.delivery_charge,
          images: form.images, is_active: form.is_active, is_featured: form.is_featured,
          sku: form.sku, weight: form.weight, discount_percent: form.discount_percent,
          tag1: form.tag1, tag2: form.tag2, skin_type: form.skin_type,
        }).select('id').maybeSingle()
        if (error) throw error
        if (!insertedProduct?.id) {
          throw new Error('The product row was not created. Please check your product creation permissions and try again.')
        }
        productId = insertedProduct.id
      }

      if (!productId) throw new Error('No product ID after save')

      productWasSaved = true

      saveStage = 'page sections'
      const { error: deleteSectionsError } = await supabase.from('product_sections').delete().eq('product_id', productId)
      if (deleteSectionsError) throw deleteSectionsError

      if (sections.length > 0) {
        const toInsert = sections.map((s, i) => ({
          product_id: productId,
          section_type: s.section_type,
          sort_order: i,
          manifesto_title: s.manifesto_title || null,
          manifesto_body: s.manifesto_body || null,
          breakdown_title: s.breakdown_title || null,
          breakdown_body: s.breakdown_body || null,
          breakdown_image: s.breakdown_image || null,
          breakdown_left_image: s.breakdown_left_image || null,
        }))
        const { error } = await supabase.from('product_sections').insert(toInsert)
        if (error) throw error
      }

      saveStage = 'blog assignment'
      const { error: deleteBlogError } = await supabase.from('product_blog_assignments').delete().eq('product_id', productId)
      if (deleteBlogError) throw deleteBlogError

      if (assignedBlogId) {
        const { error: blogAssignmentError } = await supabase.from('product_blog_assignments').insert({ product_id: productId, blog_post_id: assignedBlogId })
        if (blogAssignmentError) throw blogAssignmentError
      }

      onSaved(productId)
      if (closeOnSave) {
        onClose()
      }
    } catch (err: unknown) {
      console.error(`Product save failed while ${saveStage}:`, err)
      setError(buildProductSaveErrorMessage(saveStage, err, productWasSaved))
    } finally {
      setSaving(false)
    }
  }

  const toggleReviewApproval = async (reviewId: string, current: boolean) => {
    await supabase.from('reviews').update({ is_approved: !current }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_approved: !current } : r))
  }

  const deleteReview = async (reviewId: string) => {
    await supabase.from('reviews').delete().eq('id', reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
  }

  return (
    <div className={isPageLayout ? 'w-full' : 'fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:items-center'}>
      <div className={isPageLayout ? 'flex w-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm' : 'my-8 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl'}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{product?.id ? 'Edit Product' : 'Add Product'}</h2>
            {product?.id && <p className="text-xs text-gray-400 mt-0.5">ID: {product.id}</p>}
          </div>
          {isPageLayout ? (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to products
            </button>
          ) : (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="px-8 pt-4">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert" aria-live="polite">
              {error}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 px-8 pt-4 border-b border-gray-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-xl whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={isPageLayout ? 'px-8 py-6' : 'flex-1 overflow-y-auto px-8 py-6'}>

          {/* ── TAB: BASICS ── */}
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="e.g. Moringa Soap Bar" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Subtitle / Variant</label>
                  <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="e.g. Lavender Bergamot" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="SKU-001" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none"
                  placeholder="Short product description shown in What It Is tab..." />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price (base)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price AED</label>
                  <input type="number" value={form.price_aed ?? ''} onChange={e => setForm(f => ({ ...f, price_aed: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price PKR</label>
                  <input type="number" value={form.price_pkr ?? ''} onChange={e => setForm(f => ({ ...f, price_pkr: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Compare-at Price</label>
                  <input type="number" value={form.compare_at_price ?? ''} onChange={e => setForm(f => ({ ...f, compare_at_price: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Inventory</label>
                  <input type="number" value={form.inventory} onChange={e => setForm(f => ({ ...f, inventory: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Low Stock Alert</label>
                  <input type="number" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) || 10 }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="Face, Body, Soap..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</label>
                  <div className="relative mt-1">
                    <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none">
                      <option value="UAE">UAE</option>
                      <option value="Pakistan">Pakistan</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Skin Type</label>
                  <div className="relative mt-1">
                    <select value={form.skin_type} onChange={e => setForm(f => ({ ...f, skin_type: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none">
                      <option value="">None</option>
                      <option value="Oily">Oily</option>
                      <option value="Dry">Dry</option>
                      <option value="Combo">Combo</option>
                      <option value="Sensitive">Sensitive</option>
                      <option value="Normal">Normal</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tag 1</label>
                  <input value={form.tag1} onChange={e => setForm(f => ({ ...f, tag1: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tag 2</label>
                  <input value={form.tag2} onChange={e => setForm(f => ({ ...f, tag2: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" />
                </div>
                <div className="flex flex-col gap-2 justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded" />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Images</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
                    {imageUploading ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                      </>
                    )}
                    <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: BRANDING ── */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand Name</label>
                  <input
                    value={form.brand_name}
                    onChange={(e) => setForm((current) => ({ ...current, brand_name: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="e.g. CareCraftz"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Seller Name</label>
                  <input
                    value={form.seller_name}
                    onChange={(e) => setForm((current) => ({ ...current, seller_name: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                    placeholder="e.g. CareCraftz Official"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand Logo</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">Upload a public logo image for this product's brand identity.</p>

                {form.brand_logo ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <img src={form.brand_logo} alt={form.brand_name || 'Brand logo'} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{form.brand_name || 'Brand logo uploaded'}</p>
                      <p className="text-xs text-gray-500 break-all">{form.brand_logo}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => brandLogoInputRef.current?.click()}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, brand_logo: '' }))}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => brandLogoInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    {brandLogoUploading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="mt-2 font-medium text-gray-700">Click to upload brand logo</span>
                      </>
                    )}
                  </button>
                )}

                <input
                  ref={brandLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBrandLogoUpload}
                />
              </div>
            </div>
          )}

          {/* ── TAB: DETAILS ── */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">How To Use</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-1">Shown in "How To Use" tab on product page. Use line breaks for steps.</p>
                <textarea value={form.how_to_use} onChange={e => setForm(f => ({ ...f, how_to_use: e.target.value }))} rows={8}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none font-mono"
                  placeholder="Step 1: Apply a small amount to damp skin...&#10;Step 2: Massage in circular motions...&#10;Step 3: Rinse thoroughly..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Ingredients</label>
                <p className="text-xs text-gray-400 mt-0.5 mb-1">Full INCI list shown in "Ingredients" tab.</p>
                <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))} rows={8}
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none font-mono"
                  placeholder="Aqua, Sodium Palmate, Glycerin, Olea Europaea (Olive) Fruit Oil..." />
              </div>
            </div>
          )}

          {/* ── TAB: SECTIONS ── */}
          {activeTab === 'sections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Add Manifesto or Breakdown sections to display below the product detail.</p>
                <div className="flex gap-2">
                  <button onClick={() => addSection('manifesto')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Manifesto
                  </button>
                  <button onClick={() => addSection('breakdown')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Breakdown
                  </button>
                </div>
              </div>

              {sections.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 text-sm">No sections yet. Add a Manifesto or Breakdown section above.</p>
                </div>
              )}

              {sections.map((section, idx) => (
                <div key={idx} className={`border-2 rounded-2xl p-5 space-y-4 ${section.section_type === 'manifesto' ? 'border-indigo-200 bg-indigo-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${section.section_type === 'manifesto' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {section.section_type} — #{idx + 1}
                    </span>
                    <button onClick={() => removeSection(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {section.section_type === 'manifesto' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Title</label>
                        <input value={section.manifesto_title} onChange={e => updateSection(idx, 'manifesto_title', e.target.value)}
                          className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400"
                          placeholder="e.g. Multipurpose Manifesto" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Body Text</label>
                        <textarea value={section.manifesto_body} onChange={e => updateSection(idx, 'manifesto_body', e.target.value)} rows={3}
                          className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 resize-none"
                          placeholder="Not just for your underarms, freshen up your décolletage (neck and chest) and feet." />
                      </div>
                    </>
                  )}

                  {section.section_type === 'breakdown' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Title</label>
                        <input value={section.breakdown_title} onChange={e => updateSection(idx, 'breakdown_title', e.target.value)}
                          className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400"
                          placeholder="e.g. The Breakdown" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Body Text</label>
                        <textarea value={section.breakdown_body} onChange={e => updateSection(idx, 'breakdown_body', e.target.value)} rows={4}
                          className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 resize-none"
                          placeholder="Paper Tube + Seal: Compost (Backyard Or Municipal)&#10;Applicator: Recycle" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Left Lifestyle Image</label>
                          <div className="mt-2">
                            {section.breakdown_left_image ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={section.breakdown_left_image} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => updateSection(idx, 'breakdown_left_image', '')}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                                {section._uploading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                  : <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400 mt-1">Upload image</span></>}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleSectionImageUpload(idx, 'breakdown_left_image', e.target.files[0]) }} />
                              </label>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Right Detail Image (optional)</label>
                          <div className="mt-2">
                            {section.breakdown_image ? (
                              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={section.breakdown_image} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => updateSection(idx, 'breakdown_image', '')}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                                {section._uploading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                  : <><Upload className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400 mt-1">Upload image</span></>}
                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleSectionImageUpload(idx, 'breakdown_image', e.target.files[0]) }} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: BLOG ASSIGNMENT ── */}
          {activeTab === 'blog' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Assign one blog post to appear as the "Read the Blog" section on this product's page.</p>
              <div className="relative">
                <select value={assignedBlogId} onChange={e => setAssignedBlogId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none">
                  <option value="">— No blog post assigned —</option>
                  {allBlogPosts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {assignedBlogId && (
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <p className="text-xs text-indigo-600 font-medium">✓ Blog post assigned. It will display below the product sections with its featured image and excerpt.</p>
                </div>
              )}
              {allBlogPosts.length === 0 && (
                <p className="text-sm text-gray-400">No published blog posts yet. Create and publish a blog post in the Content section first.</p>
              )}
            </div>
          )}

          {/* ── TAB: REVIEWS ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {!product?.id ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm">Save the product first, then come back to manage reviews.</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-gray-400 text-sm">No reviews for this product yet.</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900">{review.customer_name}</span>
                        {review.is_verified_purchase && <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>}
                        <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-sm ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleReviewApproval(review.id, review.is_approved)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          review.is_approved
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {review.is_approved ? '✓ Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <span />
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              {isPageLayout ? 'Back to products' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {saving ? 'Saving...' : (product?.id ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
