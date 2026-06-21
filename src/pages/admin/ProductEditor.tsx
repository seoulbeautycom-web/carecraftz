import { useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProductModal from '../../components/admin/ProductModal'
import { supabase } from '../../lib/supabase'

type ProductModalProduct = ComponentProps<typeof ProductModal>['product']

export default function ProductEditor() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductModalProduct>(undefined)
  const [loading, setLoading] = useState(productId !== 'new')
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    const loadProduct = async () => {
      if (!productId || productId === 'new') {
        if (isActive) {
          setProduct(undefined)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError('')

      const { data, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle()

      if (!isActive) return

      if (productError) {
        setError(productError.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Product not found.')
        setLoading(false)
        return
      }

      setProduct(data as ProductModalProduct)
      setLoading(false)
    }

    void loadProduct()

    return () => {
      isActive = false
    }
  }, [productId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-medium text-gray-900">Loading product editor...</p>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the product details.</p>
        </div>
      </div>
    )
  }

  if (error && productId !== 'new') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white px-8 py-6 shadow-sm text-center">
          <p className="text-sm font-semibold text-red-600">Unable to open product</p>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="mt-6 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Back to products
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProductModal
      key={productId ?? 'new'}
      product={product}
      onClose={() => navigate('/products')}
      onSaved={() => navigate('/products')}
    />
  )
}
