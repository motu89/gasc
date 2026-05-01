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
          className="h-32 sm:h-48 w-full"
          imgClassName="transition-transform duration-300 group-hover:scale-110"
        />
        <div className="p-2 sm:p-3 md:p-5">
          <div className="mb-2 sm:mb-3 md:mb-4 flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="mb-0.5 sm:mb-1 text-sm sm:text-base md:text-xl font-semibold text-gray-800 transition group-hover:text-primary-600 line-clamp-1">
                {service.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{service.category}</p>
            </div>
            <div className="flex items-center rounded bg-yellow-100 px-1.5 py-0.5 sm:px-2 sm:py-1 text-yellow-800 flex-shrink-0">
              <FiStar className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4 fill-current" />
              <span className="text-xs sm:text-sm font-semibold">{service.rating || 0}</span>
            </div>
          </div>
          <p className="mb-2 sm:mb-3 md:mb-4 line-clamp-2 text-xs sm:text-sm text-gray-600 hidden sm:block">{service.description}</p>
          <div className="mb-2 sm:mb-3 md:mb-4 flex items-center text-xs sm:text-sm text-gray-500">
            <FiMapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{service.location}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 sm:pt-3 md:pt-4">
            <div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-primary-600">{formatCurrency(service.hourlyRate)}</p>
              <p className="text-xs text-gray-500">per hour</p>
            </div>
            <div className="hidden sm:flex items-center text-sm text-gray-600">
              <FiClock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              <span>{service.totalBookings} bookings</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
