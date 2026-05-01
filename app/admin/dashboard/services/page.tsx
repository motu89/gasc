'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiTool, FiTrash2 } from 'react-icons/fi'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'

type Service = {
  id: string
  title: string
  description: string
  category: string
  location: string
  hourlyRate: number
  available: boolean
  approved: boolean
  providerName: string
  providerEmail: string
  images: string[]
  createdAt: string
}

export default function AdminServicesManagement() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadServices = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<{ services: Service[] }>('/api/admin/services')
      setServices(response.services)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load services.')
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

    loadServices()
  }, [hydrated, router, user])

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-600">Loading...</div>
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(serviceId)
      await apiRequest(`/api/admin/services?serviceId=${serviceId}`, { method: 'DELETE' })
      toast.success('Service deleted successfully.')
      await loadServices()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete service.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="admin" />

      <div className="ml-0 min-h-screen p-4 pt-16 sm:p-6 md:p-8 lg:ml-64 lg:pt-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FiTool className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Service Management</h1>
                <p className="mt-1 text-sm text-gray-600">Manage all marketplace services</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadServices}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-600 shadow-md">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-600 shadow-md">No services found.</div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-md sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <MarketplaceImage
                    src={service.images[0]}
                    alt={service.title}
                    fallbackLabel={service.title}
                    className="h-24 w-24 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        service.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {service.approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        service.available ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {service.available ? 'Available' : 'Hidden'}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-600">Provider: {service.providerName}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-bold text-primary-600">{formatCurrency(service.hourlyRate)}/hour</span>
                      <span className="text-gray-600">{service.category}</span>
                      <span className="text-gray-600">{service.location}</span>
                      <span className="text-gray-600">{formatDate(service.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={deletingId === service.id}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    {deletingId === service.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
