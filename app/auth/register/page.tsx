'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiArrowLeft, FiLock, FiMail, FiPhone, FiUser, FiUserPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { REGISTRATION_ROLES } from '@/lib/constants'
import { getDashboardRoute, getRoleLabel } from '@/lib/format'
import { registerUser } from '@/lib/auth'
import { useStore } from '@/lib/store'
import { UserRole } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user' as UserRole,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const role = searchParams.get('role') as UserRole | null
    if (role && REGISTRATION_ROLES.includes(role)) {
      setFormData((current) => ({ ...current, role }))
    }
  }, [searchParams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const user = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
      })
      setUser(user)
      toast.success('Registration successful.')
      router.push(getDashboardRoute(user.role))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl sm:shadow-2xl lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-orange-500 via-amber-500 to-primary-600 p-8 sm:p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <h1 className="mb-4 text-3xl sm:text-5xl font-bold leading-tight">Create your account</h1>
          <p className="text-base sm:text-lg text-white/90">
            Join as a shopper, vendor, or service provider and start using the platform right away.
          </p>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          <div className="mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-primary-100 text-primary-700">
              <FiUserPlus className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Choose your role and get started.</p>
          </div>

          <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-orange-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <FiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  Just exploring?
                </p>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                  If you want to explore our products and services without creating an account, feel free to browse our marketplace first!
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-orange-600 shadow-md transition hover:bg-orange-50 hover:shadow-lg border border-orange-200"
                >
                  <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  Back to Home - Explore Now
                </Link>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="+92..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Register As</label>
              <select
                value={formData.role}
                onChange={(event) => setFormData({ ...formData, role: event.target.value as UserRole })}
                className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
              >
                {REGISTRATION_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                    className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-primary-600 py-2.5 sm:py-3 font-semibold text-white text-sm sm:text-base transition hover:bg-primary-700 disabled:opacity-60"
            >
              <FiUserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
