'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiShoppingBag, FiTool, FiCalendar } from 'react-icons/fi'
import { APP_TAGLINE } from '@/lib/constants'

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const heroImages = [
    '/hero-images/hero-1.jpg',
    '/hero-images/hero-2.jpg',
    '/hero-images/hero-3.jpg',
    '/hero-images/hero-4.jpg',
    '/hero-images/hero-5.jpg',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <div className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Sliding Background Images */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: index === currentImageIndex ? 1 : 0,
            }}
          >
            <Image
              src={image}
              alt={`Hero background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-primary-700/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 h-full flex flex-col items-center justify-center">
        <div className="text-center text-white w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-lg leading-tight">
            {APP_TAGLINE}
            <span className="block text-primary-200 mt-2">Rent, Buy & Book Services</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 drop-shadow-md">
            Discover products for rent, sale, or installment. Book skilled professionals for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-primary-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <FiShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Products
            </Link>
            <Link
              href="/services"
              className="bg-primary-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-400 transition flex items-center justify-center gap-2 border-2 border-white text-sm sm:text-base whitespace-nowrap"
            >
              <FiTool className="w-4 h-4 sm:w-5 sm:h-5" />
              Book Services
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 md:gap-8 mt-8 sm:mt-12 md:mt-16 px-2 sm:px-0 max-w-3xl">
          <Link href="/#products-section" className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-6 text-center border border-white/30 hover:bg-white/30 transition cursor-pointer">
            <FiShoppingBag className="w-7 h-7 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-white" />
            <h3 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2 text-white">Rent & Buy</h3>
            <p className="text-xs sm:text-base text-white/90 hidden sm:block">
              Find products for rent, sale, or flexible installment plans
            </p>
          </Link>
          <Link href="/#services-section" className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-6 text-center border border-white/30 hover:bg-white/30 transition cursor-pointer">
            <FiTool className="w-7 h-7 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 text-white" />
            <h3 className="text-sm sm:text-xl font-semibold mb-1 sm:mb-2 text-white">Skilled Services</h3>
            <p className="text-xs sm:text-base text-white/90 hidden sm:block">
              Book professional services from verified providers
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}


