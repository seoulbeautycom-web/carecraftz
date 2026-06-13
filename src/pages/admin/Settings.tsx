import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  HardDrive, 
  Database, 
  Users, 
  Image as ImageIcon, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Server
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

interface StorageStats {
  totalStorage: number
  usedStorage: number
  freeStorage: number
  percentUsed: number
  productImagesCount: number
  galleryImagesCount: number
  databaseSize: string
  staffCount: number
}

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<StorageStats>({
    totalStorage: 1, // Supabase free tier: 1GB
    usedStorage: 0,
    freeStorage: 1,
    percentUsed: 0,
    productImagesCount: 0,
    galleryImagesCount: 0,
    databaseSize: 'Unknown',
    staffCount: 0
  })

  useEffect(() => {
    checkAuth()
    fetchStorageStats()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/admin/login')
    }
  }

  const fetchStorageStats = async () => {
    try {
      setLoading(true)

      // Count product images
      const { data: productImages } = await supabase.storage
        .from('product-images')
        .list('products', { limit: 1000 })

      // Count gallery images
      const { data: galleryImages } = await supabase.storage
        .from('company-product-gallery')
        .list('', { limit: 1000 })

      // Count staff
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })

      // Calculate used storage (approximate based on file count * avg size)
      // Note: Supabase doesn't provide direct bucket size via client API
      // This is an estimation
      const productCount = productImages?.reduce((acc, folder) => {
        return acc + (folder.name ? 1 : 0)
      }, 0) || 0

      const galleryCount = galleryImages?.length || 0
      
      // Estimate: average 200KB per image
      const avgImageSizeMB = 0.2
      const estimatedUsedMB = (productCount + galleryCount) * avgImageSizeMB
      const totalMB = 1024 // 1GB in MB

      setStats({
        totalStorage: 1, // GB
        usedStorage: Math.round(estimatedUsedMB / 1024 * 100) / 100, // GB
        freeStorage: Math.round((totalMB - estimatedUsedMB) / 1024 * 100) / 100,
        percentUsed: Math.round((estimatedUsedMB / totalMB) * 100),
        productImagesCount: productCount,
        galleryImagesCount: galleryCount,
        databaseSize: 'Unknown',
        staffCount: staffCount || 0
      })

    } catch (error) {
      console.error('Error fetching storage stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStorageStats()
  }

  const formatSize = (gb: number) => {
    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`
    }
    return `${(gb * 1024).toFixed(0)} MB`
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">System configuration and storage metrics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-gray-600">Loading stats...</span>
          </div>
        ) : (
        <>
        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Storage Usage Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Storage Usage</h3>
                <p className="text-sm text-gray-500">Supabase Storage</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{stats.percentUsed}% used</span>
                <span className="text-gray-500">
                  {formatSize(stats.usedStorage)} / {formatSize(stats.totalStorage)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    stats.percentUsed > 90 
                      ? 'bg-red-500' 
                      : stats.percentUsed > 70 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Free space:</span>
                <span className="font-medium text-gray-900">{formatSize(stats.freeStorage)}</span>
              </div>
            </div>

            {stats.percentUsed > 90 && (
              <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Storage almost full!</span>
              </div>
            )}
          </div>

          {/* Images Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ImageIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Images</h3>
                <p className="text-sm text-gray-500">Total count</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Product Images</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.productImagesCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Gallery Images</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.galleryImagesCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Images</span>
                <span className="font-bold text-blue-600">
                  {stats.productImagesCount + stats.galleryImagesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Database Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-sm text-gray-500">PostgreSQL</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Staff Members</span>
                </div>
                <span className="font-semibold text-gray-900">{stats.staffCount}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Database Size</span>
                <span className="font-medium text-gray-900">{stats.databaseSize}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 font-medium">Status</span>
                </div>
                <span className="font-medium text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Supabase Project</h3>
              <p className="text-gray-600 text-sm">
                URL: {import.meta.env.VITE_SUPABASE_URL}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Storage Buckets</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• product-images (organized by product ID)</li>
                <li>• company-product-gallery (flat structure)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Storage metrics are estimated based on image count. 
              For accurate storage usage, check the Supabase Dashboard directly.
            </p>
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  )
}
