'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiEdit, FiEye, FiPackage, FiRefreshCw, FiSave, FiTool, FiUsers, FiUserCheck, FiClock, FiXCircle } from 'react-icons/fi'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/format'
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

type DashboardResponse = {
  stats: AdminStats
  pendingItems: PendingItem[]
  paymentMethods: {
    easyPaisaAccount: string
    jazzCashAccount: string
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    userName: string
    shippingAddress: string
    totalAmount: number
    paymentMethod: string
    paymentStatus: string
    paymentProof?: string
    status: string
    createdAt: string
  }>
  recentBookings: Array<{
    id: string
    serviceTitle: string
    userName: string
    userAddress: string
    totalAmount: number
    paymentMethod: string
    paymentStatus: string
    paymentProof?: string
    status: string
    createdAt: string
  }>
}

export default function AdminDashboard() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState({ easyPaisaAccount: '', jazzCashAccount: '' })
  const [recentOrders, setRecentOrders] = useState<DashboardResponse['recentOrders']>([])
  const [recentBookings, setRecentBookings] = useState<DashboardResponse['recentBookings']>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentEditMode, setPaymentEditMode] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DashboardResponse['recentOrders'][0] | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<DashboardResponse['recentBookings'][0] | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showBookingDetails, setShowBookingDetails] = useState(false)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<DashboardResponse>('/api/admin/dashboard')
      setStats(response.stats)
      setPendingItems(response.pendingItems)
      setPaymentMethods(response.paymentMethods)
      setRecentOrders(response.recentOrders)
      setRecentBookings(response.recentBookings)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load admin dashboard.')
    } finally {
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
      return
    }

    try {
      setProcessingId(item.id)
      await apiRequest('/api/admin/approvals', {
        method: 'POST',
        body: JSON.stringify({ kind: item.type, id: item.id, action }),
      })

      toast.success(`${item.type === 'product' ? 'Product' : 'Service'} ${action}d successfully.`)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update approval.')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePaymentSave = async () => {
    try {
      setPaymentSaving(true)
      await apiRequest('/api/payment-methods', {
        method: 'PUT',
        body: JSON.stringify({
          email: user.email,
          easyPaisaAccount: paymentMethods.easyPaisaAccount,
          jazzCashAccount: paymentMethods.jazzCashAccount,
        }),
      })
      toast.success('Admin payment methods updated.')
      setPaymentEditMode(false)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save payment methods.')
    } finally {
      setPaymentSaving(false)
    }
  }

  const handlePaymentEdit = () => {
    setPaymentEditMode(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="admin" />

      <div className="ml-0 min-h-screen p-4 pt-16 sm:p-6 md:p-8 lg:ml-64 lg:pt-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 sm:text-base">Manage approvals, shared payment settings, and payment status across orders and service bookings.</p>
            </div>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs text-primary-900 sm:mt-4 sm:p-4 sm:text-sm">
            Products and services stay hidden from users until you approve them here. Easypaisa and JazzCash numbers shown at checkout are controlled only from this dashboard.
          </div>
        </div>

        {loading || !stats ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-600 shadow-md sm:p-8 sm:text-base">Loading dashboard...</div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <button
                onClick={() => router.push('/admin/dashboard/users')}
                className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalUsers}</p>
                    <p className="mt-1 text-xs text-green-600 sm:mt-2 sm:text-sm">{stats.newUsersThisMonth} new this month</p>
                  </div>
                  <FiUsers className="h-10 w-10 text-primary-600 sm:h-12 sm:w-12" />
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/dashboard/products')}
                className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Marketplace Products</p>
                    <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalProducts}</p>
                    <p className="mt-1 text-xs text-blue-600 sm:mt-2 sm:text-sm">{stats.newProductsThisMonth} new this month</p>
                  </div>
                  <FiPackage className="h-10 w-10 text-blue-600 sm:h-12 sm:w-12" />
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/dashboard/services')}
                className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Marketplace Services</p>
                    <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalServices}</p>
                    <p className="mt-1 text-xs text-indigo-600 sm:mt-2 sm:text-sm">{stats.newServicesThisMonth} new this month</p>
                  </div>
                  <FiTool className="h-10 w-10 text-indigo-600 sm:h-12 sm:w-12" />
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/dashboard/vendors')}
                className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Vendors</p>
                    <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalVendors}</p>
                  </div>
                  <FiUserCheck className="h-10 w-10 text-teal-600 sm:h-12 sm:w-12" />
                </div>
              </button>
              <button
                onClick={() => router.push('/admin/dashboard/providers')}
                className="rounded-xl bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Service Providers</p>
                    <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{stats.totalProviders}</p>
                  </div>
                  <FiUsers className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" />
                </div>
              </button>
              <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 sm:text-sm">Pending Approvals</p>
                    <p className="text-2xl font-bold text-yellow-600 sm:text-3xl">{stats.pendingApprovals}</p>
                  </div>
                  <FiClock className="h-10 w-10 text-yellow-600 sm:h-12 sm:w-12" />
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-white p-4 shadow-md sm:mb-8 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Checkout Payment Settings</h2>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">These numbers are shown on cart and service booking pages for manual payments.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">Easypaisa number</label>
                  <input
                    type="text"
                    value={paymentMethods.easyPaisaAccount}
                    onChange={(event) => setPaymentMethods((current) => ({ ...current, easyPaisaAccount: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="03XX-XXXXXXX"
                    disabled={!paymentEditMode}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">JazzCash number</label>
                  <input
                    type="text"
                    value={paymentMethods.jazzCashAccount}
                    onChange={(event) => setPaymentMethods((current) => ({ ...current, jazzCashAccount: event.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="03XX-XXXXXXX"
                    disabled={!paymentEditMode}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                {!paymentEditMode ? (
                  <button
                    onClick={handlePaymentEdit}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white transition hover:bg-primary-700"
                  >
                    <FiEdit className="h-4 w-4" />
                    Edit Payment Settings
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePaymentSave}
                      disabled={paymentSaving}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                    >
                      <FiSave className="h-4 w-4" />
                      {paymentSaving ? 'Saving...' : 'Save Payment Settings'}
                    </button>
                    <button
                      onClick={() => {
                        setPaymentEditMode(false)
                        loadDashboard()
                      }}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-white shadow-md sm:mb-8">
              <div className="border-b border-gray-200 p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Pending Approvals</h2>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">Approve or reject new marketplace entries.</p>
              </div>

              {pendingItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">No pending items right now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Owner</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingItems.map((item) => (
                        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-900 sm:px-6 sm:py-4 sm:text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">{item.ownerName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">{item.location}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">{formatDate(item.createdAt)}</td>
                          <td className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex gap-2 sm:gap-3">
                              <button
                                onClick={() => handleApproval(item, 'approve')}
                                disabled={processingId === item.id}
                                className="rounded-lg p-1.5 text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2"
                              >
                                <FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <button
                                onClick={() => handleApproval(item, 'reject')}
                                disabled={processingId === item.id}
                                className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2"
                              >
                                <FiXCircle className="h-4 w-4 sm:h-5 sm:w-5" />
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">Recent Orders</h2>
                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-600">No recent orders.</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">#{order.orderNumber.slice(-8)}</p>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">{order.userName}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500">
                          {order.paymentMethod} / payment {order.paymentStatus} / {formatDate(order.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">{order.shippingAddress}</p>
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderDetails(true)
                          }}
                          className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">Recent Bookings</h2>
                <div className="space-y-3">
                  {recentBookings.length === 0 ? (
                    <p className="text-sm text-gray-600">No recent bookings.</p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">{booking.serviceTitle}</p>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{booking.status}</span>
                        </div>
                        <p className="text-sm text-gray-600">{booking.userName}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(booking.totalAmount)}</p>
                        <p className="text-xs text-gray-500">
                          {booking.paymentMethod} / payment {booking.paymentStatus} / {formatDate(booking.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">{booking.userAddress}</p>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingDetails(true)
                          }}
                          className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {showOrderDetails && selectedOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                  <button
                    onClick={() => {
                      setShowOrderDetails(false)
                      setSelectedOrder(null)
                    }}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <FiXCircle className="h-5 w-5" />
                  </button>

                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                    <p className="mt-1 text-sm text-gray-600">Order #{selectedOrder.orderNumber.slice(-8)}</p>
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-900">Customer Information</h3>
                      <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-800">{selectedOrder.userName}</span></p>
                      <p className="text-sm text-gray-600">Address: <span className="font-medium text-gray-800">{selectedOrder.shippingAddress}</span></p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-3 font-semibold text-gray-900">Payment Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className="font-medium">{selectedOrder.paymentStatus}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Order Status:</span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{selectedOrder.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">{formatDate(selectedOrder.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.paymentProof && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-2 font-semibold text-gray-900">Payment Screenshot</h3>
                        <img
                          src={selectedOrder.paymentProof || ''}
                          alt="Payment proof"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showBookingDetails && selectedBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                  <button
                    onClick={() => {
                      setShowBookingDetails(false)
                      setSelectedBooking(null)
                    }}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <FiXCircle className="h-5 w-5" />
                  </button>

                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                    <p className="mt-1 text-sm text-gray-600">{selectedBooking.serviceTitle}</p>
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-2 font-semibold text-gray-900">Customer Information</h3>
                      <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-800">{selectedBooking.userName}</span></p>
                      <p className="text-sm text-gray-600">Address: <span className="font-medium text-gray-800">{selectedBooking.userAddress}</span></p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <h3 className="mb-3 font-semibold text-gray-900">Booking Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{selectedBooking.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className="font-medium">{selectedBooking.paymentStatus}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Booking Status:</span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{selectedBooking.status}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Booking Date:</span>
                          <span className="font-medium">{formatDate(selectedBooking.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedBooking.paymentProof && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-2 font-semibold text-gray-900">Payment Screenshot</h3>
                        <img
                          src={selectedBooking.paymentProof || ''}
                          alt="Payment proof"
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
