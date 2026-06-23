import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'
import { User, Mail, Phone, Package, LogOut, ShoppingBag, ChevronRight, MapPin, CheckCircle, AlertCircle, Send, Home } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageFrame from '../components/PageFrame'

interface Order {
  id: string
  order_code: string
  status: string
  created_at: string
  items: Array<{
    name: string
    quantity: number
    price: number
    currency: string
  }>
  totals: {
    pkr?: { total: number }
    aed?: { total: number }
  }
  shipping_address: {
    full_name: string
    city: string
    country: string
  }
}

const ORDER_STEPS = [
  { id: 1, name: 'Order Received', icon: CheckCircle },
  { id: 2, name: 'Order Confirmed', icon: AlertCircle },
  { id: 3, name: 'Being Packaged', icon: Package },
  { id: 4, name: 'Dispatched', icon: Send },
  { id: 5, name: 'Delivered', icon: Home }
]

function ProfileInner() {
  const navigate = useNavigate()
  const { user, signOut, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses'>('overview')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin')
    }
  }, [user, authLoading, navigate])

  // Fetch user orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchOrders()
    }
  }, [user, activeTab])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setOrdersLoading(false)
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount) return '-'
    return currency === 'PKR' 
      ? `₨ ${amount.toLocaleString('en-PK')}`
      : `AED ${amount.toLocaleString('en-AE')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOrderProgress = (status: string) => {
    const index = ORDER_STEPS.findIndex(step => step.name === status)
    return index >= 0 ? ((index + 1) / ORDER_STEPS.length) * 100 : 0
  }

  const getCurrentStepIndex = (status: string) => {
    return ORDER_STEPS.findIndex(step => step.name === status)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD6B0] border-t-[#2b2b2b] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfcf4]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-xl font-medium">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="font-medium">{user.full_name || 'User'}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'addresses'
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Addresses
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Account Info */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </div>
                      <p className="font-medium">{user.phone || 'Not added'}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => navigate('/shop')}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5" />
                        <span>Continue Shopping</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5" />
                        <span>View Orders</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Order History</h3>
                
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <button
                      onClick={() => navigate('/shop')}
                      className="mt-4 px-6 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => {
                      const currentStepIndex = getCurrentStepIndex(order.status)
                      return (
                        <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Order Header */}
                          <div 
                            className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-lg text-blue-600">
                                  {order.order_code}
                                </span>
                                <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Order Received' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.status}
                                </span>
                                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                                  expandedOrder === order.id ? 'rotate-90' : ''
                                }`} />
                              </div>
                            </div>
                            
                            {/* Mini Progress Bar */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${getOrderProgress(order.status)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Order Details & Journey */}
                          {expandedOrder === order.id && (
                            <div className="p-4">
                              {/* Order Journey */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Journey</h4>
                                <div className="relative">
                                  {/* Progress Line */}
                                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                                  
                                  {/* Steps */}
                                  <div className="space-y-3">
                                    {ORDER_STEPS.map((step, idx) => {
                                      const isCompleted = idx <= currentStepIndex
                                      const isCurrent = idx === currentStepIndex
                                      
                                      return (
                                        <div key={step.id} className="flex items-center gap-3 relative">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                                            isCompleted 
                                              ? 'bg-green-500 text-white' 
                                              : 'bg-gray-100 text-gray-400'
                                          }`}>
                                            <step.icon className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1">
                                            <p className={`text-sm font-medium ${
                                              isCompleted ? 'text-gray-900' : 'text-gray-400'
                                            }`}>
                                              {step.name}
                                              {isCurrent && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                                            </p>
                                          </div>
                                          {isCompleted && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Items */}
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
                                <div className="space-y-2">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <span>{item.name} x{item.quantity}</span>
                                      <span className="font-medium">
                                        {formatCurrency(item.price * item.quantity, item.currency)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Total */}
                                <div className="border-t mt-3 pt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total</span>
                                    <div className="text-right">
                                      {order.totals?.pkr && order.totals.pkr.total > 0 && (
                                        <p className="text-green-700 font-bold">
                                          {formatCurrency(order.totals.pkr.total, 'PKR')}
                                        </p>
                                      )}
                                      {order.totals?.aed && order.totals.aed.total > 0 && (
                                        <p className="text-blue-700 font-bold">
                                          {formatCurrency(order.totals.aed.total, 'AED')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Saved Addresses</h3>
                  <button className="px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800">
                    Add Address
                  </button>
                </div>
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No addresses saved</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Profile() {
  return (
    <PageFrame frameColor="#FFD6B0" showFooter={false}>
      <ProfileInner />
    </PageFrame>
  )
}
