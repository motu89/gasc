'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiEdit, FiPlus, FiTrash2, FiDollarSign, FiUpload, FiEye, FiX } from 'react-icons/fi'
import ServiceForm from '@/components/forms/ServiceForm'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Booking, Service } from '@/types'

type ServiceFormValues = {
  title: string
  description: string
  category: string
  images: string[]
  hourlyRate: string
  location: string
  available: boolean
}

export default function ProviderDashboard() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState({ easyPaisaAccount: '', jazzCashAccount: '' })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [confirmingBooking, setConfirmingBooking] = useState(false)

  const loadDashboard = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [servicesResponse, bookingsResponse, paymentResponse] = await Promise.all([
        apiRequest<{ services: Service[] }>(`/api/services?providerId=${user.id}`),
        apiRequest<{ bookings: Booking[] }>(`/api/bookings?providerId=${user.id}`),
        apiRequest<{ user: { easyPaisaAccount: string; jazzCashAccount: string } }>(`/api/payment-methods?email=${user.email}`),
      ])
      setServices(servicesResponse.services)
      setBookings(bookingsResponse.bookings)
      setPaymentMethods(paymentResponse.user)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hydrated) return
    if (!user || user.role !== 'service_provider') {
      router.push('/auth/login')
      return
    }
    loadDashboard()
  }, [hydrated, router, user])

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-600">Loading dashboard...</div>
  }

  if (!user || user.role !== 'service_provider') {
    return null
  }

  const totalDeposits = bookings.reduce((sum, booking) => sum + (booking.depositAmount || 0), 0)
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const pendingServices = services.filter(s => !s.approved).length

  const handleSubmit = async (values: ServiceFormValues) => {
    try {
      setSaving(true)
      const payload = {
        ...values,
        hourlyRate: Number(values.hourlyRate),
        providerId: user.id,
        providerName: user.name,
      }

      if (editingService) {
        await apiRequest(`/api/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Service updated. You have to wait for the admin approval.')
      } else {
        await apiRequest('/api/services', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Service added. You have to wait for the admin approval.')
      }

      setEditingService(null)
      setShowForm(false)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save service.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    try {
      await apiRequest(`/api/services/${serviceId}?providerId=${user.id}`, { method: 'DELETE' })
      toast.success('Service deleted.')
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete service.')
    }
  }

  const handlePaymentMethodSubmit = async () => {
    if (!paymentMethods.easyPaisaAccount && !paymentMethods.jazzCashAccount) {
      toast.error('Please add at least one payment method.')
      return
    }
    try {
      setPaymentSaving(true)
      await apiRequest('/api/payment-methods', {
        method: 'PUT',
        body: JSON.stringify({ email: user.email, ...paymentMethods }),
      })
      toast.success('Payment methods updated successfully.')
      setShowPaymentForm(false)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update payment methods.')
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      setConfirmingBooking(true)
      await apiRequest('/api/bookings', {
        method: 'PATCH',
        body: JSON.stringify({ bookingId, status: 'confirmed', providerId: user.id }),
      })
      toast.success('Booking confirmed successfully!')
      setShowBookingDetails(false)
      setSelectedBooking(null)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm booking.')
    } finally {
      setConfirmingBooking(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="service_provider" />

      <div className="ml-0 lg:ml-64 min-h-screen p-4 sm:p-6 md:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Service Provider Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Manage services, bookings, and payment methods from one place.</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              setShowForm(current => !current)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-primary-700"
          >
            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            {showForm && !editingService ? 'Hide Form' : 'Add Service'}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="rounded-xl bg-white p-3 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Total Services</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{services.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Active Bookings</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{activeBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-3 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Waiting Approval</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600">{pendingServices}</p>
          </div>
          <div className="rounded-xl bg-white p-3 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Deposits Received</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{formatCurrency(totalDeposits)}</p>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-6 sm:mb-8 rounded-xl bg-white p-4 sm:p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Methods</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Add your EasyPaisa and JazzCash account numbers to receive payments</p>
            </div>
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-green-700"
            >
              <FiDollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              {showPaymentForm ? 'Cancel' : 'Add Payment Method'}
            </button>
          </div>

          {showPaymentForm ? (
            <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-lg">💳</span>
                      </div>
                      <span className="font-semibold text-sm text-gray-900">EasyPaisa</span>
                    </div>
                    <span className="text-xs text-gray-600">Enter your EasyPaisa account number</span>
                  </div>
                  <input
                    type="text"
                    value={paymentMethods.easyPaisaAccount}
                    onChange={e => setPaymentMethods(prev => ({ ...prev, easyPaisaAccount: e.target.value }))}
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-lg">💰</span>
                      </div>
                      <span className="font-semibold text-sm text-gray-900">JazzCash</span>
                    </div>
                    <span className="text-xs text-gray-600">Enter your JazzCash account number</span>
                  </div>
                  <input
                    type="text"
                    value={paymentMethods.jazzCashAccount}
                    onChange={e => setPaymentMethods(prev => ({ ...prev, jazzCashAccount: e.target.value }))}
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handlePaymentMethodSubmit}
                  disabled={paymentSaving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm sm:text-base text-white transition hover:bg-primary-700 disabled:opacity-60"
                >
                  <FiUpload className="h-4 w-4" />
                  {paymentSaving ? 'Saving...' : 'Save Payment Methods'}
                </button>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm sm:text-base text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">EasyPaisa</p>
                    <p className="text-xs text-gray-600">Mobile Account</p>
                  </div>
                </div>
                {paymentMethods.easyPaisaAccount ? (
                  <p className="text-lg font-mono font-bold text-green-700">{paymentMethods.easyPaisaAccount}</p>
                ) : (
                  <p className="text-sm text-gray-500">Not added yet</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">JazzCash</p>
                    <p className="text-xs text-gray-600">Mobile Account</p>
                  </div>
                </div>
                {paymentMethods.jazzCashAccount ? (
                  <p className="text-lg font-mono font-bold text-red-700">{paymentMethods.jazzCashAccount}</p>
                ) : (
                  <p className="text-sm text-gray-500">Not added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Service Form */}
        {(showForm || editingService) && (
          <div className="mb-6 sm:mb-8 rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
            <ServiceForm
              initialService={editingService}
              isSubmitting={saving}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditingService(null)
                setShowForm(false)
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 xl:grid-cols-2">
          {/* My Services */}
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">My Services</h2>
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 text-xs sm:text-sm text-yellow-900">
              When you add or update a service, you have to wait for the admin approval before it shows to users.
            </div>

            {loading ? (
              <div className="text-sm sm:text-base text-gray-600">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">
                No services added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map(service => (
                  <div key={service.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <MarketplaceImage
                        src={service.images[0]}
                        alt={service.title}
                        fallbackLabel={service.title}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{service.title}</h3>
                          <span className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${service.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {service.available ? 'Available' : 'Hidden'}
                          </span>
                          <span className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${service.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {service.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{service.category} - {service.location}</p>
                        <p className="mt-2 text-sm sm:text-base font-bold text-primary-600">{formatCurrency(service.hourlyRate)}/hour</p>
                        {!service.approved && (
                          <p className="mt-2 text-xs sm:text-sm font-medium text-yellow-700">
                            Visible to users after admin approval.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setEditingService(service)
                            setShowForm(true)
                          }}
                          className="rounded-lg border border-blue-200 p-2 sm:p-3 text-blue-600 transition hover:bg-blue-50"
                        >
                          <FiEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="rounded-lg border border-red-200 p-2 sm:p-3 text-red-600 transition hover:bg-red-50"
                        >
                          <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h2 className="mb-1 text-xl sm:text-2xl font-bold text-gray-900">Recent Bookings</h2>
            <p className="mb-4 text-xs sm:text-sm text-gray-500">Completed: {completedBookings}</p>

            {loading ? (
              <div className="text-sm sm:text-base text-gray-600">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">
                No bookings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{booking.serviceTitle}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Customer: {booking.userName}</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{formatDate(booking.date)} at {booking.time}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Duration: {booking.duration} hour(s)</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs sm:text-sm text-gray-700">
                            <span className="font-medium">Full Price:</span> {formatCurrency(booking.fullPrice || booking.totalAmount)}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-green-600">
                            Deposit Paid (10%): {formatCurrency(booking.depositAmount || booking.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusStyle(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingDetails(true)
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs sm:text-sm text-white transition hover:bg-primary-700 whitespace-nowrap"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          View Proof
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => {
                setShowBookingDetails(false)
                setSelectedBooking(null)
              }}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <FiX className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedBooking.serviceTitle}</p>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Customer Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-800">{selectedBooking.userName}</span></p>
              </div>

              {/* Booking Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium text-gray-800">{selectedBooking.time}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-800">{selectedBooking.duration} hour(s)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyle(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Full Service Price:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.fullPrice || selectedBooking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deposit Paid (10%):</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedBooking.depositAmount || selectedBooking.totalAmount)}</span>
                  </div>
                  {(selectedBooking as any).paymentMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(selectedBooking as any).paymentMethod === 'easypaisa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {(selectedBooking as any).paymentMethod === 'easypaisa' ? '💳 EasyPaisa' : '💰 JazzCash'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof */}
              {(selectedBooking as any).paymentProof ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Proof Screenshot</h3>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={(selectedBooking as any).paymentProof}
                      alt="Payment proof"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Verify the payment screenshot before confirming the booking
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">No payment proof uploaded for this booking.</p>
                </div>
              )}

              {/* Action */}
              {selectedBooking.status === 'pending' ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-800 mb-3 font-medium">
                    ✅ After verifying the payment proof above, confirm this booking to notify the customer.
                  </p>
                  <button
                    onClick={() => handleConfirmBooking(selectedBooking.id)}
                    disabled={confirmingBooking}
                    className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmingBooking ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Confirming...
                      </>
                    ) : (
                      '✓ Confirm Booking'
                    )}
                  </button>
                </div>
              ) : (
                <div className={`rounded-lg border p-4 text-center ${
                  selectedBooking.status === 'confirmed' ? 'border-green-200 bg-green-50'
                  : selectedBooking.status === 'completed' ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className={`text-sm font-semibold ${
                    selectedBooking.status === 'confirmed' ? 'text-green-800'
                    : selectedBooking.status === 'completed' ? 'text-blue-800'
                    : 'text-gray-700'
                  }`}>
                    Booking is {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
