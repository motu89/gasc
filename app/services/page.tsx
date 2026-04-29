'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import ServiceCard from '@/components/services/ServiceCard'
import { apiRequest } from '@/lib/api-client'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { Service } from '@/types'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    setLoading(true)
    apiRequest<{ services: Service[] }>('/api/services?approvedOnly=true')
      .then((response) => setServices(response.services))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false))
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.providerName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, services])

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 sm:mb-6 md:mb-8 text-3xl sm:text-4xl font-bold text-black">Services</h1>

        <div className="mb-6 sm:mb-8 rounded-lg bg-white p-3 sm:p-4 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] md:grid-cols-[1fr_260px] gap-3 sm:gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services, categories, or providers..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 sm:pl-10 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 sm:p-10 text-center text-sm sm:text-base text-gray-600 shadow-md">
            Loading services...
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 sm:p-10 text-center text-sm sm:text-base text-gray-600 shadow-md">
            No services found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
