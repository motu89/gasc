'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiMenu, FiShoppingCart, FiUser, FiX } from 'react-icons/fi'
import { APP_NAME } from '@/lib/constants'
import { getDashboardRoute } from '@/lib/format'
import { useStore } from '@/lib/store'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, cart, setUser } = useStore()
  const router = useRouter()
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleLogout = () => {
    setUser(null)
    router.push('/')
  }

  const dashboardHref = user && user.role !== 'user' ? getDashboardRoute(user.role) : null

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-md backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg transition-all group-hover:scale-105 group-hover:shadow-xl">
              <span className="text-lg font-bold text-white">NA</span>
            </div>
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-xl font-bold text-transparent transition-all group-hover:from-primary-700 group-hover:to-primary-600">
              {APP_NAME}
            </span>
          </Link>

          <div className="hidden items-center space-x-1 md:flex">
            <Link href="/products" className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
              Products
            </Link>
            <Link href="/services" className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
              Services
            </Link>
            {user && (
              <Link href="/orders" className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
                Orders
              </Link>
            )}
            {dashboardHref && (
              <Link href={dashboardHref} className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
                Dashboard
              </Link>
            )}
            <Link href="/cart" className="relative rounded-lg px-4 py-2 text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
              <FiShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-xs font-bold text-white shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="ml-4 flex items-center space-x-3 border-l border-gray-200 pl-4">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-lg px-4 py-2 font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-600">
                  Login
                </Link>
                <Link href="/auth/register" className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2 font-medium text-white shadow-md transition-all hover:from-primary-700 hover:to-primary-600 hover:shadow-lg">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4 md:hidden">
            <Link href="/cart" className="relative text-black">
              <FiShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen((open) => !open)} className="text-black">
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link href="/products" className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Products
            </Link>
            <Link href="/services" className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Services
            </Link>
            {user && (
              <Link href="/orders" className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                Orders
              </Link>
            )}
            {dashboardHref && (
              <Link href={dashboardHref} className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
            )}
            <Link href="/cart" className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Cart
            </Link>
            {user ? (
              <>
                <div className="px-3 py-2 text-black">{user.name}</div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="block w-full rounded px-3 py-2 text-left text-black hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block rounded px-3 py-2 text-black hover:bg-gray-100" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link href="/auth/register" className="block rounded bg-primary-600 px-3 py-2 text-white hover:bg-primary-700" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
