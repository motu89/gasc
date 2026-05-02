'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiEdit, FiEye, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetails, setShowBookingDetails] = useState(false)
  const [confirmingBooking, setConfirmingBooking] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState(false)

  const loadDashboard = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [servicesResponse, bookingsResponse] = await Promise.all([
        apiRequest<{ services: Service[] }>(`/api/services?providerId=${user.id}`),
        apiRequest<{ bookings: Booking[] }>(`/api/bookings?providerId=${user.id}`),
      ])
      setServices(servicesResponse.services)
      setBookings(bookingsResponse.bookings)
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

  const totalDeposits = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
  const activeBookings = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length
  const completedBookings = bookings.filter((b) => b.status === 'completed').length
  const pendingServices = services.filter((s) => !s.approved).length

  const handleSubmit = async (values: ServiceFormValues) => {
    try {
      setSaving(true)
      const payload = {
        ...values,
        hourlyRate: Number(values.hourlyRate),
        providerId: user.id,
        providerName: user.name,
        providerEmail: user.email,
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

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }

    try {
      setCancellingBooking(true)
      await apiRequest('/api/provider/bookings/cancel', {
        method: 'PATCH',
        body: JSON.stringify({ bookingId, providerId: user.id }),
      })
      toast.success('Booking cancelled successfully.')
      setShowBookingDetails(false)
      setSelectedBooking(null)
      await loadDashboard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel booking.')
    } finally {
      setCancellingBooking(false)
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="service_provider" />

      <div className="ml-0 min-h-screen p-4 pt-16 sm:p-6 md:p-8 lg:ml-64 lg:pt-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">Service Provider Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Manage services and review booking payments with customer addresses.</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              setShowForm((current) => !current)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm text-white transition hover:bg-primary-700 sm:px-6 sm:py-3 sm:text-base"
          >
            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            {showForm && !editingService ? 'Hide Form' : 'Add Service'}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-2 md:grid-cols-4 sm:gap-4 md:gap-6">
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-6">
            <p className="text-xs text-gray-600 sm:text-sm">Total Services</p>
            <p className="text-lg font-bold text-gray-800 sm:text-xl md:text-2xl lg:text-3xl">{services.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-6">
            <p className="text-xs text-gray-600 sm:text-sm">Active Bookings</p>
            <p className="text-lg font-bold text-blue-600 sm:text-xl md:text-2xl lg:text-3xl">{activeBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-6">
            <p className="text-xs text-gray-600 sm:text-sm">Waiting Approval</p>
            <p className="text-lg font-bold text-yellow-600 sm:text-xl md:text-2xl lg:text-3xl">{pendingServices}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-md sm:p-6">
            <p className="text-xs text-gray-600 sm:text-sm">Deposits Received</p>
            <p className="text-lg font-bold text-green-600 sm:text-xl md:text-2xl lg:text-3xl">{formatCurrency(totalDeposits)}</p>
          </div>
        </div>

        {(showForm || editingService) && (
          <div className="mb-6 rounded-xl bg-white p-4 shadow-md sm:mb-8 sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
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

        <div className="grid grid-cols-1 gap-4 md:gap-8 xl:grid-cols-2 sm:gap-6">
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">My Services</h2>
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900 sm:p-4 sm:text-sm">
              When you add or update a service, you have to wait for the admin approval before it shows to users.
            </div>

            {loading ? (
              <div className="text-sm text-gray-600 sm:text-base">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">
                No services added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                      <MarketplaceImage
                        src={service.images[0]}
                        alt={service.title}
                        fallbackLabel={service.title}
                        className="h-20 w-20 rounded-lg sm:h-24 sm:w-24"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base md:text-lg">{service.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${service.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {service.available ? 'Available' : 'Hidden'}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${service.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {service.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 sm:text-sm">{service.category} - {service.location}</p>
                        <p className="mt-2 text-sm font-bold text-primary-600 sm:text-base">{formatCurrency(service.hourlyRate)}/hour</p>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setEditingService(service)
                            setShowForm(true)
                          }}
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 sm:p-3"
                        >
                          <FiEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 sm:p-3"
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

          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">Recent Bookings</h2>
            <p className="mb-4 text-xs text-gray-500 sm:text-sm">Completed: {completedBookings}</p>

            {loading ? (
              <div className="text-sm text-gray-600 sm:text-base">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">
                No bookings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">{booking.serviceTitle}</h3>
                        <p className="truncate text-xs text-gray-600 sm:text-sm">Customer: {booking.userName}</p>
                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">{formatDate(booking.date)} at {booking.time}</p>
                        <p className="text-xs text-gray-600 sm:text-sm">Address: {booking.userAddress}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-700 sm:text-sm">
                            <span className="font-medium">Full Price:</span> {formatCurrency(booking.fullPrice || booking.totalAmount)}
                          </p>
                          <p className="text-xs font-semibold text-green-600 sm:text-sm">
                            Deposit Paid: {formatCurrency(booking.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-700 sm:text-sm">
                            Payment {booking.paymentStatus} via {booking.paymentMethod || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingDetails(true)
                          }}
                          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white transition hover:bg-primary-700 sm:text-sm"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          View Details
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

      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => {
                setShowBookingDetails(false)
                setSelectedBooking(null)
              }}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedBooking.serviceTitle}</p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-800">{selectedBooking.userName}</span></p>
                <p className="text-sm text-gray-600">Email: <span className="font-medium text-gray-800">{selectedBooking.userEmail || 'N/A'}</span></p>
                <p className="text-sm text-gray-600">Address: <span className="font-medium text-gray-800">{selectedBooking.userAddress}</span></p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Booking Details</h3>
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

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Payment Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Full Service Price:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedBooking.fullPrice || selectedBooking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deposit Paid:</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedBooking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedBooking.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-medium">{selectedBooking.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium">{selectedBooking.paymentReference || 'Not available yet'}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.paymentProof && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Payment Screenshot</h3>
                  <img
                    src={selectedBooking.paymentProof}
                    alt="Payment proof"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                  />
                </div>
              )}

              {selectedBooking.status === 'pending' ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="mb-3 text-sm font-medium text-green-800">
                      Confirm the booking when you are ready to proceed.
                    </p>
                    <button
                      onClick={() => handleConfirmBooking(selectedBooking.id)}
                      disabled={confirmingBooking}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {confirmingBooking ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-800">
                      Cancel this booking if you cannot accommodate it.
                    </p>
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={cancellingBooking}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancellingBooking ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  </div>
                </div>
              ) : selectedBooking.status === 'confirmed' ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <p className="text-sm font-semibold text-green-800">
                      Booking is Confirmed
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-800">
                      Need to cancel this confirmed booking?
                    </p>
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={cancellingBooking}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancellingBooking ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-lg border p-4 text-center ${
                  selectedBooking.status === 'completed' ? 'border-blue-200 bg-blue-50'
                  : selectedBooking.status === 'cancelled' ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className={`text-sm font-semibold ${
                    selectedBooking.status === 'completed' ? 'text-blue-800'
                    : selectedBooking.status === 'cancelled' ? 'text-red-800'
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
