'use client'

import { useState, useRef } from 'react'
import { FiX, FiUpload, FiCheck, FiArrowLeft } from 'react-icons/fi'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (paymentMethod: 'easypaisa' | 'jazzcash', paymentProof: string) => void
  vendorPaymentMethods: {
    easyPaisaAccount?: string
    jazzCashAccount?: string
  }
  totalAmount: number
}

export default function PaymentModal({ isOpen, onClose, onSubmit, vendorPaymentMethods, totalAmount }: PaymentModalProps) {
  const [step, setStep] = useState<'select' | 'details' | 'upload'>('select')
  const [selectedMethod, setSelectedMethod] = useState<'easypaisa' | 'jazzcash' | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!selectedMethod || !uploadedImage) return
    onSubmit(selectedMethod, uploadedImage)
  }

  const resetModal = () => {
    setStep('select')
    setSelectedMethod(null)
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (!isOpen) return null

  const accountNumber = selectedMethod === 'easypaisa' 
    ? vendorPaymentMethods.easyPaisaAccount 
    : vendorPaymentMethods.jazzCashAccount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <FiX className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'select' && 'Select Payment Method'}
            {step === 'details' && 'Payment Details'}
            {step === 'upload' && 'Upload Payment Proof'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'select' && 'Choose your preferred payment method'}
            {step === 'details' && `Total: PKR ${totalAmount.toLocaleString()}`}
            {step === 'upload' && 'Upload screenshot of your payment'}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto px-6 py-6">
          {/* Step 1: Select Payment Method */}
          {step === 'select' && (
            <div className="space-y-4">
              {vendorPaymentMethods.easyPaisaAccount && (
                <button
                  onClick={() => {
                    setSelectedMethod('easypaisa')
                    setStep('details')
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 p-4 transition-all duration-200 hover:border-green-500 hover:bg-green-50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-3xl">💳</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-lg font-bold text-gray-900">EasyPaisa</p>
                      <p className="text-sm text-gray-600">Mobile Account</p>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  </div>
                </button>
              )}

              {vendorPaymentMethods.jazzCashAccount && (
                <button
                  onClick={() => {
                    setSelectedMethod('jazzcash')
                    setStep('details')
                  }}
                  className="w-full rounded-xl border-2 border-gray-200 p-4 transition-all duration-200 hover:border-red-500 hover:bg-red-50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-3xl">💰</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-lg font-bold text-gray-900">JazzCash</p>
                      <p className="text-sm text-gray-600">Mobile Account</p>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                  </div>
                </button>
              )}

              {!vendorPaymentMethods.easyPaisaAccount && !vendorPaymentMethods.jazzCashAccount && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                  <p className="text-sm text-yellow-900">
                    Vendor has not added payment methods yet. Please contact them.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: View Account Details */}
          {step === 'details' && accountNumber && (
            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-6 border border-gray-200">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-md">
                    <span className="text-4xl">
                      {selectedMethod === 'easypaisa' ? '💳' : '💰'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{selectedMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} Account Number</p>
                  <p className="text-2xl font-mono font-bold text-gray-900">{accountNumber}</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Instructions:</strong> Send <strong>PKR {totalAmount.toLocaleString()}</strong> to the account number above using your {selectedMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} app, then upload the payment screenshot in the next step.
                </p>
              </div>

              <button
                onClick={() => setStep('upload')}
                className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700"
              >
                Continue to Upload Proof
              </button>

              <button
                onClick={() => {
                  setStep('select')
                  setSelectedMethod(null)
                }}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Payment Methods
              </button>
            </div>
          )}

          {/* Step 3: Upload Payment Proof */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                      <FiCheck className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-600">Image uploaded successfully!</p>
                    <img 
                      src={uploadedImage} 
                      alt="Payment proof" 
                      className="mx-auto max-h-48 rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setUploadedImage(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Remove and choose another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-base font-medium text-gray-900">Upload Payment Screenshot</p>
                      <p className="mt-1 text-sm text-gray-600">PNG, JPG up to 5MB</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-primary-600 px-6 py-2.5 font-semibold text-white transition hover:bg-primary-700"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!uploadedImage}
                className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Complete Order
              </button>

              <button
                onClick={() => setStep('details')}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Payment Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
