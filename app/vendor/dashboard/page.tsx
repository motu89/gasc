'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiEdit, FiPackage, FiPlus, FiTrash2, FiTrendingUp } from 'react-icons/fi'
import ProductForm from '@/components/forms/ProductForm'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency, getProductCategoryLabel, getProductTypeLabel } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Product } from '@/types'

type ProductFormValues = {
  title: string
  description: string
  price: string
  type: Product['type']
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

  const loadProducts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await apiRequest<{ products: Product[] }>(`/api/products?vendorId=${user.id}`)
      setProducts(response.products)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardSidebar role="vendor" />

      <div className="ml-64 min-h-screen p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your product listings and keep them marketplace-ready.</p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setShowForm((current) => !current)
            }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition hover:bg-primary-700"
          >
            <FiPlus className="h-5 w-5" />
            {showForm && !editingProduct ? 'Hide Form' : 'Add Product'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-800">{products.length}</p>
              </div>
              <FiPackage className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-3xl font-bold text-green-600">{activeProducts}</p>
              </div>
              <FiTrendingUp className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingProducts}</p>
              </div>
              <FiTrendingUp className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Listing Value</p>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalValue)}</p>
              </div>
              <FiPackage className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>

        {(showForm || editingProduct) && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
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

        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">My Products</h2>
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            When you add or update a product, you have to wait for the admin approval before it shows to users.
          </div>

          {loading ? (
            <div className="text-gray-600">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-600">
              No products added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 lg:flex-row lg:items-center">
                  <MarketplaceImage
                    src={product.images[0]}
                    alt={product.title}
                    fallbackLabel={product.title}
                    className="h-28 w-full rounded-lg lg:w-36"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{product.title}</h3>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                        {getProductTypeLabel(product.type)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {product.available ? 'Available' : 'Hidden'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {product.approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {getProductCategoryLabel(product.category)} - {product.location}
                    </p>
                    <p className="mt-2 text-lg font-bold text-primary-600">{formatCurrency(product.price)}</p>
                    {!product.approved && (
                      <p className="mt-2 text-sm font-medium text-yellow-700">
                        This product will be visible to users after admin approval.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product)
                        setShowForm(true)
                      }}
                      className="rounded-lg border border-blue-200 p-3 text-blue-600 transition hover:bg-blue-50"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg border border-red-200 p-3 text-red-600 transition hover:bg-red-50"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
