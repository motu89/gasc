'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiTrash2, FiUsers } from 'react-icons/fi'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { apiRequest } from '@/lib/api-client'
import { formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'

type Provider = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export default function AdminProvidersManagement() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadProviders = async () => {
    setLoading(true)
    try {
      const response = await apiRequest<{ providers: Provider[] }>('/api/admin/providers')
      setProviders(response.providers)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load service providers.')
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

    loadProviders()
  }, [hydrated, router, user])

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-600">Loading...</div>
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this service provider? This will also remove access to their services. This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(providerId)
      await apiRequest(`/api/admin/providers?providerId=${providerId}`, { method: 'DELETE' })
      toast.success('Service provider deleted successfully.')
      await loadProviders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete service provider.')
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
              <FiUsers className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Service Provider Management</h1>
                <p className="mt-1 text-sm text-gray-600">Manage all service providers</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadProviders}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-600 shadow-md">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-600 shadow-md">No service providers found.</div>
        ) : (
          <div className="rounded-xl bg-white shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Email</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm md:table-cell">Phone</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm lg:table-cell">Address</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm md:table-cell">Registered</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 sm:px-6 sm:py-4 sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sm:px-6 sm:py-4">{provider.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 sm:px-6 sm:py-4">{provider.email}</td>
                      <td className="hidden px-4 py-3 text-sm text-gray-600 sm:px-6 sm:py-4 md:table-cell">{provider.phone || 'N/A'}</td>
                      <td className="hidden max-w-xs truncate px-4 py-3 text-sm text-gray-600 sm:px-6 sm:py-4 lg:table-cell" title={provider.address}>{provider.address || 'N/A'}</td>
                      <td className="hidden px-4 py-3 text-sm text-gray-600 sm:px-6 sm:py-4 md:table-cell">{formatDate(provider.createdAt)}</td>
                      <td className="px-4 py-3 text-center sm:px-6 sm:py-4">
                        <button
                          onClick={() => handleDelete(provider.id)}
                          disabled={deletingId === provider.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          {deletingId === provider.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
