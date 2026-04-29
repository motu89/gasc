'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiLock, FiLogIn, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authenticateUser } from '@/lib/auth'
import { getDashboardRoute } from '@/lib/format'
import { useStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required.')
      return
    }

    try {
      setLoading(true)
      const user = await authenticateUser(email, password)
      setUser(user)
      toast.success('Login successful.')
      router.push(getDashboardRoute(user.role))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-6 sm:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl sm:shadow-2xl lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-primary-700 via-primary-600 to-sky-500 p-8 sm:p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <h1 className="mb-4 text-3xl sm:text-5xl font-bold leading-tight">Welcome back</h1>
          <p className="text-base sm:text-lg text-white/90">
            Sign in to manage products, book services, and keep the marketplace moving.
          </p>
          <div className="mt-6 sm:mt-8 rounded-2xl bg-white/10 p-4 sm:p-5 text-xs sm:text-sm text-white/90">
            Admin access is configured from your local `.env` file.
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10">
          <div className="mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-primary-100 text-primary-700">
              <FiLogIn className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Use your account to access the marketplace.</p>
          </div>

          <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <FiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  Just exploring?
                </p>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                  If you want to explore our products and services without signing in, feel free to browse our marketplace first!
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg sm:rounded-xl bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-600 shadow-md transition hover:bg-primary-50 hover:shadow-lg border border-primary-200"
                >
                  <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  Back to Home - Explore Now
                </Link>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg sm:rounded-xl border border-gray-300 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-primary-600 py-2.5 sm:py-3 font-semibold text-white text-sm sm:text-base transition hover:bg-primary-700 disabled:opacity-60"
            >
              <FiLogIn className="h-4 w-4 sm:h-5 sm:w-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
