'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ServiceCard from '@/components/services/ServiceCard'
import { apiRequest } from '@/lib/api-client'
import { Service } from '@/types'

export default function FeaturedServices() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    apiRequest<{ services: Service[] }>('/api/services?approvedOnly=true&limit=3')
      .then((response) => setServices(response.services))
      .catch((error) => console.error(error))
  }, [])

  return (
    <section className="bg-white py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Featured Services</h2>
          <Link href="/services" className="font-semibold text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">
            No services have been added yet.
          </div>
        )}
      </div>
    </section>
  )
}
