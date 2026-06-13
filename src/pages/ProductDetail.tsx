import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { ShoppingCart, ArrowLeft, Minus, Plus, Truck, Shield, RefreshCw } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  inventory: number
  category: string | null
  location: string
  delivery_charge: number
  images: string[]
  tag1: string | null
  tag2: string | null
  weight: number | null
  sku: string | null
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart, setIsCartOpen } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single()

        if (error) {
          console.error('Error fetching product:', error)
          return
        }
        setProduct(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    setIsCartOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Product not found</p>
          <button
            onClick={() => navigate('/shop')}
            className="text-blue-600 hover:underline"
          >
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <CartButton />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images?.[selectedImage] || '/placeholder-product.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-black' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tag1 && (
                <span className="px-3 py-1 bg-gray-100 text-xs font-medium uppercase tracking-wider rounded">
                  {product.tag1}
                </span>
              )}
              {product.tag2 && (
                <span className="px-3 py-1 bg-gray-50 text-xs text-gray-600 uppercase tracking-wider rounded">
                  {product.tag2}
                </span>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-medium">
                  €{product.price.toFixed(2).replace('.', ',')}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      €{product.compare_at_price?.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.inventory, q + 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Add to Cart / Buy Now */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.inventory <= 0 || addedToCart}
                className={`flex-1 py-4 rounded-full font-medium transition-colors ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'bg-black text-white hover:bg-gray-800'
                } disabled:bg-gray-300`}
              >
                {addedToCart ? 'Added!' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.inventory <= 0}
                className="flex-1 py-4 bg-white border-2 border-black text-black rounded-full font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
              >
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-gray-100">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Free Delivery</p>
                <p className="text-xs text-gray-400">{product.location}</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Secure Payment</p>
                <p className="text-xs text-gray-400">100% Protected</p>
              </div>
              <div className="text-center">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Easy Returns</p>
                <p className="text-xs text-gray-400">30 Days</p>
              </div>
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-gray-400">SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function CartButton() {
  const { totalItems, setIsCartOpen } = useCart()

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="relative p-2 hover:bg-gray-100 rounded-full"
    >
      <ShoppingCart className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  )
}
