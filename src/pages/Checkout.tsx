import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, CreditCard, Truck, Shield, MapPin, Phone, Mail, User, CheckCircle, Package, Send, Home, AlertCircle } from 'lucide-react'
import PageFrame from '../components/PageFrame'

interface OrderForm {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  country: 'Pakistan' | 'UAE'
  postalCode: string
  paymentMethod: 'cod' | 'card'
}

function CheckoutInner() {
  const navigate = useNavigate()
  const { items, totalPriceByCurrency, deliveryChargesByCurrency, grandTotalByCurrency, clearCart } = useCart()
  const { user } = useAuth()
  
  // Determine required country from cart items
  const hasPKRItems = items.some(item => item.currency === 'PKR')
  const hasAEDItems = items.some(item => item.currency === 'AED' || !item.currency)
  const requiredCountry = hasPKRItems && !hasAEDItems ? 'Pakistan' : 
                          hasAEDItems && !hasPKRItems ? 'UAE' : 
                          hasPKRItems && hasAEDItems ? 'mixed' : 'UAE'
  
  // Fetch user profile data for prefilling
  useEffect(() => {
    async function fetchUserProfile() {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setForm(prev => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            email: user.email || prev.email,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            city: data.city || prev.city,
            country: (requiredCountry === 'Pakistan' || requiredCountry === 'UAE') ? requiredCountry : (data.country || prev.country)
          }))
        }
      }
    }
    fetchUserProfile()
  }, [user, requiredCountry])

  const [form, setForm] = useState<OrderForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: (requiredCountry === 'Pakistan' || requiredCountry === 'UAE') ? requiredCountry : 'UAE',
    postalCode: '',
    paymentMethod: 'cod'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  // Group items by currency (fallback to AED for legacy items without currency)
  const pkrItems = items.filter(item => item.currency === 'PKR')
  const aedItems = items.filter(item => item.currency === 'AED' || !item.currency)

  // Fetch user profile data for prefilling
  useEffect(() => {
    async function fetchUserProfile() {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setForm(prev => ({
            ...prev,
            fullName: data.full_name || prev.fullName,
            email: user.email || prev.email,
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            city: data.city || prev.city,
            country: (requiredCountry === 'Pakistan' || requiredCountry === 'UAE') ? requiredCountry : (data.country || prev.country)
          }))
        }
      }
    }
    fetchUserProfile()
  }, [user, requiredCountry])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Generate custom order ID (CC####)
  const generateOrderId = async () => {
    const prefix = 'CC'
    const randomNum = Math.floor(1000 + Math.random() * 9000) // 1000-9999
    const customId = `${prefix}${randomNum}`
    
    // Check if ID exists
    const { data } = await supabase
      .from('orders')
      .select('order_code')
      .eq('order_code', customId)
      .single()
    
    if (data) {
      // If exists, generate new one
      return generateOrderId()
    }
    
    return customId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Generate custom order code
      const orderCode = await generateOrderId()

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          user_id: user?.id || null,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: {
            full_name: form.fullName,
            address: form.address,
            city: form.city,
            country: form.country,
            postal_code: form.postalCode
          },
          items: items.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            currency: item.currency || 'AED',
            delivery_charge: item.delivery_charge || 0,
            location: item.location || 'UAE'
          })),
          totals: {
            pkr: {
              subtotal: totalPriceByCurrency.PKR,
              delivery: deliveryChargesByCurrency.PKR,
              total: grandTotalByCurrency.PKR
            },
            aed: {
              subtotal: totalPriceByCurrency.AED,
              delivery: deliveryChargesByCurrency.AED,
              total: grandTotalByCurrency.AED
            }
          },
          payment_method: form.paymentMethod,
          status: 'Order Received'
        })
        .select()
        .single()

      if (orderError) throw orderError

      setOrderId(order.order_code)
      setOrderSuccess(true)
      clearCart()
    } catch (err) {
      console.error('Order error:', err)
      setError('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <h1 className="text-2xl font-bold text-[#1F331F] mb-4">Your cart is empty</h1>
              <p className="text-gray-600 mb-6">Add some products before checkout</p>
              <button
                onClick={() => navigate('/shop')}
                className="bg-[#1F331F] text-white px-6 py-3 rounded-full hover:bg-[#1F331F]/90"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
    )
  }

  if (orderSuccess) {
    const orderSteps = [
      { id: 1, name: 'Order Received', icon: CheckCircle, status: 'completed', description: 'Your order has been received' },
      { id: 2, name: 'Order Confirmed', icon: AlertCircle, status: 'pending', description: 'Waiting for confirmation' },
      { id: 3, name: 'Being Packaged', icon: Package, status: 'pending', description: 'Items being prepared' },
      { id: 4, name: 'Dispatched', icon: Send, status: 'pending', description: 'Out for delivery' },
      { id: 5, name: 'Delivered', icon: Home, status: 'pending', description: 'Order completed' }
    ]

    return (
      <>
        <div className="min-h-screen bg-[#F5F5F0] py-12">
          <div className="max-w-3xl mx-auto px-6">
            {/* Success Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F331F] mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-600 mb-1">Order ID: <span className="font-mono font-bold text-lg text-[#1F331F]">{orderId}</span></p>
              <p className="text-gray-500 text-sm">We'll send you a confirmation email shortly.</p>
            </div>

            {/* Order Journey Roadmap */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-[#1F331F] mb-6">Order Journey</h2>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200"></div>
                
                {/* Steps */}
                <div className="space-y-6">
                  {orderSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-4 relative">
                      {/* Step Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        step.status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${
                            step.status === 'completed' ? 'text-[#1F331F]' : 'text-gray-500'
                          }`}>
                            {step.name}
                          </h3>
                          {step.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/shop')}
                className="flex-1 bg-[#1F331F] text-white px-6 py-3 rounded-full hover:bg-[#1F331F]/90 font-medium"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 bg-white text-[#1F331F] border-2 border-[#1F331F] px-6 py-3 rounded-full hover:bg-gray-50 font-medium"
              >
                View My Orders
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const formatCurrency = (amount: number, currency: 'PKR' | 'AED') => {
    return currency === 'PKR' 
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`
  }

  return (
    <>
      <div className="min-h-screen bg-[#F5F5F0] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#1F331F] hover:text-[#1F331F]/70 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#1F331F] mb-6">Shipping Information</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                      placeholder="+92... or +971..."
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                    placeholder="Street address, apartment, suite"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Country
                      {requiredCountry !== 'mixed' && (
                        <span className="text-xs text-gray-500 font-normal ml-2">(Locked based on products)</span>
                      )}
                    </label>
                    {requiredCountry === 'mixed' ? (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        ⚠️ You have products from both UAE and Pakistan. Please order them separately.
                      </div>
                    ) : (
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleInputChange}
                        disabled={requiredCountry === 'Pakistan' || requiredCountry === 'UAE'}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent ${
                          (requiredCountry === 'Pakistan' || requiredCountry === 'UAE') ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="UAE">UAE</option>
                        <option value="Pakistan">Pakistan</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Postal Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                    placeholder="Postal code (optional)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Payment Method</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={form.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#1F331F]"
                      />
                      <Truck className="w-5 h-5 text-[#1F331F]" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-500">Pay when you receive</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#1F331F]"
                      />
                      <CreditCard className="w-5 h-5 text-[#1F331F]" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-gray-500">Coming soon</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || form.paymentMethod === 'card'}
                  className="w-full bg-[#1F331F] text-white py-4 rounded-full font-medium hover:bg-[#1F331F]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-[#1F331F] mb-4">Order Summary</h2>
                
                {/* PKR Items */}
                {pkrItems.length > 0 && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">PKR</span>
                      <span className="text-sm text-gray-500">Pakistan Products</span>
                    </div>
                    {pkrItems.map(item => (
                      <div key={item.id} className="flex items-center gap-4 py-2">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-[#1F331F]">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.price * item.quantity, 'PKR')}</p>
                          <p className="text-xs text-gray-500">Delivery: {formatCurrency((item.delivery_charge || 0) * item.quantity, 'PKR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AED Items */}
                {aedItems.length > 0 && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">AED</span>
                      <span className="text-sm text-gray-500">UAE Products</span>
                    </div>
                    {aedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-4 py-2">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-[#1F331F]">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(item.price * item.quantity, 'AED')}</p>
                          <p className="text-xs text-gray-500">Delivery: {formatCurrency((item.delivery_charge || 0) * item.quantity, 'AED')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 pt-2">
                  {grandTotalByCurrency.PKR > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal (PKR)</span>
                        <span>{formatCurrency(totalPriceByCurrency.PKR, 'PKR')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery (PKR)</span>
                        <span>{formatCurrency(deliveryChargesByCurrency.PKR, 'PKR')}</span>
                      </div>
                    </>
                  )}
                  
                  {grandTotalByCurrency.AED > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal (AED)</span>
                        <span>{formatCurrency(totalPriceByCurrency.AED, 'AED')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery (AED)</span>
                        <span>{formatCurrency(deliveryChargesByCurrency.AED, 'AED')}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    {grandTotalByCurrency.PKR > 0 && (
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#1F331F]">Total (PKR)</span>
                        <span className="text-xl font-bold text-[#1F331F]">
                          {formatCurrency(grandTotalByCurrency.PKR, 'PKR')}
                        </span>
                      </div>
                    )}
                    {grandTotalByCurrency.AED > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1F331F]">Total (AED)</span>
                        <span className="text-xl font-bold text-[#1F331F]">
                          {formatCurrency(grandTotalByCurrency.AED, 'AED')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#1F331F]" />
                    <span>Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Checkout() {
  return (
    <PageFrame frameColor="#B5C7EB" showFooter={false}>
      <CheckoutInner />
    </PageFrame>
  )
}
