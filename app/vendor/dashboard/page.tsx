'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiEdit, FiEye, FiPackage, FiPlus, FiShoppingBag, FiTrash2, FiTrendingUp, FiX } from 'react-icons/fi'
import ProductForm from '@/components/forms/ProductForm'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, getProductCategoryLabel, getProductTypeLabel, formatDate } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Order, Product } from '@/types'

type ProductFormValues = {
  title: string
  description: string
  price: string
  type: 'rent' | 'sale'
  availableOnInstallment: boolean
  category: Product['category']
  images: string[]
  location: string
  available: boolean
  installmentMonths: string
  monthlyInstallment: string
}

export default function VendorDashboard() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [confirmingOrder, setConfirmingOrder] = useState(false)

  const loadProducts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        apiRequest<{ products: Product[] }>(`/api/products?vendorId=${user.id}`),
        apiRequest<{ orders: Order[] }>(`/api/orders?vendorId=${user.id}`),
      ])
      setProducts(productsResponse.products)
      setOrders(ordersResponse.orders)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hydrated) return

    if (!user || user.role !== 'vendor') {
      router.push('/auth/login')
      return
    }

    loadProducts()
  }, [hydrated, router, user])

  if (!hydrated) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-600">Loading dashboard...</div>
  }

  if (!user || user.role !== 'vendor') {
    return null
  }

  const totalValue = products.reduce((sum, product) => sum + product.price, 0)
  const activeProducts = products.filter((product) => product.available && product.approved).length
  const pendingProducts = products.filter((product) => !product.approved).length

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      setSaving(true)
      const payload = {
        ...values,
        price: Number(values.price),
        installmentMonths: values.installmentMonths ? Number(values.installmentMonths) : undefined,
        monthlyInstallment: values.monthlyInstallment ? Number(values.monthlyInstallment) : undefined,
        vendorId: user.id,
        vendorName: user.name,
        vendorEmail: user.email,
      }

      if (editingProduct) {
        await apiRequest(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Product updated. You have to wait for the admin approval.')
      } else {
        await apiRequest('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast.success('Product added. You have to wait for the admin approval.')
      }

      setEditingProduct(null)
      setShowForm(false)
      await loadProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      await apiRequest(`/api/products/${productId}?vendorId=${user.id}`, { method: 'DELETE' })
      toast.success('Product deleted.')
      await loadProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete product.')
    }
  }

  const handleConfirmOrder = async (orderId: string) => {
    try {
      setConfirmingOrder(true)
      await apiRequest('/api/orders', {
        method: 'PATCH',
        body: JSON.stringify({ orderId, status: 'confirmed', vendorId: user.id }),
      })
      toast.success('Order confirmed successfully!')
      setShowOrderDetails(false)
      setSelectedOrder(null)
      await loadProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm order.')
    } finally {
      setConfirmingOrder(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role={user.role} />
      <div className="ml-0 min-h-screen p-4 pt-16 sm:p-6 md:p-8 lg:ml-64 lg:pt-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">Vendor Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Manage products and track checkout activity from one place.</p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowForm((current) => !current)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm text-white transition hover:bg-primary-700 sm:px-6 sm:py-3 sm:text-base"
          >
            <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            {showForm && !editingProduct ? 'Hide Form' : 'Add Product'}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 sm:text-sm">Total Products</p>
                <p className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">{products.length}</p>
              </div>
              <FiPackage className="h-8 w-8 text-primary-600 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 sm:text-sm">Active Products</p>
                <p className="text-xl font-bold text-green-600 sm:text-2xl md:text-3xl">{activeProducts}</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-green-600 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 sm:text-sm">Waiting Approval</p>
                <p className="text-xl font-bold text-yellow-600 sm:text-2xl md:text-3xl">{pendingProducts}</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-yellow-500 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 sm:text-sm">Total Listing Value</p>
                <p className="text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl">{formatCurrency(totalValue)}</p>
              </div>
              <FiPackage className="h-8 w-8 text-blue-600 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
          </div>
        </div>

        {(showForm || editingProduct) && (
          <div className="mb-6 rounded-xl bg-white p-4 shadow-md sm:mb-8 sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <ProductForm
              initialProduct={editingProduct}
              isSubmitting={saving}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditingProduct(null)
                setShowForm(false)
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:gap-8 xl:grid-cols-2 sm:gap-6">
          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">My Products</h2>
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900 sm:p-4 sm:text-sm">
              When you add or update a product, you have to wait for the admin approval before it shows to users.
            </div>

            {loading ? (
              <div className="text-sm text-gray-600 sm:text-base">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">
                No products added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                      <MarketplaceImage
                        src={product.images[0]}
                        alt={product.title}
                        fallbackLabel={product.title}
                        className="h-20 w-20 rounded-lg sm:h-24 sm:w-24"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base md:text-lg">{product.title}</h3>
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                            {getProductTypeLabel(product.type)}
                          </span>
                          {product.availableOnInstallment && (
                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                              Installment
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                          {getProductCategoryLabel(product.category)} - {product.location}
                        </p>
                        <p className="mt-2 text-sm font-bold text-primary-600 sm:text-base">
                          {formatCurrency(product.price)}
                          {product.type === 'rent' && ' / day'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {product.available ? 'Available' : 'Hidden'}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.approved ? 'Approved' : 'Pending Approval'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setShowForm(true)
                          }}
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 sm:p-3"
                        >
                          <FiEdit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 sm:p-3"
                        >
                          <FiTrash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
            <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">Customer Orders</h2>
            <p className="mb-4 text-xs text-gray-500 sm:text-sm">Order summaries with payment status, address, and rental details</p>

            {loading ? (
              <div className="text-sm text-gray-600 sm:text-base">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">
                No orders yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                          Order #{order.orderNumber.slice(-8)}
                        </h3>
                        <p className="truncate text-xs text-gray-600 sm:text-sm">Customer: {order.userName}</p>
                        <p className="mt-1 text-xs text-gray-600 sm:text-sm">{formatDate(order.createdAt)}</p>
                        <p className="text-xs text-gray-600 sm:text-sm">Address: {order.shippingAddress}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-700 sm:text-sm">
                            <span className="font-medium">Items:</span> {order.items.length} product(s)
                          </p>
                          <p className="text-xs font-semibold text-primary-600 sm:text-sm">
                            Total: {formatCurrency(order.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-700 sm:text-sm">
                            Payment {order.paymentStatus} via {order.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex flex-wrap gap-1 justify-end">
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.status === 'confirmed' ? 'bg-green-100 text-green-800'
                            : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'shipped' ? 'bg-blue-100 text-blue-800'
                            : order.status === 'delivered' ? 'bg-purple-100 text-purple-800'
                            : order.status === 'cancelled' ? 'bg-red-100 text-red-800'
                            : 'bg-gray-200 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderDetails(true)
                          }}
                          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-600 px-3 py-1.5 text-xs text-white transition hover:bg-primary-700 sm:text-sm"
                        >
                          <FiEye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => {
                setShowOrderDetails(false)
                setSelectedOrder(null)
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <p className="mt-1 text-sm text-gray-600">Order #{selectedOrder.orderNumber.slice(-8)}</p>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-600">Name: {selectedOrder.userName}</p>
                <p className="text-sm text-gray-600">Email: {selectedOrder.userEmail}</p>
                <p className="text-sm text-gray-600">Address: {selectedOrder.shippingAddress}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Order Items</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="mb-3 flex items-center gap-3 last:mb-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                      <FiShoppingBag className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.productTitle}</p>
                      <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      {item.startDate && item.endDate && (
                        <p className="text-xs text-gray-600">Rental: {formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
                      )}
                      {item.purchaseOption === 'installment' && (
                        <p className="text-xs text-purple-700">
                          Installment: {item.installmentMonths} months at {formatCurrency(item.monthlyInstallment || 0)}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className="font-medium">{selectedOrder.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium">{selectedOrder.paymentReference || 'Not available yet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-primary-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.paymentProof && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Payment Screenshot</h3>
                  <img
                    src={selectedOrder.paymentProof}
                    alt="Payment proof"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                  />
                </div>
              )}

              {selectedOrder.rentalDocument && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Rental Document</h3>
                  <a
                    href={selectedOrder.rentalDocument}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary-600 underline"
                  >
                    Open uploaded ID/document
                  </a>
                </div>
              )}

              {selectedOrder.status === 'pending' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="mb-3 text-sm font-medium text-green-800">
                    Confirm the order when you are ready to proceed with fulfillment.
                  </p>
                  <button
                    onClick={() => handleConfirmOrder(selectedOrder.id)}
                    disabled={confirmingOrder}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {confirmingOrder ? 'Confirming...' : 'Confirm Order'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
