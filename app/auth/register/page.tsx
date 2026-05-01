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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const role = searchParams.get('role') as UserRole | null
    if (role && REGISTRATION_ROLES.includes(role)) {
      setFormData((current) => ({ ...current, role }))
    }
  }, [searchParams])

  // Validation functions
  const validatePhone = (phone: string): string => {
    if (!phone) return ''
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 11) {
      return 'Phone number must be exactly 11 digits'
    }
    return ''
  }

  const validateEmail = (email: string): string => {
    if (!email) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return ''
    if (password.length < 6) {
      return 'Password must be at least 6 characters'
    }
    if (password.length > 20) {
      return 'Password must be at most 20 characters'
    }
    return ''
  }

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    
    // Length check
    if (password.length >= 6) strength += 1
    if (password.length >= 10) strength += 1
    
    // Complexity checks
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    
    if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' }
    if (strength <= 4) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' }
    return { strength: 3, label: 'Strong', color: 'bg-green-500' }
  }

  const handleFieldChange = (field: string, value: string) => {
    // For phone field, only allow digits
    if (field === 'phone') {
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length <= 11) {
        setFormData({ ...formData, [field]: digitsOnly })
        // Real-time validation for phone
        if (touched[field]) {
          const error = validatePhone(digitsOnly)
          setErrors({ ...errors, [field]: error })
        }
      }
    } else {
      setFormData({ ...formData, [field]: value })

      // Real-time validation for other fields
      if (touched[field]) {
        let error = ''
        if (field === 'email') error = validateEmail(value)
        if (field === 'password') error = validatePassword(value)
        if (field === 'confirmPassword') {
          if (value !== formData.password) error = 'Passwords do not match'
        }
        setErrors({ ...errors, [field]: error })
      }
    }
  }

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    
    let error = ''
    if (field === 'phone') error = validatePhone(formData.phone)
    if (field === 'email') error = validateEmail(formData.email)
    if (field === 'password') error = validatePassword(formData.password)
    if (field === 'confirmPassword') {
      if (formData.confirmPassword !== formData.password) error = 'Passwords do not match'
    }
    setErrors({ ...errors, [field]: error })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    // Validate all fields
    const newErrors: Record<string, string> = {}
    const phoneError = validatePhone(formData.phone)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)
    const confirmError = formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''

    if (phoneError) newErrors.phone = phoneError
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError
    if (confirmError) newErrors.confirmPassword = confirmError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setTouched({ phone: true, email: true, password: true, confirmPassword: true })
      toast.error('Please fix the errors in the form')
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

  const passwordStrength = getPasswordStrength(formData.password)

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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full rounded-lg sm:rounded-xl border ${
                    touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
                  } py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 ${
                    touched.email && errors.email ? 'focus:ring-red-500' : 'focus:ring-primary-500'
                  }`}
                  placeholder="you@example.com"
                  required
                />
                {touched.email && !errors.email && formData.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full rounded-lg sm:rounded-xl border ${
                    touched.phone && errors.phone ? 'border-red-500' : 'border-gray-300'
                  } py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 ${
                    touched.phone && errors.phone ? 'focus:ring-red-500' : 'focus:ring-primary-500'
                  }`}
                  placeholder="Enter 11 digits"
                  maxLength={11}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                  {formData.phone.length}/11
                </div>
              </div>
              {touched.phone && errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">

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

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) => handleFieldChange('password', event.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`w-full rounded-lg sm:rounded-xl border ${
                    touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                  } py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 ${
                    touched.password && errors.password ? 'focus:ring-red-500' : 'focus:ring-primary-500'
                  }`}
                  placeholder="Create a password (6-20 characters)"
                  required
                />
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === 'Weak' ? 'text-red-600' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength >= 1 ? passwordStrength.color : 'bg-gray-200'
                    }`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength >= 2 ? passwordStrength.color : 'bg-gray-200'
                    }`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength >= 3 ? passwordStrength.color : 'bg-gray-200'
                    }`} />
                  </div>
                </div>
              )}
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) => handleFieldChange('confirmPassword', event.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full rounded-lg sm:rounded-xl border ${
                      touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-gray-900 focus:border-transparent focus:ring-2 ${
                      touched.confirmPassword && errors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-primary-500'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
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
