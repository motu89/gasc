'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiMapPin, FiShoppingCart, FiTag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, getProductCategoryLabel } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Product } from '@/types'

export default function ProductDetailPage() {
  const { addToCart, hydrated, user } = useStore()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [rentalDays, setRentalDays] = useState(1)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'sale' | 'installment'>('sale')

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

  if (!hydrated || loading) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Loading product...</div>
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Product not found.</div>
  }

  if (!product.approved && !(user?.role === 'admin' || (user?.role === 'vendor' && user.id === product.vendorId))) {
    return null
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart.')
      router.push('/auth/login')
      return
    }

    addToCart({
      productId: product.id,
      product,
      quantity,
      rentalDays: product.type === 'rent' ? rentalDays : undefined,
      paymentMethod: product.type === 'sale_installment' ? paymentMethod : undefined,
    })

    const methodText = paymentMethod === 'installment' ? ' installment plan' : ''
    toast.success(`Product${methodText} added to cart.`)
  }

  const totalPrice = (() => {
    if (product.type === 'rent') {
      return product.price * rentalDays * quantity
    }
    if (product.type === 'sale_installment' && paymentMethod === 'installment') {
      return product.monthlyInstallment ? product.monthlyInstallment * (product.installmentMonths || 1) * quantity : product.price * quantity
    }
    return product.price * quantity
  })()

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <MarketplaceImage
                src={product.images[0]}
                alt={product.title}
                fallbackLabel={product.title}
                className="h-64 sm:h-80 md:h-96 w-full rounded-lg"
              />

              {product.images.length > 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {product.images.slice(1).map((image, index) => (
                    <MarketplaceImage
                      key={`${image.slice(0, 20)}-${index}`}
                      src={image}
                      alt={`${product.title} ${index + 2}`}
                      fallbackLabel={product.title}
                      className="h-24 sm:h-32 w-full rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              {!product.approved && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 text-xs sm:text-sm font-medium text-yellow-900">
                  This product is waiting for admin approval. It is not visible to regular users yet.
                </div>
              )}
              <div className="mb-4">
                <span
                  className={`rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold ${
                    product.type === 'rent'
                      ? 'bg-blue-100 text-blue-800'
                      : product.type === 'sale'
                        ? 'bg-green-100 text-green-800'
                        : product.type === 'sale_installment'
                          ? 'bg-gradient-to-r from-green-100 to-purple-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {product.type === 'sale_installment' ? 'SALE/INSTALLMENT' : product.type.toUpperCase()}
                </span>
              </div>
              <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-black">{product.title}</h1>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">{product.description}</p>

              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <FiMapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{product.location}</span>
                </div>
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <FiTag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{getProductCategoryLabel(product.category)}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  <span>Vendor: </span>
                  <span className="font-semibold">{product.vendorName}</span>
                </div>
              </div>

              <div className="mb-4 sm:mb-6 border-t pt-4 sm:pt-6">
                <div className="mb-3 sm:mb-4">
                  <p className="mb-2 text-2xl sm:text-3xl font-bold text-primary-600">
                    {formatCurrency(product.price)}
                    {product.type === 'rent' && <span className="text-sm sm:text-lg text-gray-600"> / day</span>}
                  </p>
                  {product.type === 'installment' && product.monthlyInstallment && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatCurrency(product.monthlyInstallment)} / month for {product.installmentMonths} months
                    </p>
                  )}
                  {product.type === 'sale_installment' && product.monthlyInstallment && (
                    <div className="mt-3 sm:mt-4">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Choose Payment Option:</p>
                      <div className="grid gap-3">
                        {/* One-Time Purchase Option */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('sale')}
                          className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-200 text-left ${
                            paymentMethod === 'sale'
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : 'border-green-200 bg-green-50/50 hover:border-green-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'sale' ? 'border-green-600 bg-green-600' : 'border-green-400'
                              }`}>
                                {paymentMethod === 'sale' && (
                                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-800">💰 One-Time Purchase</p>
                                <p className="text-lg sm:text-xl font-bold text-green-700 mt-1">{formatCurrency(product.price)}</p>
                              </div>
                            </div>
                            {paymentMethod === 'sale' && (
                              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Selected</span>
                            )}
                          </div>
                        </button>

                        {/* Installment Plan Option */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('installment')}
                          className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-200 text-left ${
                            paymentMethod === 'installment'
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-purple-200 bg-purple-50/50 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === 'installment' ? 'border-purple-600 bg-purple-600' : 'border-purple-400'
                              }`}>
                                {paymentMethod === 'installment' && (
                                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-purple-800">📦 Installment Plan</p>
                                <p className="text-lg sm:text-xl font-bold text-purple-700 mt-1">
                                  {formatCurrency(product.monthlyInstallment)} / month
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  for {product.installmentMonths} months
                                </p>
                                <p className="text-xs font-medium text-purple-600 mt-1">
                                  Total: {formatCurrency(product.monthlyInstallment * (product.installmentMonths || 1))}
                                </p>
                              </div>
                            </div>
                            {paymentMethod === 'installment' && (
                              <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Selected</span>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {product.type === 'rent' && (
                  <div className="mb-3 sm:mb-4">
                    <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">Rental Days</label>
                    <input
                      type="number"
                      min="1"
                      value={rentalDays}
                      onChange={(event) => setRentalDays(parseInt(event.target.value, 10) || 1)}
                      className="w-24 sm:w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div className="mb-3 sm:mb-4">
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
                    >
                      -
                    </button>
                    <span className="w-10 sm:w-12 text-center text-sm sm:text-base">{quantity}</span>
                    <button
                      onClick={() => setQuantity((current) => current + 1)}
                      className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6 rounded-lg bg-gray-50 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm sm:text-base text-gray-600">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 sm:py-3 font-semibold text-white text-sm sm:text-base transition hover:bg-primary-700"
                >
                  <FiShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
