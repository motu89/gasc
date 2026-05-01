import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">Checkout Cancelled</h1>
        <p className="mt-4 text-gray-600">Your card payment was not completed. You can return to the cart or services page and try again.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/cart" className="rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white">
            Return to Cart
          </Link>
          <Link href="/services" className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700">
            Return to Services
          </Link>
        </div>
      </div>
    </div>
  )
}
