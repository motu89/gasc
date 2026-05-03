import Link from 'next/link'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center sm:text-left">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold">{APP_NAME}</h3>
            <p className="text-sm sm:text-base text-gray-400">
              {APP_TAGLINE}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              <li><Link href="/products" className="transition hover:text-white">Products</Link></li>
              <li><Link href="/services" className="transition hover:text-white">Services</Link></li>
              <li><Link href="/cart" className="transition hover:text-white">Cart</Link></li>
              <li><Link href="/auth/login" className="transition hover:text-white">Login</Link></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">For Business</h4>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              <li><Link href="/auth/register?role=vendor" className="transition hover:text-white">Become a Vendor</Link></li>
              <li><Link href="/auth/register?role=service_provider" className="transition hover:text-white">Become a Service Provider</Link></li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">Follow Us</h4>
            <div className="flex justify-center sm:justify-start space-x-4">
              <a href="#" className="text-gray-400 transition hover:text-white"><FiFacebook className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="#" className="text-gray-400 transition hover:text-white"><FiTwitter className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="#" className="text-gray-400 transition hover:text-white"><FiInstagram className="h-5 w-5 sm:h-6 sm:w-6" /></a>
              <a href="#" className="text-gray-400 transition hover:text-white"><FiLinkedin className="h-5 w-5 sm:h-6 sm:w-6" /></a>
            </div>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 border-t border-gray-800 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400">
          <p>&copy; 2026 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
