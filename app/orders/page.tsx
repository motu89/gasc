'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiCalendar, FiPackage, FiShoppingBag, FiClock, FiMapPin, FiDollarSign, FiEye, FiXCircle } from 'react-icons/fi'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Booking, Order } from '@/types'

type OrderType = 'product' | 'service'

interface CombinedOrder {
  id: string
  type: OrderType
  orderNumber?: string
  title: string
  description: string
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  vendorOrProviderName: string
  items?: any[]
  date?: string
  time?: string
  duration?: number
  userAddress?: string
}

export default function OrdersPage() {
  const { user, hydrated } = useStore()
  const router = useRouter()
  const [orders, setOrders] = useState<CombinedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | OrderType>('all')
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!hydrated) return

    if (!user) {
      toast.error('Please login to view your orders.')
      router.push('/auth/login')
      return
    }

    fetchOrders()
  }, [user, hydrated])

  // Update current time every minute for cancellation countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)

      const [ordersRes, bookingsRes] = await Promise.all([
        apiRequest<{ orders: Order[] }>(`/api/orders?userId=${user.id}`),
        apiRequest<{ bookings: Booking[] }>(`/api/bookings?userId=${user.id}`),
      ])

      const combined: CombinedOrder[] = []

      // Process product orders
      ordersRes.orders.forEach((order) => {
        const itemDescriptions = order.items
          .map((item) => `${item.productTitle}${item.rentalDays ? ` (${item.rentalDays} days)` : ''}`)
          .join(', ')

        combined.push({
          id: order.id,
          type: 'product',
          orderNumber: order.orderNumber,
          title: `Order #${order.orderNumber}`,
          description: itemDescriptions,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod.toUpperCase(),
          paymentStatus: order.paymentStatus,
          status: order.status,
          createdAt: order.createdAt,
          vendorOrProviderName: order.vendorName,
          items: order.items,
        })
      })

      // Process service bookings
      bookingsRes.bookings.forEach((booking) => {
        combined.push({
          id: booking.id,
          type: 'service',
          title: booking.serviceTitle,
          description: `Booked for ${booking.date} at ${booking.time}`,
          totalAmount: booking.totalAmount,
          paymentMethod: (booking.paymentMethod || 'N/A').toUpperCase(),
          paymentStatus: booking.paymentStatus,
          status: booking.status,
          createdAt: booking.createdAt,
          vendorOrProviderName: booking.providerName,
          date: booking.date,
          time: booking.time,
          duration: booking.duration,
          userAddress: booking.userAddress,
        })
      })

      // Sort by date (newest first)
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setOrders(combined)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load your orders.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string, type: OrderType) => {
    if (!confirm('Are you sure you want to cancel this? A 5% cancellation fee will be applied.')) {
      return
    }

    try {
      setCancellingOrderId(orderId)
      const endpoint = type === 'product' ? '/api/orders/cancel' : '/api/bookings/cancel'
      const bodyKey = type === 'product' ? 'orderId' : 'bookingId'

      const response = await apiRequest<{ refundAmount: number; penaltyAmount: number }>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          [bodyKey]: orderId,
          userId: user?.id,
        }),
      })

      toast.success(`Cancelled successfully. Refund amount: ${formatCurrency(response.refundAmount)}`)
      
      // Refresh orders
      fetchOrders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const canCancel = (order: CombinedOrder) => {
    if (order.status === 'cancelled' || order.status === 'completed' || order.status === 'delivered') {
      return false
    }
    const createdAt = new Date(order.createdAt)
    const now = currentTime
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    return minutesSinceCreation <= 30
  }

  const getTimeRemaining = (order: CombinedOrder) => {
    const createdAt = new Date(order.createdAt)
    const now = currentTime
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    const minutesRemaining = 30 - minutesSinceCreation
    
    if (minutesRemaining <= 0) return null
    
    const minutes = Math.floor(minutesRemaining)
    const seconds = Math.floor((minutesRemaining - minutes) * 60)
    
    return `${minutes}m ${seconds}s`
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    return order.type === filter
  })

  const productOrdersCount = orders.filter((o) => o.type === 'product').length
  const serviceBookingsCount = orders.filter((o) => o.type === 'service').length

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow-md">
            Loading your orders...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold text-black sm:text-4xl">My Orders & Bookings</h1>
          <p className="mt-2 text-gray-600">Track all your product purchases and service bookings in one place.</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                <FiPackage className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Orders</p>
                <p className="text-2xl font-bold text-black">{productOrdersCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
                <FiCalendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Service Bookings</p>
                <p className="text-2xl font-bold text-black">{serviceBookingsCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
                <FiDollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-black">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 rounded-lg bg-white p-2 shadow-md sm:mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilter('product')}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
                filter === 'product'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Products ({productOrdersCount})
            </button>
            <button
              onClick={() => setFilter('service')}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
                filter === 'service'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Services ({serviceBookingsCount})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          order.type === 'product'
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600'
                            : 'bg-gradient-to-br from-purple-500 to-purple-600'
                        }`}
                      >
                        {order.type === 'product' ? (
                          <FiShoppingBag className="h-5 w-5 text-white" />
                        ) : (
                          <FiCalendar className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-black">{order.title}</h3>
                        <p className="text-sm text-gray-600">
                          {order.type === 'product' ? 'Product Order' : 'Service Booking'} •{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs text-gray-600">
                        {order.type === 'product' ? 'Vendor' : 'Provider'}
                      </p>
                      <p className="font-medium text-black">{order.vendorOrProviderName}</p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-600">Payment Method</p>
                      <p className="font-medium text-black">{order.paymentMethod}</p>
                    </div>

                    {order.type === 'service' && order.date && (
                      <>
                        <div className="flex items-center gap-2">
                          <FiCalendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-600">Date</p>
                            <p className="font-medium text-black">{order.date}</p>
                          </div>
                        </div>

                        {order.time && (
                          <div className="flex items-center gap-2">
                            <FiClock className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-600">Time</p>
                              <p className="font-medium text-black">{order.time}</p>
                            </div>
                          </div>
                        )}

                        {order.duration && (
                          <div>
                            <p className="text-xs text-gray-600">Duration</p>
                            <p className="font-medium text-black">{order.duration} hour(s)</p>
                          </div>
                        )}
                      </>
                    )}

                    {order.type === 'product' && order.items && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="mb-2 text-xs text-gray-600">Items</p>
                        <p className="text-sm text-gray-700">{order.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Cancel Button */}
                  {canCancel(order) && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <FiClock className="h-4 w-4" />
                        <span className="font-semibold">
                          Cancellation available in: {getTimeRemaining(order)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCancelOrder(order.id, order.type)}
                        disabled={cancellingOrderId === order.id}
                        className="flex items-center gap-2 rounded-lg border-2 border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiXCircle className="h-4 w-4" />
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              {filter === 'product' ? (
                <FiShoppingBag className="h-10 w-10 text-gray-400" />
              ) : filter === 'service' ? (
                <FiCalendar className="h-10 w-10 text-gray-400" />
              ) : (
                <FiPackage className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">No orders found</h3>
            <p className="mb-6 text-gray-600">
              {filter === 'all'
                ? "You haven't placed any orders or bookings yet."
                : filter === 'product'
                ? "You haven't ordered any products yet."
                : "You haven't booked any services yet."}
            </p>
            <Link
              href={filter === 'service' ? '/services' : '/products'}
              className="inline-block rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 font-medium text-white shadow-md transition-all hover:from-primary-700 hover:to-primary-600"
            >
              {filter === 'service' ? 'Browse Services' : 'Browse Products'}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
