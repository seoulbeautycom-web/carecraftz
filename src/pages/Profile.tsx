import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { User, Mail, Phone, Package, LogOut, ShoppingBag, ChevronRight, MapPin } from 'lucide-react'
import CartDrawer from '../components/CartDrawer'

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut, loading: authLoading } = useAuth()
  const { setIsCartOpen } = useCart()
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses'>('overview')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin')
    }
  }, [user, authLoading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F9F4F0] flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F4F0]">
      <CartDrawer />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="text-xl font-light"
            >
              CareCraftz
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
