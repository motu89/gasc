'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { apiRequest } from '@/lib/api-client'
import { useStore } from '@/lib/store'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Verifying your payment...')
  const clearCart = useStore((state) => state.clearCart)

  useEffect(() => {
    const kind = searchParams.get('kind')
    const recordId = searchParams.get('recordId')
    const sessionId = searchParams.get('session_id')

    if (!kind || !recordId || !sessionId) {
      setMessage('Payment completed, but the verification details are missing.')
      return
    }

    apiRequest<{ success: boolean }>('/api/stripe/verify', {
      method: 'POST',
      body: JSON.stringify({ kind, recordId, sessionId }),
    })
      .then((response) => {
        if (response.success && kind === 'order') {
          clearCart()
        }
        setMessage(response.success ? 'Payment verified successfully.' : 'Payment is still pending verification.')
      })
      .catch(() => {
        setMessage('We could not verify the payment automatically. Please contact support or refresh this page.')
      })
  }, [clearCart, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">Checkout Complete</h1>
        <p className="mt-4 text-gray-600">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/products" className="rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white">
            Browse Products
          </Link>
          <Link href="/services" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700">
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  )
}
