import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArrowLeft, CreditCard, Truck, Shield, MapPin, Phone, Mail, User } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalPriceByCurrency, deliveryChargesByCurrency, grandTotalByCurrency, clearCart } = useCart()
  const { user } = useAuth()
  
  const [form, setForm] = useState<OrderForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    postalCode: '',
    paymentMethod: 'cod'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  // Group items by currency
  const pkrItems = items.filter(item => item.currency === 'PKR')
  const aedItems = items.filter(item => item.currency === 'AED')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
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
            currency: item.currency,
            delivery_charge: item.delivery_charge,
            location: item.location
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
          status: 'pending'
        })
        .select()
        .single()

      if (orderError) throw orderError

      setOrderId(order.id)
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
      <>
        <Navbar />
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
        <Footer />
      </>
    )
  }

  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F5F5F0] py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#1F331F] mb-4">Order Placed Successfully!</h1>
              <p className="text-gray-600 mb-2">Order ID: <span className="font-mono font-bold">{orderId}</span></p>
              <p className="text-gray-600 mb-6">We'll send you a confirmation email shortly.</p>
              <button
                onClick={() => navigate('/shop')}
                className="bg-[#1F331F] text-white px-6 py-3 rounded-full hover:bg-[#1F331F]/90"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
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
      <Navbar />
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
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Country</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                    >
                      <option value="UAE">UAE</option>
                      <option value="Pakistan">Pakistan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F331F] focus:border-transparent"
                    placeholder="Postal code"
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
                          <p className="text-xs text-gray-500">Delivery: {formatCurrency(item.delivery_charge * item.quantity, 'PKR')}</p>
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
                          <p className="text-xs text-gray-500">Delivery: {formatCurrency(item.delivery_charge * item.quantity, 'AED')}</p>
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
      <Footer />
    </>
  )
}
