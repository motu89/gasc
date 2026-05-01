'use client'

import Link from 'next/link'
import { FiMapPin, FiTag } from 'react-icons/fi'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { formatCurrency, getProductCategoryLabel } from '@/lib/format'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const getTypeBadge = () => {
    const colors = {
      rent: 'bg-blue-100 text-blue-800',
      sale: 'bg-green-100 text-green-800',
      installment: 'bg-purple-100 text-purple-800',
      sale_installment: 'bg-gradient-to-r from-green-100 to-purple-100 text-green-800',
    }
    return colors[product.type]
  }

  const getTypeLabel = () => {
    const labels = {
      rent: 'RENT',
      sale: 'SALE',
      installment: 'SALE',
      sale_installment: 'SALE',
    }
    return labels[product.type]
  }

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl">
        <div className="relative h-32 sm:h-48">
          <MarketplaceImage
            src={product.images[0]}
            alt={product.title}
            fallbackLabel={product.title}
            className="h-full w-full"
            imgClassName="transition-transform duration-300 group-hover:scale-110"
          />
          <div className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${getTypeBadge()}`}>
            {getTypeLabel()}
          </div>
          {product.availableOnInstallment && (
            <div className="absolute right-2 top-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
              Installment
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 md:p-5">
          <h3 className="mb-1 sm:mb-2 text-sm sm:text-base md:text-xl font-semibold text-gray-800 transition group-hover:text-primary-600 line-clamp-1">
            {product.title}
          </h3>
          <p className="mb-2 line-clamp-2 text-xs sm:text-sm text-gray-600 hidden sm:block">{product.description}</p>
          <div className="mb-2 sm:mb-3 flex items-center text-xs sm:text-sm text-gray-500">
            <FiMapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-primary-600">
                {formatCurrency(product.price)}
              </p>
              {product.availableOnInstallment && product.monthlyInstallment && (
                <div className="mt-1 hidden sm:block">
                  <p className="text-xs font-medium text-purple-600">
                    Or {formatCurrency(product.monthlyInstallment)}/month
                  </p>
                  {product.installmentMonths && (
                    <p className="text-xs text-gray-500">for {product.installmentMonths} months</p>
                  )}
                </div>
              )}
              {product.type === 'rent' && <p className="text-xs text-gray-500">per day</p>}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 hidden sm:flex items-center">
              <FiTag className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
              {getProductCategoryLabel(product.category)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
