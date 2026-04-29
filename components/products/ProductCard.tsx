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
    }
    return colors[product.type]
  }

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl">
        <div className="relative h-48">
          <MarketplaceImage
            src={product.images[0]}
            alt={product.title}
            fallbackLabel={product.title}
            className="h-full w-full"
            imgClassName="transition-transform duration-300 group-hover:scale-110"
          />
          <div className={`absolute left-2 top-2 rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadge()}`}>
            {product.type.toUpperCase()}
          </div>
        </div>
        <div className="p-5">
          <h3 className="mb-2 text-xl font-semibold text-gray-800 transition group-hover:text-primary-600">
            {product.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">{product.description}</p>
          <div className="mb-3 flex items-center text-sm text-gray-500">
            <FiMapPin className="mr-1 h-4 w-4" />
            <span>{product.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(product.price)}</p>
              {product.type === 'installment' && product.monthlyInstallment && (
                <p className="text-xs text-gray-500">{formatCurrency(product.monthlyInstallment)}/month</p>
              )}
              {product.type === 'rent' && <p className="text-xs text-gray-500">per day</p>}
            </div>
            <div className="text-sm text-gray-600">
              <FiTag className="mr-1 inline h-4 w-4" />
              {getProductCategoryLabel(product.category)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
