'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiCalendar, FiMapPin, FiShoppingCart, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import {
  buildCartItemId,
  calculateRentalDays,
  getCartItemAmountDueNow,
  getCartItemFullValue,
  isInstallmentProduct,
  isRentProduct,
} from '@/lib/checkout'
import { formatCurrency, getProductCategoryLabel } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Product } from '@/types'

export default function ProductDetailPage() {
  const { addToCart, hydrated, user } = useStore()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [purchaseOption, setPurchaseOption] = useState<'full' | 'installment'>('full')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!params?.id) return

    setLoading(true)
    apiRequest<{ product: Product }>(`/api/products/${params.id}`)
      .then((response) => setProduct(response.product))
      .catch((error) => {
        toast.error(error.message)
        router.push('/products')
      })
      .finally(() => setLoading(false))
  }, [params, router])

  useEffect(() => {
    if (!hydrated || !product) return

    const canViewPending =
      user?.role === 'admin' || (user?.role === 'vendor' && user.id === product.vendorId)

    if (!product.approved && !canViewPending) {
      toast.error('This product is waiting for admin approval.')
      router.push('/products')
    }
  }, [hydrated, product, router, user])

  const rentalDays = useMemo(() => calculateRentalDays(startDate, endDate), [startDate, endDate])

  if (!hydrated || loading) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Loading product...</div>
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Product not found.</div>
  }

  if (!product.approved && !(user?.role === 'admin' || (user?.role === 'vendor' && user.id === product.vendorId))) {
    return null
  }

  const rentalProduct = isRentProduct(product)
  const installmentEnabled = isInstallmentProduct(product) && !rentalProduct

  const cartPreview = {
    cartItemId: buildCartItemId({
      productId: product.id,
      purchaseOption,
      startDate,
      endDate,
    }),
    productId: product.id,
    product,
    quantity,
    startDate: rentalProduct ? startDate : undefined,
    endDate: rentalProduct ? endDate : undefined,
    rentalDays: rentalProduct ? rentalDays : undefined,
    purchaseOption: installmentEnabled ? purchaseOption : 'full',
  }

  const amountDueNow = getCartItemAmountDueNow(cartPreview)
  const fullValue = getCartItemFullValue(cartPreview)

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart.')
      router.push('/auth/login')
      return
    }

    if (rentalProduct) {
      if (!startDate || !endDate || rentalDays <= 0) {
        toast.error('Select valid rental dates first.')
        return
      }
    }

    addToCart(cartPreview)
    toast.success(rentalProduct ? 'Rental product added to cart.' : 'Product added to cart.')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <MarketplaceImage
                src={product.images[0]}
                alt={product.title}
                fallbackLabel={product.title}
                className="h-64 w-full rounded-lg sm:h-80 md:h-96"
              />

              {product.images.length > 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {product.images.slice(1).map((image, index) => (
                    <MarketplaceImage
                      key={`${image.slice(0, 20)}-${index}`}
                      src={image}
                      alt={`${product.title} ${index + 2}`}
                      fallbackLabel={product.title}
                      className="h-24 w-full rounded-lg sm:h-32"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              {!product.approved && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs font-medium text-yellow-900 sm:p-4 sm:text-sm">
                  This product is waiting for admin approval. It is not visible to regular users yet.
                </div>
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {rentalProduct ? 'RENT' : 'SALE'}
                </span>
                {installmentEnabled && (
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    Available on Installment
                  </span>
                )}
              </div>

              <h1 className="mb-3 text-2xl font-bold text-black sm:mb-4 sm:text-3xl md:text-4xl">{product.title}</h1>
              <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">{product.description}</p>

              <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
                <div className="flex items-center text-sm text-gray-600 sm:text-base">
                  <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 sm:text-base">
                  <FiTag className="mr-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  <span>{getProductCategoryLabel(product.category)}</span>
                </div>
                <div className="text-xs text-gray-600 sm:text-sm">
                  <span>Vendor: </span>
                  <span className="font-semibold">{product.vendorName}</span>
                </div>
              </div>

              <div className="mb-4 border-t pt-4 sm:mb-6 sm:pt-6">
                <p className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">
                  {formatCurrency(product.price)}
                  {rentalProduct && <span className="text-sm text-gray-600 sm:text-lg"> / day</span>}
                </p>

                {installmentEnabled && product.monthlyInstallment && product.installmentMonths && (
                  <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-purple-800">Choose how you want to pay</p>
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => setPurchaseOption('full')}
                        className={`rounded-lg border p-3 text-left ${
                          purchaseOption === 'full'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900">Pay in full</p>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(product.price)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurchaseOption('installment')}
                        className={`rounded-lg border p-3 text-left ${
                          purchaseOption === 'installment'
                            ? 'border-purple-500 bg-purple-100'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900">Pay in installments</p>
                        <p className="text-lg font-bold text-purple-700">
                          {formatCurrency(product.monthlyInstallment)} / month
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.installmentMonths} months, total plan {formatCurrency(product.monthlyInstallment * product.installmentMonths)}
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {rentalProduct && (
                <div className="mb-4 grid gap-4 sm:mb-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <FiCalendar className="mr-1 inline h-4 w-4" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <FiCalendar className="mr-1 inline h-4 w-4" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>
              )}

              <div className="mb-3 sm:mb-4">
                <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 sm:h-10 sm:w-10"
                  >
                    -
                  </button>
                  <span className="w-10 text-center sm:w-12">{quantity}</span>
                  <button
                    onClick={() => setQuantity((current) => current + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 sm:h-10 sm:w-10"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-gray-50 p-4 sm:mb-6">
                {rentalProduct && (
                  <p className="mb-2 text-sm text-gray-600">
                    {rentalDays > 0 ? `${rentalDays} rental day(s)` : 'Select rental dates to calculate total'}
                  </p>
                )}
                {installmentEnabled && purchaseOption === 'installment' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-600">Due now:</span>
                      <span className="text-2xl font-bold text-primary-600">{formatCurrency(amountDueNow)}</span>
                    </div>
                    <p className="mt-2 text-sm text-purple-700">
                      Total installment plan: {formatCurrency(fullValue)}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-600">Total:</span>
                    <span className="text-2xl font-bold text-primary-600">{formatCurrency(amountDueNow)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700"
              >
                <FiShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>

              {/* Cancellation Policy Note */}
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-blue-900">Cancellation Policy</h4>
                    <p className="text-xs text-blue-800">
                      You may cancel your booking within 30 minutes of confirmation without any charges, and the booking will be canceled accordingly.<br />
                      If a booking is canceled after 30 minutes of confirmation, a 10% cancellation fee will be applied. In such cases, the paid amount will not be refunded.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
