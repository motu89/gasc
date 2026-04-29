'use client'

import Link from 'next/link'
import { FiClock, FiMapPin, FiStar } from 'react-icons/fi'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { formatCurrency } from '@/lib/format'
import { Service } from '@/types'

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link href={`/services/${service.id}`}>
      <div className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl">
        <MarketplaceImage
          src={service.images[0]}
          alt={service.title}
          fallbackLabel={service.title}
          className="h-48 w-full"
          imgClassName="transition-transform duration-300 group-hover:scale-110"
        />
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-800 transition group-hover:text-primary-600">
                {service.title}
              </h3>
              <p className="text-sm text-gray-500">{service.category}</p>
            </div>
            <div className="flex items-center rounded bg-yellow-100 px-2 py-1 text-yellow-800">
              <FiStar className="mr-1 h-4 w-4 fill-current" />
              <span className="text-sm font-semibold">{service.rating || 0}</span>
            </div>
          </div>
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">{service.description}</p>
          <div className="mb-4 flex items-center text-sm text-gray-500">
            <FiMapPin className="mr-1 h-4 w-4" />
            <span>{service.location}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(service.hourlyRate)}</p>
              <p className="text-xs text-gray-500">per hour</p>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiClock className="mr-1 h-4 w-4" />
              <span>{service.totalBookings} bookings</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
