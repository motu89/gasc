'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import PaymentModal from '@/components/forms/PaymentModal'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, getProductCategoryLabel } from '@/lib/format'
import { useStore } from '@/lib/store'

export default function CartPage() {
  const { cart, clearCart, removeFromCart, updateCartItem, user, hydrated } = useStore()
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [vendorPaymentMethods, setVendorPaymentMethods] = useState({ easyPaisaAccount: '', jazzCashAccount: '' })
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Check if all items are from the same vendor
  const vendorId = cart.length > 0 ? cart[0].product.vendorId : null
  const vendorEmail = cart.length > 0 ? cart[0].product.vendorEmail : null
  const vendorName = cart.length > 0 ? cart[0].product.vendorName : null
  const sameVendor = cart.every(item => item.product.vendorId === vendorId)

  const totalAmount = cart.reduce((sum, item) => {
    if (item.product.type === 'rent' && item.rentalDays) {
      return sum + item.product.price * item.rentalDays * item.quantity
    }

    // For sale_installment products with installment payment, use monthly amount
    if (item.product.type === 'sale_installment' && item.paymentMethod === 'installment' && item.product.monthlyInstallment) {
      return sum + item.product.monthlyInstallment * item.quantity
    }

    return sum + item.product.price * item.quantity
  }, 0)

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty.')
      return
    }

    if (!sameVendor) {
      toast.error('All items in cart must be from the same vendor to place an order.')
      return
    }

    // Load vendor payment methods
    loadVendorPaymentMethods(vendorId!)
  }

  const loadVendorPaymentMethods = async (vid: string) => {
    try {
      // Prefer email-based lookup (more reliable); fall back to userId (_id)
      let param: string
      if (vendorEmail && vendorEmail.trim() !== '') {
        param = `email=${encodeURIComponent(vendorEmail.trim())}`
      } else {
        param = `userId=${encodeURIComponent(vid)}`
      }
      const response = await apiRequest<{ user: { easyPaisaAccount: string; jazzCashAccount: string } }>(
        `/api/payment-methods?${param}`
      )
      setVendorPaymentMethods(response.user)
      setShowPaymentModal(true)
    } catch (error) {
      toast.error('Unable to load payment methods.')
    }
  }

  const handlePaymentSubmit = async (paymentMethod: 'easypaisa' | 'jazzcash', paymentProof: string) => {
    try {
      setIsPlacingOrder(true)

      // Prepare order items
      const orderItems = cart.map(item => ({
        productId: item.productId,
        productTitle: item.product.title,
        productImage: item.product.images[0] || '',
        quantity: item.quantity,
        unitPrice: item.product.type === 'rent' && item.rentalDays
          ? item.product.price * item.rentalDays
          : item.product.type === 'sale_installment' && item.paymentMethod === 'installment' && item.product.monthlyInstallment
          ? item.product.monthlyInstallment
          : item.product.price,
        totalPrice: item.product.type === 'rent' && item.rentalDays
          ? item.product.price * item.rentalDays * item.quantity
          : item.product.type === 'sale_installment' && item.paymentMethod === 'installment' && item.product.monthlyInstallment
          ? item.product.monthlyInstallment * item.quantity
          : item.product.price * item.quantity,
        rentalDays: item.rentalDays,
        paymentMethod: item.paymentMethod,
        installmentMonths: item.product.installmentMonths,
        monthlyInstallment: item.product.monthlyInstallment,
      }))

      // Place order
      await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          paymentProof,
          vendorId,
          vendorName,
          userId: user?.id || 'anonymous',
          userName: user?.name || 'Guest User',
          userEmail: user?.email || 'guest@example.com',
        }),
      })

      // Clear cart and close modal
      clearCart()
      setShowPaymentModal(false)
      toast.success('Order placed successfully! Vendor will review your payment.')
      router.push('/products')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place order.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-16 text-center">
            <FiShoppingCart className="mx-auto mb-4 h-16 w-16 sm:h-24 sm:w-24 text-gray-400" />
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-gray-800">Your cart is empty</h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base text-gray-600">Start adding products to your cart.</p>
            <Link href="/products" className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-white transition hover:bg-primary-700 text-sm sm:text-base">
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
        <h1 className="mb-4 sm:mb-6 md:mb-8 text-2xl sm:text-3xl md:text-4xl font-bold text-black">Shopping Cart</h1>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
              {cart.map((item) => (
                <div key={item.productId} className="mb-4 sm:mb-6 border-b border-gray-200 pb-4 sm:pb-6 last:mb-0 last:border-0 last:pb-0">
                  <div className="flex gap-3 sm:gap-4">
                    <MarketplaceImage
                      src={item.product.images[0]}
                      alt={item.product.title}
                      fallbackLabel={item.product.title}
                      className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 text-base sm:text-lg font-semibold text-gray-800 truncate">{item.product.title}</h3>
                      <p className="mb-2 text-xs sm:text-sm text-gray-600">{getProductCategoryLabel(item.product.category)}</p>
                      
                      {/* Display correct price based on payment method */}
                      {item.product.type === 'sale_installment' && item.paymentMethod === 'installment' ? (
                        <div>
                          <p className="text-base sm:text-lg font-bold text-purple-600">
                            {formatCurrency(item.product.monthlyInstallment || 0)} / month
                          </p>
                          <p className="text-xs text-gray-500">
                            for {item.product.installmentMonths} months
                          </p>
                          <p className="text-xs font-medium text-purple-600">
                            Total: {formatCurrency((item.product.monthlyInstallment || 0) * (item.product.installmentMonths || 1))}
                          </p>
                        </div>
                      ) : (
                        <p className="text-base sm:text-lg font-bold text-primary-600">
                          {formatCurrency(item.product.price)}
                          {item.product.type === 'rent' && ' / day'}
                          {item.product.type === 'sale_installment' && (
                            <span className="ml-2 text-xs font-normal text-green-600">One-Time Purchase</span>
                          )}
                        </p>
                      )}
                      
                      {item.product.type === 'rent' && (
                        <div className="mt-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Days"
                            className="w-20 sm:w-24 rounded border border-gray-300 px-2 py-1 text-xs sm:text-sm text-gray-900"
                            value={item.rentalDays || ''}
                            onChange={(event) =>
                              updateCartItem(item.productId, {
                                rentalDays: parseInt(event.target.value, 10) || undefined,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-600 hover:text-red-700 p-1">
                        <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() =>
                            updateCartItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })
                          }
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
                        >
                          -
                        </button>
                        <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.productId, { quantity: item.quantity + 1 })}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm sm:text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={clearCart} className="text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 mt-2">
                Clear Cart
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 sm:top-24 rounded-lg bg-white p-4 sm:p-6 shadow-md">
              <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-black">Order Summary</h2>
              
              {/* Item breakdown */}
              <div className="mb-4 space-y-2">
                {cart.map((item) => {
                  let itemTotal: number
                  let label: string
                  
                  if (item.product.type === 'rent' && item.rentalDays) {
                    itemTotal = item.product.price * item.rentalDays * item.quantity
                    label = `${item.product.title} (Rent × ${item.rentalDays} days)`
                  } else if (item.product.type === 'sale_installment' && item.paymentMethod === 'installment' && item.product.monthlyInstallment) {
                    itemTotal = item.product.monthlyInstallment * item.quantity
                    label = `${item.product.title} (Installment)`
                  } else {
                    itemTotal = item.product.price * item.quantity
                    label = item.product.type === 'sale_installment' 
                      ? `${item.product.title} (One-Time)`
                      : item.product.title
                  }
                  
                  return (
                    <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                      <span className="flex-1 pr-2">{label} × {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(itemTotal)}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="mb-3 sm:mb-4 space-y-2 text-sm sm:text-base border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base sm:text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isPlacingOrder}
                className="w-full rounded-lg bg-primary-600 py-2 sm:py-3 font-semibold text-white text-sm sm:text-base transition hover:bg-primary-700 disabled:opacity-60"
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        vendorPaymentMethods={vendorPaymentMethods}
        totalAmount={totalAmount}
      />
    </div>
  )
}
