'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiPackage, FiTool, FiUsers, FiXCircle, FiRefreshCw } from 'react-icons/fi'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { apiRequest } from '@/lib/api-client'
import { formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'

type AdminStats = {
  totalUsers: number
  totalVendors: number
  totalProviders: number
  pendingApprovals: number
  totalProducts: number
  totalServices: number
  totalBookings: number
  newUsersThisMonth: number
  newProductsThisMonth: number
  newServicesThisMonth: number
}

type PendingItem = {
  id: string
  type: 'product' | 'service'
  name: string
  ownerName: string
  location: string
  createdAt: string
}

export default function AdminDashboard() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render

  const loadDashboard = async () => {
    console.log('loadDashboard called, setting loading to true')
    setLoading(true)
    try {
      console.log('Fetching dashboard data from API...')
      const response = await apiRequest<{ stats: AdminStats; pendingItems: PendingItem[] }>(
        '/api/admin/dashboard'
      )
      console.log('Dashboard data received:', response)
      console.log(`Pending items count: ${response.pendingItems.length}`)
      console.log('Pending items:', response.pendingItems)
      
      // Clear old state first, then set new state
      setStats(null)
      setPendingItems([])
      
      // Force re-render
      setRefreshKey(prev => prev + 1)
      
      // Set new data
      setStats(response.stats)
      setPendingItems(response.pendingItems)
      
      console.log('Dashboard state updated successfully')
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to load admin dashboard.')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hydrated) return

    if (!user || user.role !== 'admin') {
      router.push('/auth/login')
      return
    }

    loadDashboard()
  }, [hydrated, router, user])

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-600">Loading dashboard...</div>
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const handleApproval = async (item: PendingItem, action: 'approve' | 'reject') => {
    if (processingId) {
      console.log('Already processing another approval, ignoring click')
      return; // Prevent double-clicking
    }
    
    try {
      setProcessingId(item.id);
      console.log(`Processing approval: ${action} ${item.type} ${item.id}`);
      
      await apiRequest('/api/admin/approvals', {
        method: 'POST',
        body: JSON.stringify({ kind: item.type, id: item.id, action }),
      })
      
      console.log(`Approval API call successful for ${item.id}`)
      toast.success(`${item.type === 'product' ? 'Product' : 'Service'} ${action}d successfully.`)
      
      // Small delay to ensure MongoDB has updated
      console.log('Waiting 500ms for MongoDB to update...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('Reloading dashboard after approval...')
      // Reload dashboard data
      await loadDashboard()
      console.log('Dashboard reload complete')
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to update approval.')
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="admin" />

      <div className="ml-0 lg:ml-64 min-h-screen p-4 sm:p-6 md:p-8 pt-16 lg:pt-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Review marketplace activity, user growth, and any pending items.</p>
            </div>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="mt-3 sm:mt-4 rounded-xl border border-primary-100 bg-primary-50 p-3 sm:p-4 text-xs sm:text-sm text-primary-900">
            Products and services stay hidden from users until you approve them here.
          </div>
        </div>

        {loading || !stats ? (
          <div className="rounded-xl bg-white p-6 sm:p-8 text-sm sm:text-base text-gray-600 shadow-md">Loading dashboard...</div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600">{stats.newUsersThisMonth} new this month</p>
                  </div>
                  <FiUsers className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Marketplace Products</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-blue-600">{stats.newProductsThisMonth} new this month</p>
                  </div>
                  <FiPackage className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Marketplace Services</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalServices}</p>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-indigo-600">{stats.newServicesThisMonth} new this month</p>
                  </div>
                  <FiTool className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <p className="text-xs sm:text-sm text-gray-600">Vendors</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
              </div>
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <p className="text-xs sm:text-sm text-gray-600">Service Providers</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalProviders}</p>
              </div>
              <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
                <p className="text-xs sm:text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white shadow-md" key={`table-${refreshKey}`}>
              <div className="border-b border-gray-200 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Approvals</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">Approve or reject new marketplace entries.</p>
              </div>

              {pendingItems.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">No pending items right now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Type</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Owner</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Location</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingItems.map((item) => (
                        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                              item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900">{item.name}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{item.ownerName}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{item.location}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex gap-2 sm:gap-3">
                              <button
                                onClick={() => handleApproval(item, 'approve')}
                                disabled={processingId === item.id}
                                className="rounded-lg p-1.5 sm:p-2 text-green-600 transition hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === item.id ? (
                                  <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                                ) : (
                                  <FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleApproval(item, 'reject')}
                                disabled={processingId === item.id}
                                className="rounded-lg p-1.5 sm:p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === item.id ? (
                                  <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                                ) : (
                                  <FiXCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
