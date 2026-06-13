import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Package, Plus, Edit, Trash2, Search, Filter, Image as ImageIcon, DollarSign, Boxes, Tag, Star, MapPin, Truck, Percent, AlertTriangle, Upload, X } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  inventory: number
  low_stock_threshold: number
  category: string | null
  location: string
  delivery_charge: number
  images: string[]
  is_active: boolean
  is_featured: boolean
  sku: string | null
  weight: number | null
  discount_percent: number
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  creator?: { full_name: string; email: string }
  updater?: { full_name: string; email: string }
}

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    inventory: '',
    low_stock_threshold: '10',
    category: '',
    location: 'UAE',
    delivery_charge: '0',
    sku: '',
    weight: '',
    discount_percent: '0',
    tags: '',
    is_active: true,
    is_featured: false,
    images: [] as string[]
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null })
  const [galleryModal, setGalleryModal] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
    fetchProducts()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/admin/login')
      } else {
        setCurrentUserId(session.user.id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      navigate('/admin/login')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)

      // Fetch products with staff info for audit
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          creator:created_by(full_name, email),
          updater:updated_by(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error fetching products:', productsError)
        alert('Failed to load products: ' + productsError.message)
        return
      }

      setProducts(productsData || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
      alert('Failed to load products: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Product name is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required'
    }

    if (!formData.inventory || parseInt(formData.inventory) < 0) {
      errors.inventory = 'Valid inventory quantity is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (editingProduct) {
        // === UPDATE EXISTING PRODUCT ===
        // Upload images using existing product ID
        const uploadedImageUrls = await uploadImages(editingProduct.id)

        // Reorder images so primary is first
        const reorderedImages = [...uploadedImageUrls]
        if (primaryImageIndex > 0 && primaryImageIndex < reorderedImages.length) {
          const [primary] = reorderedImages.splice(primaryImageIndex, 1)
          reorderedImages.unshift(primary)
        }

        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          inventory: parseInt(formData.inventory),
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
          category: formData.category.trim() || null,
          location: formData.location,
          delivery_charge: parseFloat(formData.delivery_charge) || 0,
          sku: formData.sku.trim() || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          discount_percent: parseInt(formData.discount_percent) || 0,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          images: reorderedImages,
          updated_by: currentUserId // AUDIT: Who updated
        }

        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) {
          console.error('Error updating product:', error)
          alert('Failed to update product: ' + error.message)
          return
        }

        alert('Product updated successfully!')
      } else {
        // === CREATE NEW PRODUCT ===
        // First create product without images to get the ID
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          inventory: parseInt(formData.inventory),
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
          category: formData.category.trim() || null,
          location: formData.location,
          delivery_charge: parseFloat(formData.delivery_charge) || 0,
          sku: formData.sku.trim() || null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          discount_percent: parseInt(formData.discount_percent) || 0,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          images: [], // Empty initially, will update after upload
          created_by: currentUserId, // AUDIT: Who created
          updated_by: currentUserId  // AUDIT: Who last updated
        }

        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single()

        if (createError || !newProduct) {
          console.error('Error creating product:', createError)
          alert('Failed to create product: ' + (createError?.message || 'Unknown error'))
          return
        }

        // Now upload images using the new product ID
        if (selectedFiles.length > 0) {
          await uploadImagesForNewProduct(newProduct.id)
        }

        alert('Product created successfully!')
      }

      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert('Failed to save product: ' + (error.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Image upload functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`Invalid file type: ${file.name}. Only images allowed.`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max 5MB.`)
        return false
      }
      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    if (primaryImageIndex === index && selectedFiles.length > 1) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1)
    }
  }

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    if (primaryImageIndex === index && formData.images.length > 1) {
      setPrimaryImageIndex(0)
    }
  }

  const uploadImages = async (productId: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return formData.images

    const uploadedUrls: string[] = [...formData.images]
    const totalFiles = selectedFiles.length

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      // Organize by product ID: products/{productId}/{filename}
      const filePath = `products/${productId}/${fileName}`

      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        alert(`Failed to upload ${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    setUploadProgress(0)
    setSelectedFiles([])
    return uploadedUrls
  }

  // Upload images for new product (after product is created)
  const uploadImagesForNewProduct = async (productId: string) => {
    if (selectedFiles.length === 0) return

    const uploadedUrls = await uploadImages(productId)

    // Reorder images so primary is first
    const reorderedImages = [...uploadedUrls]
    if (primaryImageIndex > 0 && primaryImageIndex < reorderedImages.length) {
      const [primary] = reorderedImages.splice(primaryImageIndex, 1)
      reorderedImages.unshift(primary)
    }

    // Update product with image URLs
    const { error } = await supabase
      .from('products')
      .update({ images: reorderedImages })
      .eq('id', productId)

    if (error) {
      console.error('Error updating product with images:', error)
      alert('Product created but failed to save images: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      inventory: '',
      low_stock_threshold: '10',
      category: '',
      location: 'UAE',
      delivery_charge: '0',
      sku: '',
      weight: '',
      discount_percent: '0',
      tags: '',
      is_active: true,
      is_featured: false,
      images: []
    })
    setFormErrors({})
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    resetForm()
    setPrimaryImageIndex(0)
    setSelectedFiles([])
    setShowModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      inventory: product.inventory.toString(),
      low_stock_threshold: product.low_stock_threshold?.toString() || '10',
      category: product.category || '',
      location: product.location || 'UAE',
      delivery_charge: product.delivery_charge?.toString() || '0',
      sku: product.sku || '',
      weight: product.weight?.toString() || '',
      discount_percent: product.discount_percent?.toString() || '0',
      tags: product.tags?.join(', ') || '',
      is_active: product.is_active,
      is_featured: product.is_featured,
      images: product.images || []
    })
    setPrimaryImageIndex(0)
    setSelectedFiles([])
    setFormErrors({})
    setShowModal(true)
  }

  const handleDeleteClick = (product: Product) => {
    setDeleteModal({ show: true, product })
  }

  const handleDeleteProduct = async (deleteImages: boolean) => {
    if (!deleteModal.product) return

    const productId = deleteModal.product.id
    const productImages = deleteModal.product.images || []

    try {
      // If keeping images, move them to company gallery
      if (!deleteImages && productImages.length > 0) {
        for (const imageUrl of productImages) {
          try {
            // Extract filename from URL
            const urlParts = imageUrl.split('/')
            const fileName = urlParts[urlParts.length - 1]

            // Copy to company gallery (flat structure)
            const { error: copyError } = await supabase.storage
              .from('company-product-gallery')
              .copy(
                `products/${productId}/${fileName}`,
                `${fileName}`
              )

            if (copyError) {
              console.log('Image may already exist in gallery or copy failed:', copyError)
            } else {
              // Add to gallery metadata table
              await supabase.from('company_gallery_images').insert({
                name: fileName,
                url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/company-product-gallery/${fileName}`,
                tags: ['from-deleted-product'],
                created_by: currentUserId
              })
            }
          } catch (err) {
            console.error('Error moving image to gallery:', err)
          }
        }
      }

      // Delete product images from product-images bucket if requested
      if (deleteImages && productImages.length > 0) {
        for (const imageUrl of productImages) {
          try {
            const urlParts = imageUrl.split('/')
            const fileName = urlParts[urlParts.length - 1]
            const filePath = `products/${productId}/${fileName}`

            await supabase.storage
              .from('product-images')
              .remove([filePath])
          } catch (err) {
            console.error('Error deleting image:', err)
          }
        }
      }

      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product: ' + error.message)
        return
      }

      alert(deleteImages ? 'Product and images deleted!' : 'Product deleted! Images moved to Company Gallery.')
      setDeleteModal({ show: false, product: null })
      fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product: ' + (error.message || 'Unknown error'))
    }
  }

  // Gallery functions
  const fetchGalleryImages = async () => {
    try {
      // List files from company gallery bucket
      const { data, error } = await supabase.storage
        .from('company-product-gallery')
        .list('', { limit: 100 })

      if (error) {
        console.error('Error fetching gallery:', error)
        return
      }

      const imageUrls = (data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('company-product-gallery')
            .getPublicUrl(file.name)
          return publicUrl
        })

      setGalleryImages(imageUrls)
    } catch (error) {
      console.error('Error loading gallery:', error)
    }
  }

  const openGalleryModal = () => {
    fetchGalleryImages()
    setGalleryModal(true)
  }

  const selectGalleryImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }))
    setGalleryModal(false)
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) {
        console.error('Error toggling product status:', error)
        alert('Failed to update product status: ' + error.message)
        return
      }

      fetchProducts()
    } catch (error: any) {
      console.error('Error toggling product status:', error)
      alert('Failed to update product status: ' + (error.message || 'Unknown error'))
    }
  }

  // Filter products based on search, category, and location
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    const matchesLocation = !locationFilter || product.location === locationFilter
    return matchesSearch && matchesCategory && matchesLocation
  })

  // Get unique categories and locations for filter dropdowns
  const categories = [...new Set(products.map(p => p.category).filter((c): c is string => !!c))]
  const locations = [...new Set(products.map(p => p.location).filter((l): l is string => !!l))]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your store products and inventory</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || locationFilter 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first product'}
            </p>
            {!searchQuery && !categoryFilter && (
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  product.is_active ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 rounded-t-xl flex items-center justify-center overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ''
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex gap-1">
                      {product.is_featured && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          <Star className="w-3 h-3 inline" />
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  {product.discount_percent > 0 && (
                    <div className="flex items-center gap-1 text-sm text-red-600 mb-2">
                      <Percent className="w-3 h-3" />
                      {product.discount_percent}% OFF
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    {product.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {product.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.location || 'UAE'}
                    </span>
                  </div>

                  {product.sku && (
                    <div className="text-xs text-gray-400 mb-2">
                      SKU: {product.sku}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1 text-sm ${
                        product.inventory <= product.low_stock_threshold ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {product.inventory <= product.low_stock_threshold && (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <Boxes className="w-4 h-4" />
                        {product.inventory} in stock
                      </div>
                      {product.delivery_charge > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Truck className="w-3 h-3" />
                          Delivery: {formatPrice(product.delivery_charge)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Audit Trail */}
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                    <div className="flex items-center gap-1">
                      <span>Created:</span>
                      <span className="font-medium">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                      {product.creator?.full_name && (
                        <span className="text-gray-500">by {product.creator.full_name}</span>
                      )}
                    </div>
                    {product.updated_at !== product.created_at && (
                      <div className="flex items-center gap-1">
                        <span>Updated:</span>
                        <span className="font-medium">
                          {new Date(product.updated_at).toLocaleDateString()}
                        </span>
                        {product.updater?.full_name && product.updater.full_name !== product.creator?.full_name && (
                          <span className="text-gray-500">by {product.updater.full_name}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter product name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter product description"
                  />
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.price ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {formErrors.price && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compare At Price
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.compare_at_price}
                        onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount %
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inventory <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.inventory}
                        onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.inventory ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    {formErrors.inventory && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.inventory}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Category and SKU */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Electronics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SKU-12345"
                    />
                  </div>
                </div>

                {/* Location and Delivery */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                      >
                        <option value="UAE">UAE</option>
                        <option value="Pakistan">Pakistan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Charge
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.delivery_charge}
                        onChange={(e) => setFormData({ ...formData, delivery_charge: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Weight and Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., new, trending, sale"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>

                  {/* Existing Images */}
                  {formData.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Current Images (click star to set primary):</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Product ${index + 1}`}
                              className={`w-20 h-20 object-cover rounded-lg border-2 ${
                                primaryImageIndex === index ? 'border-yellow-500' : 'border-gray-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setPrimaryImageIndex(index)}
                              className={`absolute top-1 left-1 p-1 rounded ${
                                primaryImageIndex === index ? 'bg-yellow-500 text-white' : 'bg-white/80 text-gray-600'
                              }`}
                              title="Set as primary"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Files to Upload */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">New Images to Upload:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className={`w-20 h-20 object-cover rounded-lg border-2 ${
                                primaryImageIndex === (formData.images.length + index) ? 'border-yellow-500' : 'border-gray-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setPrimaryImageIndex(formData.images.length + index)}
                              className={`absolute top-1 left-1 p-1 rounded ${
                                primaryImageIndex === (formData.images.length + index) ? 'bg-yellow-500 text-white' : 'bg-white/80 text-gray-600'
                              }`}
                              title="Set as primary"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/50 text-white text-center rounded truncate px-1">
                              {file.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadProgress > 0 && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}

                  {/* Gallery Button */}
                  <button
                    type="button"
                    onClick={openGalleryModal}
                    className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                    Browse Company Gallery
                  </button>

                  {/* File Input */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload images (max 5MB each)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, WebP, GIF. First image is primary by default.</p>
                </div>

                {/* Status Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Active (visible to customers)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Featured Product
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal with Options */}
        {deleteModal.show && deleteModal.product && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <Trash2 className="w-8 h-8" />
                <h2 className="text-xl font-semibold">Delete Product?</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteModal.product.name}</strong>?
                This product has {deleteModal.product.images.length} image(s).
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleDeleteProduct(false)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Keep Images</p>
                    <p className="text-sm text-gray-500">Move images to Company Gallery for reuse</p>
                  </div>
                </button>

                <button
                  onClick={() => handleDeleteProduct(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Delete Everything</p>
                    <p className="text-sm text-gray-500">Permanently delete product and all images</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Company Gallery Modal */}
        {galleryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Company Product Gallery</h2>
                <button
                  onClick={() => setGalleryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {galleryImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No images in gallery yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Images from deleted products will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {galleryImages.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => selectGalleryImage(url)}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setGalleryModal(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
