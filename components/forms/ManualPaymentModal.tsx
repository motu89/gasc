'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { FiArrowLeft, FiUpload, FiX } from 'react-icons/fi'
import { PaymentMethod } from '@/types'

interface ManualPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (paymentProof: string) => void
  paymentMethod: PaymentMethod
  accountNumber: string
  totalAmount: number
  title: string
  submitting?: boolean
}

function getMethodLabel(method: PaymentMethod) {
  return method === 'easypaisa' ? 'Easypaisa' : 'JazzCash'
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  paymentMethod,
  accountNumber,
  totalAmount,
  title,
  submitting = false,
}: ManualPaymentModalProps) {
  const [paymentProof, setPaymentProof] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setPaymentProof('')
      setError('')
    }
  }, [isOpen])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      event.target.value = ''
      return
    }

    try {
      const result = await fileToDataUrl(file)
      setPaymentProof(result)
      setError('')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload screenshot.')
    } finally {
      event.target.value = ''
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">Submit your payment screenshot to continue.</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Payment Method</p>
            <p className="text-lg font-semibold text-gray-900">{getMethodLabel(paymentMethod)}</p>
            <p className="mt-3 text-sm text-gray-600">Send Payment To</p>
            <p className="text-2xl font-bold text-primary-700">{accountNumber}</p>
            <p className="mt-3 text-sm text-gray-600">Amount</p>
            <p className="text-xl font-bold text-green-700">PKR {totalAmount.toLocaleString()}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Transfer the amount first, then upload the screenshot from your Easypaisa or JazzCash app.
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-300 p-5 text-center">
            <label className="flex cursor-pointer flex-col items-center gap-3">
              <FiUpload className="h-10 w-10 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  {paymentProof ? 'Replace payment screenshot' : 'Upload payment screenshot'}
                </p>
                <p className="text-xs text-gray-600">PNG or JPG, up to 5MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {paymentProof && (
              <img
                src={paymentProof}
                alt="Payment proof preview"
                className="mx-auto mt-4 max-h-56 rounded-lg border border-gray-200 object-contain"
              />
            )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={() => onSubmit(paymentProof)}
              disabled={!paymentProof || submitting}
              className="flex-1 rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
