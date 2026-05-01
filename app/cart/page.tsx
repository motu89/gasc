'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiCreditCard, FiShoppingCart, FiTrash2, FiUpload } from 'react-icons/fi'
import ManualPaymentModal from '@/components/forms/ManualPaymentModal'
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
import { CartItem, PaymentMethod } from '@/types'

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

export default function CartPage() {
  const { cart, clearCart, removeFromCart, updateCartItem, user, hydrated } = useStore()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState({ easyPaisaAccount: '', jazzCashAccount: '' })
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod')
  const [address, setAddress] = useState('')
  const [rentalDocument, setRentalDocument] = useState('')
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address)
    }
  }, [user])

  useEffect(() => {
    apiRequest<{ user: { easyPaisaAccount: string; jazzCashAccount: string } }>('/api/payment-methods')
      .then((response) => setPaymentMethods(response.user))
      .catch(() => {
        toast.error('Unable to load payment methods.')
      })
      .finally(() => setLoadingMethods(false))
  }, [])

  const vendorId = cart.length > 0 ? cart[0].product.vendorId : null
  const vendorName = cart.length > 0 ? cart[0].product.vendorName : null
  const vendorEmail = cart.length > 0 ? cart[0].product.vendorEmail : null
  const sameVendor = cart.every((item) => item.product.vendorId === vendorId)
  const hasRentalItems = cart.some((item) => isRentProduct(item.product))
  const hasInstallmentItems = cart.some(
    (item) => isInstallmentProduct(item.product) && item.purchaseOption === 'installment'
  )

  const normalizedCart = useMemo(
    () =>
      cart.map((item) => {
        const rentalDays =
          item.rentalDays || calculateRentalDays(item.startDate, item.endDate) || undefined

        return {
          ...item,
          rentalDays,
        }
      }),
    [cart]
  )

  const totalAmount = normalizedCart.reduce((sum, item) => sum + getCartItemAmountDueNow(item), 0)
  const fullValue = normalizedCart.reduce((sum, item) => sum + getCartItemFullValue(item), 0)
  const requiresManualProof =
    selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash'
  const selectedAccountNumber =
    selectedPaymentMethod === 'easypaisa'
      ? paymentMethods.easyPaisaAccount
      : paymentMethods.jazzCashAccount

  const validateCheckout = () => {
    if (!user) {
      toast.error('Please login before checkout.')
      router.push('/auth/login')
      return false
    }

    if (normalizedCart.length === 0) {
      toast.error('Your cart is empty.')
      return false
    }

    if (!sameVendor) {
      toast.error('All items in cart must belong to the same vendor.')
      return false
    }

    if (!address.trim()) {
      toast.error('Address is required before checkout.')
      return false
    }

    for (const item of normalizedCart) {
      if (isRentProduct(item.product)) {
        if (!item.startDate || !item.endDate || !item.rentalDays || item.rentalDays <= 0) {
          toast.error(`Please select valid rental dates for ${item.product.title}.`)
          return false
        }
      }
    }

    if (hasRentalItems && !rentalDocument) {
      toast.error('Rental orders require an ID or document upload.')
      return false
    }

    return true
  }

  const buildOrderItems = (items: CartItem[]) =>
    items.map((item) => ({
      productId: item.productId,
      productTitle: item.product.title,
      productImage: item.product.images[0] || '',
      quantity: item.quantity,
      unitPrice: item.product.price,
      totalPrice: getCartItemAmountDueNow(item),
      rentalDays: item.rentalDays,
      startDate: item.startDate,
      endDate: item.endDate,
      purchaseOption: item.purchaseOption || 'full',
      installmentMonths: item.product.installmentMonths,
      monthlyInstallment: item.product.monthlyInstallment,
      fullPlanPrice: getCartItemFullValue(item),
    }))

  const handleManualCheckout = async () => {
    if (!validateCheckout()) return

    if (requiresManualProof) {
      if (!selectedAccountNumber) {
        toast.error('Selected payment account is not available right now.')
        return
      }
      setShowManualPaymentModal(true)
      return
    }

    await submitOrder()
  }

  const submitOrder = async (paymentProof?: string) => {
    try {
      setIsSubmitting(true)

      await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: buildOrderItems(normalizedCart),
          paymentMethod: selectedPaymentMethod,
          vendorId,
          vendorName,
          vendorEmail,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          shippingAddress: address,
          paymentProof,
          rentalDocument: rentalDocument || undefined,
        }),
      })

      clearCart()
      setShowManualPaymentModal(false)
      toast.success('Order placed successfully.')
      router.push('/products')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCardCheckout = async () => {
    if (!validateCheckout()) return

    try {
      setIsSubmitting(true)
      const response = await apiRequest<{ url: string }>('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'order',
          items: buildOrderItems(normalizedCart),
          vendorId,
          vendorName,
          vendorEmail,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          shippingAddress: address,
          rentalDocument: rentalDocument || undefined,
        }),
      })

      window.location.href = response.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start card checkout.')
      setIsSubmitting(false)
    }
  }

  const handleDocumentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Document size must be less than 5MB.')
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setRentalDocument(dataUrl)
      toast.success('Document uploaded.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload document.')
    } finally {
      event.target.value = ''
    }
  }

  if (normalizedCart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 text-center sm:py-16">
            <FiShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-400 sm:h-24 sm:w-24" />
            <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">Your cart is empty</h2>
            <p className="mb-6 text-sm text-gray-600 sm:mb-8 sm:text-base">Start adding products to your cart.</p>
            <Link href="/products" className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm text-white transition hover:bg-primary-700 sm:text-base">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-black sm:mb-8 sm:text-3xl md:text-4xl">Shopping Cart</h1>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-4 shadow-md sm:p-6">
              {normalizedCart.map((item) => (
                <div key={item.cartItemId} className="mb-4 border-b border-gray-200 pb-4 last:mb-0 last:border-0 last:pb-0 sm:mb-6 sm:pb-6">
                  <div className="flex gap-3 sm:gap-4">
                    <MarketplaceImage
                      src={item.product.images[0]}
                      alt={item.product.title}
                      fallbackLabel={item.product.title}
                      className="h-20 w-20 flex-shrink-0 rounded-lg sm:h-24 sm:w-24"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-base font-semibold text-gray-800 sm:text-lg">{item.product.title}</h3>
                      <p className="mb-2 text-xs text-gray-600 sm:text-sm">{getProductCategoryLabel(item.product.category)}</p>

                      <p className="text-base font-bold text-primary-600 sm:text-lg">
                        {formatCurrency(item.product.price)}
                        {isRentProduct(item.product) && ' / day'}
                      </p>

                      {isInstallmentProduct(item.product) && item.purchaseOption === 'installment' && (
                        <p className="mt-1 text-xs font-medium text-purple-700">
                          Installment checkout: pay {formatCurrency(getCartItemAmountDueNow(item))} now
                        </p>
                      )}

                      {isRentProduct(item.product) && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input
                            type="date"
                            value={item.startDate || ''}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(event) =>
                              updateCartItem(item.cartItemId, {
                                startDate: event.target.value,
                                rentalDays: calculateRentalDays(event.target.value, item.endDate),
                                cartItemId: buildCartItemId({
                                  productId: item.productId,
                                  purchaseOption: item.purchaseOption,
                                  startDate: event.target.value,
                                  endDate: item.endDate,
                                }),
                              })
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                          />
                          <input
                            type="date"
                            value={item.endDate || ''}
                            min={item.startDate || new Date().toISOString().split('T')[0]}
                            onChange={(event) =>
                              updateCartItem(item.cartItemId, {
                                endDate: event.target.value,
                                rentalDays: calculateRentalDays(item.startDate, event.target.value),
                                cartItemId: buildCartItemId({
                                  productId: item.productId,
                                  purchaseOption: item.purchaseOption,
                                  startDate: item.startDate,
                                  endDate: event.target.value,
                                }),
                              })
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
                          />
                          <p className="text-xs text-gray-600 sm:col-span-2">
                            {item.rentalDays ? `${item.rentalDays} rental day(s)` : 'Select dates to calculate rent'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button onClick={() => removeFromCart(item.cartItemId)} className="p-1 text-red-600 hover:text-red-700">
                        <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() =>
                            updateCartItem(item.cartItemId, { quantity: Math.max(1, item.quantity - 1) })
                          }
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 sm:h-8 sm:w-8"
                        >
                          -
                        </button>
                        <span className="w-6 text-center sm:w-8">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.cartItemId, { quantity: item.quantity + 1 })}
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 sm:h-8 sm:w-8"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clearCart} className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 sm:text-sm">
                Clear Cart
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg bg-white p-4 shadow-md sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-black sm:text-xl">Checkout</h2>

              {hasInstallmentItems && (
                <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900">
                  Pay in installments using your credit card.
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="Enter your full delivery address"
                  />
                </div>

                {hasRentalItems && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Rental ID / Document</label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-700">
                      <FiUpload className="h-4 w-4" />
                      <span>{rentalDocument ? 'Replace uploaded document' : 'Upload image or PDF'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleDocumentChange}
                        className="hidden"
                      />
                    </label>
                    {rentalDocument && (
                      <p className="mt-2 text-xs text-green-700">Document attached and ready for checkout.</p>
                    )}
                  </div>
                )}

                {!loadingMethods && !hasInstallmentItems && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-900">Payment Methods</p>
                    <div className="space-y-3">
                      {paymentMethods.easyPaisaAccount && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
                          <input
                            type="radio"
                            checked={selectedPaymentMethod === 'easypaisa'}
                            onChange={() => setSelectedPaymentMethod('easypaisa')}
                          />
                          <div>
                            <p className="font-medium text-gray-900">Easypaisa</p>
                            <p className="text-xs text-gray-600">{paymentMethods.easyPaisaAccount}</p>
                          </div>
                        </label>
                      )}
                      {paymentMethods.jazzCashAccount && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
                          <input
                            type="radio"
                            checked={selectedPaymentMethod === 'jazzcash'}
                            onChange={() => setSelectedPaymentMethod('jazzcash')}
                          />
                          <div>
                            <p className="font-medium text-gray-900">JazzCash</p>
                            <p className="text-xs text-gray-600">{paymentMethods.jazzCashAccount}</p>
                          </div>
                        </label>
                      )}
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
                        <input
                          type="radio"
                          checked={selectedPaymentMethod === 'cod'}
                          onChange={() => setSelectedPaymentMethod('cod')}
                        />
                        <div>
                          <p className="font-medium text-gray-900">Cash on Delivery</p>
                          <p className="text-xs text-gray-600">Pay at delivery time.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="mb-2 flex justify-between text-sm text-gray-600">
                    <span>Subtotal due now</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  {hasInstallmentItems && (
                    <div className="mb-2 flex justify-between text-sm text-purple-700">
                      <span>Total plan value</span>
                      <span>{formatCurrency(fullValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {hasInstallmentItems ? (
                    <button
                      onClick={handleCardCheckout}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      {isSubmitting ? 'Processing...' : 'Pay with Credit Card'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleManualCheckout}
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Processing...' : 'Place Order'}
                      </button>
                      <button
                        onClick={handleCardCheckout}
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                      >
                        <FiCreditCard className="h-4 w-4" />
                        Pay with Card
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {requiresManualProof && selectedAccountNumber && (
        <ManualPaymentModal
          isOpen={showManualPaymentModal}
          onClose={() => setShowManualPaymentModal(false)}
          onSubmit={(paymentProof) => submitOrder(paymentProof)}
          paymentMethod={selectedPaymentMethod}
          accountNumber={selectedAccountNumber}
          totalAmount={totalAmount}
          title="Submit Product Payment Proof"
          submitting={isSubmitting}
        />
      )}
    </div>
  )
}