'use client'

import Link from 'next/link'
import { FiBox, FiHome, FiMonitor, FiSettings, FiTruck } from 'react-icons/fi'

const categories = [
  { name: 'Electronics', icon: FiMonitor, href: '/products?category=electronics' },
  { name: 'Home Appliances', icon: FiHome, href: '/products?category=home_appliances' },
  { name: 'Machinery', icon: FiSettings, href: '/products?category=machinery' },
  { name: 'Vehicles', icon: FiTruck, href: '/products?category=vehicles' },
  { name: 'Furniture', icon: FiBox, href: '/products?category=furniture' },
  { name: 'Other', icon: FiBox, href: '/products?category=other' },
]

export default function Categories() {
  return (
    <section className="bg-white py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 sm:mb-8 md:mb-12 text-center text-2xl sm:text-3xl font-bold text-black">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon

            return (
              <Link
                key={category.name}
                href={category.href}
                className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-4 sm:p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <Icon className="mx-auto mb-3 sm:mb-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary-600" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">{category.name}</h3>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
