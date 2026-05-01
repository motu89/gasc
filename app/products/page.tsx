'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiFilter, FiSearch } from 'react-icons/fi'
import ProductCard from '@/components/products/ProductCard'
import { apiRequest } from '@/lib/api-client'
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/lib/constants'
import { getProductCategoryLabel, getProductTypeLabel } from '@/lib/format'
import { Product, ProductCategory, ProductType } from '@/types'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(
    (searchParams.get('category') as ProductCategory | 'all') || 'all'
  )
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setSelectedCategory((searchParams.get('category') as ProductCategory | 'all') || 'all')
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    apiRequest<{ products: Product[] }>('/api/products?approvedOnly=true')
      .then((response) => setProducts(response.products))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === 'all' || product.type === selectedType
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory

      return matchesSearch && matchesType && matchesCategory
    })
  }, [products, searchQuery, selectedType, selectedCategory])

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-4 sm:mb-6 md:mb-8 text-3xl sm:text-4xl font-bold text-black">Products</h1>

        <div className="mb-6 sm:mb-8 rounded-lg bg-white p-3 sm:p-4 shadow-md">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, vendors, or descriptions..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 sm:pl-10 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters((current) => !current)}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm sm:text-base text-gray-600 hover:bg-gray-50"
            >
              <FiFilter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 sm:mt-4 grid grid-cols-1 gap-3 sm:gap-4 border-t pt-3 sm:pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-medium text-black">Type</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value as ProductType | 'all')}
                >
                  <option value="all">All Types</option>
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getProductTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-medium text-black">Category</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value as ProductCategory | 'all')
                  }
                >
                  <option value="all">All Categories</option>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getProductCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 sm:p-10 text-center text-sm sm:text-base text-gray-600 shadow-md">
            Loading products...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 sm:p-10 text-center text-sm sm:text-base text-gray-600 shadow-md">
            No products found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
