'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiSearch, FiShoppingBag, FiTool, FiCalendar } from 'react-icons/fi'

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 h-full flex items-center">
        <div className="text-center text-white w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-lg leading-tight">
            Rent, Buy & Book Services
            <span className="block text-primary-200 mt-2">All in One Place</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 drop-shadow-md px-2">
            Discover products for rent, sale, or installment. Book skilled professionals for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/products"
              className="bg-white text-primary-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <FiShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Products
            </Link>
            <Link
              href="/services"
              className="bg-primary-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-400 transition flex items-center justify-center gap-2 border-2 border-white text-sm sm:text-base"
            >
              <FiTool className="w-4 h-4 sm:w-5 sm:h-5" />
              Book Services
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12 md:mt-16 px-4 sm:px-0">
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 sm:p-6 text-center border border-white/30">
            <FiShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Rent & Buy</h3>
            <p className="text-sm sm:text-base text-white/90">
              Find products for rent, sale, or flexible installment plans
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 sm:p-6 text-center border border-white/30">
            <FiTool className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Skilled Services</h3>
            <p className="text-sm sm:text-base text-white/90">
              Book professional services from verified providers
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 sm:p-6 text-center border border-white/30">
            <FiCalendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Easy Booking</h3>
            <p className="text-sm sm:text-base text-white/90">
              Schedule services with our simple booking system
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


