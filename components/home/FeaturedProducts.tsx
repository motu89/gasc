'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import { apiRequest } from '@/lib/api-client'
import { Product } from '@/types'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/api/products?approvedOnly=true&limit=3')
      .then((response) => setProducts(response.products))
      .catch((error) => console.error(error))
  }, [])

  return (
    <section id="products-section" className="bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 sm:px-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left">Featured Products</h2>
          <Link href="/products" className="font-semibold text-primary-600 hover:text-primary-700 text-sm sm:text-base">
            View All
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-1 sm:px-0">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 sm:p-8 text-center text-sm sm:text-base text-gray-600">
            No products have been added yet.
          </div>
        )}
      </div>
    </section>
  )
}
