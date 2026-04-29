'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiCalendar, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi'
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

  const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0)
  const activeBookings = bookings.filter(
    (booking) => booking.status === 'pending' || booking.status === 'confirmed'
  ).length
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length
  const pendingServices = services.filter((service) => !service.approved).length

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="service_provider" />

      <div className="ml-0 lg:ml-64 min-h-screen p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Service Provider Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Manage services, bookings, and service images from one place.</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null)
              setShowForm((current) => !current)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white transition hover:bg-primary-700"
          >
            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            {showForm && !editingService ? 'Hide Form' : 'Add Service'}
          </button>
        </div>

        <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Total Services</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{services.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Active Bookings</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{activeBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Waiting Approval</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">{pendingServices}</p>
          </div>
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{formatCurrency(totalEarnings)}</p>
          </div>
        </div>

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
                {services.map((service) => (
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
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{service.title}</h3>
                          <span
                            className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                              service.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {service.available ? 'Available' : 'Hidden'}
                          </span>
                          <span
                            className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                              service.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {service.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{service.category} - {service.location}</p>
                        <p className="mt-2 text-sm sm:text-base font-bold text-primary-600">{formatCurrency(service.hourlyRate)}/hour</p>
                        {!service.approved && (
                          <p className="mt-2 text-xs sm:text-sm font-medium text-yellow-700">
                            This service will be visible to users after admin approval.
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

          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-900">Recent Bookings</h2>
            <p className="mb-4 text-xs sm:text-sm text-gray-500">Completed bookings: {completedBookings}</p>

            {loading ? (
              <div className="text-sm sm:text-base text-gray-600">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">
                No bookings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{booking.serviceTitle}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">Customer: {booking.userName}</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">{formatDate(booking.date)} at {booking.time}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Duration: {booking.duration} hour(s)</p>
                        <p className="mt-2 text-sm sm:text-base font-bold text-primary-600">{formatCurrency(booking.totalAmount)}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
