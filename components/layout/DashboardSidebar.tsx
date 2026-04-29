'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ElementType } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FiCalendar, FiHome, FiLayout, FiLogOut, FiMenu, FiPackage, FiShoppingCart, FiTool, FiX } from 'react-icons/fi'
import { APP_NAME } from '@/lib/constants'
import { UserRole } from '@/types'
import { useStore } from '@/lib/store'

interface SidebarItem {
  icon: ElementType
  label: string
  href: string
}

interface DashboardSidebarProps {
  role: UserRole
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setUser } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    setUser(null)
    router.push('/')
  }

  const getSidebarItems = (): SidebarItem[] => {
    switch (role) {
      case 'admin':
        return [
          { icon: FiLayout, label: 'Dashboard', href: '/admin/dashboard' },
          { icon: FiPackage, label: 'Products', href: '/products' },
          { icon: FiTool, label: 'Services', href: '/services' },
          { icon: FiShoppingCart, label: 'Cart', href: '/cart' },
        ]
      case 'vendor':
        return [
          { icon: FiLayout, label: 'Dashboard', href: '/vendor/dashboard' },
          { icon: FiPackage, label: 'Products', href: '/products' },
          { icon: FiTool, label: 'Services', href: '/services' },
          { icon: FiShoppingCart, label: 'Cart', href: '/cart' },
        ]
      case 'service_provider':
        return [
          { icon: FiLayout, label: 'Dashboard', href: '/provider/dashboard' },
          { icon: FiCalendar, label: 'Bookings', href: '/provider/dashboard' },
          { icon: FiTool, label: 'Services', href: '/services' },
          { icon: FiPackage, label: 'Products', href: '/products' },
        ]
      default:
        return []
    }
  }

  const sidebarItems = getSidebarItems()

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-gray-900 p-3 text-white shadow-lg lg:hidden"
      >
        {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="border-b border-gray-700 p-6">
        <Link href="/" className="group flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 transition-transform group-hover:scale-110">
            <FiHome className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-xl font-bold text-transparent">
            {role === 'admin' ? `${APP_NAME} Admin` : role === 'vendor' ? 'Vendor Hub' : 'Provider Hub'}
          </span>
        </Link>
      </div>

      <nav className="h-[calc(100vh-200px)] space-y-2 overflow-y-auto p-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`group flex items-center space-x-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              <span className="flex-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-gray-300 transition-all hover:bg-red-600 hover:text-white"
        >
          <FiLogOut className="h-5 w-5 text-gray-400 group-hover:text-white" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
    </>
  )
}
