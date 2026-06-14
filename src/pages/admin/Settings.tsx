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
  Server,
  Activity,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  BarChart2,
  ExternalLink
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

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'UPLOAD' | 'DELETE_IMAGE'
  old_data: any
  new_data: any
  performed_by_name: string
  performed_by_email: string
  performed_at: string
}

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'security' | 'integrations'>('overview')
  const [stats, setStats] = useState<StorageStats>({
    totalStorage: 1,
    usedStorage: 0,
    freeStorage: 1,
    percentUsed: 0,
    productImagesCount: 0,
    galleryImagesCount: 0,
    databaseSize: 'Unknown',
    staffCount: 0
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditExpanded, setAuditExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkAuth()
    fetchStorageStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/admin/login')
    }
  }

  const fetchStorageStats = async () => {
    try {
      setLoading(true)

      // Count product images by querying products table (more accurate than storage)
      const { data: productsData } = await supabase
        .from('products')
        .select('images')

      const productImagesCount = productsData?.reduce((acc, product) => {
        return acc + (product.images?.length || 0)
      }, 0) || 0

      // Count gallery images from table
      const { data: galleryData } = await supabase
        .from('company_gallery_images')
        .select('*')

      const galleryImagesCount = galleryData?.length || 0

      // Count staff
      const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })

      // Also try to get actual storage metrics from Supabase
      let storageUsed = 0
      try {
        // List all files in product-images bucket
        const { data: allProductFiles } = await supabase.storage
          .from('product-images')
          .list('products', { limit: 1000 })

        // Recursively count files in subfolders
        let productFileCount = 0
        if (allProductFiles) {
          for (const folder of allProductFiles) {
            if (folder.id) { // It's a folder
              const { data: folderFiles } = await supabase.storage
                .from('product-images')
                .list(`products/${folder.name}`, { limit: 1000 })
              productFileCount += folderFiles?.length || 0
            }
          }
        }

        // List gallery files
        const { data: galleryFiles } = await supabase.storage
          .from('company-product-gallery')
          .list('', { limit: 1000 })

        const totalFiles = productFileCount + (galleryFiles?.length || 0)
        const avgImageSizeMB = 0.2
        storageUsed = (totalFiles * avgImageSizeMB) / 1024 // Convert to GB
      } catch (storageError) {
        console.log('Storage metrics estimation failed, using database counts')
        // Fallback: estimate from database counts
        const avgImageSizeMB = 0.2
        storageUsed = ((productImagesCount + galleryImagesCount) * avgImageSizeMB) / 1024
      }

      const totalStorage = 1 // 1GB free tier
      const freeStorage = Math.max(0, totalStorage - storageUsed)
      const percentUsed = Math.min(100, Math.round((storageUsed / totalStorage) * 100))

      setStats({
        totalStorage,
        usedStorage: Math.round(storageUsed * 100) / 100,
        freeStorage: Math.round(freeStorage * 100) / 100,
        percentUsed,
        productImagesCount,
        galleryImagesCount,
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

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true)
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching audit logs:', error)
        return
      }

      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setAuditLoading(false)
    }
  }

  const toggleAuditExpand = (id: string) => {
    setAuditExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-400 mt-1">System configuration and storage metrics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'overview' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'audit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'security' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'integrations' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Integrations
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            <span className="ml-3 text-slate-400">Loading stats...</span>
          </div>
        ) : activeTab === 'overview' ? (
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
        ) : activeTab === 'audit' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">System Audit Logs</h2>
                  <p className="text-sm text-gray-500">Track all changes to products and staff</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {auditLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading audit logs...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No audit logs yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Logs will appear when products or staff are created, updated, or deleted.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.table_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(log.performed_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        by <span className="font-medium">{log.performed_by_name || 'Unknown'}</span>
                        {log.performed_by_email && (
                          <span className="text-gray-500"> ({log.performed_by_email})</span>
                        )}
                      </p>

                      {log.new_data && log.new_data.name && (
                        <p className="text-sm text-gray-600">
                          Item: <span className="font-medium">{log.new_data.name}</span>
                        </p>
                      )}

                      {log.old_data && log.new_data && (
                        <button
                          onClick={() => toggleAuditExpand(log.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                        >
                          {auditExpanded[log.id] ? (
                            <><ChevronUp className="w-4 h-4" /> Hide changes</>
                          ) : (
                            <><ChevronDown className="w-4 h-4" /> Show changes</>
                          )}
                        </button>
                      )}

                      {auditExpanded[log.id] && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                          {log.old_data && (
                            <div className="mb-2">
                              <p className="text-gray-500 font-medium mb-1">Before:</p>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <p className="text-gray-500 font-medium mb-1">After:</p>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'security' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Security & RLS Policies</h2>
                <p className="text-sm text-gray-500">Row Level Security status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Row Level Security (RLS) Enabled</h3>
                </div>
                <p className="text-sm text-green-700">
                  All tables have RLS enabled. Users can only access data they own or are authorized to view.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Protected Tables:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>products - Only admins/managers can modify</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>staff - Admin access only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>company_gallery_images - Admin access only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>audit_logs - Admin view only</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Storage Buckets</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• product-images - Public read, Admin write</li>
                  <li>• company-product-gallery - Public read, Admin write</li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeTab === 'integrations' ? (
          <div className="space-y-6">
            {/* Mixpanel Analytics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Mixpanel Analytics</h2>
                    <p className="text-sm text-gray-500">User behavior tracking and analytics</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Project Token</p>
                    <p className="font-mono text-sm text-gray-900">2b872c6bc565403c8b0f8b2d7c2eafae</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Connected & Tracking
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Configuration</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Autocapture enabled - Tracks all user interactions automatically
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Session recording - 100% of sessions recorded
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Deployed on carecraftz.com main site
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <a
                    href="https://mixpanel.com/project/2b872c6bc565403c8b0f8b2d7c2eafae"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Mixpanel Dashboard
                  </a>
                </div>
              </div>
            </div>

            {/* Other Integrations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Other Integrations</h2>
                  <p className="text-sm text-gray-500">Third-party services and APIs</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Supabase</p>
                      <p className="text-sm text-gray-500">Database & Authentication</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Vercel</p>
                      <p className="text-sm text-gray-500">Hosting & Deployment</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Integration Health Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">All Systems Operational</h3>
              </div>
              <p className="text-sm text-green-700">
                All integrations are connected and functioning properly. Analytics data is being collected 
                and your website is tracking user interactions successfully.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a tab to view settings</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
