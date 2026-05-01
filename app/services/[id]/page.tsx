'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiCalendar, FiClock, FiCreditCard, FiMapPin, FiStar, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import ManualPaymentModal from '@/components/forms/ManualPaymentModal'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { useStore } from '@/lib/store'
import { PaymentMethod, Service } from '@/types'
import { validateBookingTime, calculateDeposit } from '@/lib/time-utils'

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']

export default function ServiceDetailPage() {
  const { hydrated, user } = useStore()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [currentPakistanTime, setCurrentPakistanTime] = useState<string>('')
  const [paymentMethods, setPaymentMethods] = useState({ easyPaisaAccount: '', jazzCashAccount: '' })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cod')
  const [address, setAddress] = useState('')
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pakistanTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setCurrentPakistanTime(pakistanTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!params?.id) return

    setLoading(true)
    Promise.all([
      apiRequest<{ service: Service }>(`/api/services/${params.id}`),
      apiRequest<{ user: { easyPaisaAccount: string; jazzCashAccount: string } }>('/api/payment-methods'),
    ])
      .then(([serviceResponse, paymentResponse]) => {
        setService(serviceResponse.service)
        setPaymentMethods(paymentResponse.user)
      })
      .catch((error) => {
        toast.error(error.message)
        router.push('/services')
      })
      .finally(() => setLoading(false))
  }, [params, router])

  useEffect(() => {
    if (!hydrated || !service) return

    const canViewPending =
      user?.role === 'admin' ||
      (user?.role === 'service_provider' && user.id === service.providerId)

    if (!service.approved && !canViewPending) {
      toast.error('This service is waiting for admin approval.')
      router.push('/services')
    }
  }, [hydrated, router, service, user])

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address)
    }
  }, [user])

  const totalAmount = useMemo(() => calculateDeposit((service?.hourlyRate || 0) * duration), [service, duration])
  const requiresManualProof =
    selectedPaymentMethod === 'easypaisa' || selectedPaymentMethod === 'jazzcash'
  const selectedAccountNumber =
    selectedPaymentMethod === 'easypaisa'
      ? paymentMethods.easyPaisaAccount
      : paymentMethods.jazzCashAccount

  if (!hydrated || loading) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Loading service...</div>
  }

  if (!service) {
    return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-600">Service not found.</div>
  }

  if (
    !service.approved &&
    !(user?.role === 'admin' || (user?.role === 'service_provider' && user.id === service.providerId))
  ) {
    return null
  }

  const validateBooking = () => {
    if (!user) {
      toast.error('Please login to book services.')
      router.push('/auth/login')
      return false
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time.')
      return false
    }

    if (!address.trim()) {
      toast.error('Address is required before checkout.')
      return false
    }

    const timeValidation = validateBookingTime(selectedDate.toISOString(), selectedTime);
    if (!timeValidation.isValid) {
      toast.error(timeValidation.message);
      return false
    }

    return true
  }

  const manualCheckout = async () => {
    if (!validateBooking()) return

    if (requiresManualProof) {
      if (!selectedAccountNumber) {
        toast.error('Selected payment account is not available right now.')
        return
      }
      setShowManualPaymentModal(true)
      return
    }

    await submitBooking()
  }

  const submitBooking = async (paymentProof?: string) => {
    try {
      setSubmitting(true)
      await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: service.id,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userAddress: address,
          date: selectedDate?.toISOString(),
          time: selectedTime,
          duration,
          paymentMethod: selectedPaymentMethod,
          paymentProof,
        }),
      })

      setShowManualPaymentModal(false)
      toast.success('Service booking created successfully.')
      router.push('/services')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create booking.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCardCheckout = async () => {
    if (!validateBooking()) return

    try {
      setSubmitting(true)
      const response = await apiRequest<{ url: string }>('/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'booking',
          serviceId: service.id,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email,
          userAddress: address,
          date: selectedDate?.toISOString(),
          time: selectedTime,
          duration,
        }),
      })

      window.location.href = response.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start card checkout.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="grid grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-6 md:p-8 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <MarketplaceImage
                src={service.images[0]}
                alt={service.title}
                fallbackLabel={service.title}
                className="h-64 w-full rounded-lg sm:h-80 md:h-96"
              />

              {service.images.length > 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {service.images.slice(1).map((image, index) => (
                    <MarketplaceImage
                      key={`${image.slice(0, 20)}-${index}`}
                      src={image}
                      alt={`${service.title} ${index + 2}`}
                      fallbackLabel={service.title}
                      className="h-24 w-full rounded-lg sm:h-32"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              {!service.approved && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs font-medium text-yellow-900 sm:p-4 sm:text-sm">
                  This service is waiting for admin approval. It is not visible to regular users yet.
                </div>
              )}
              <div className="mb-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  {service.category}
                </span>
              </div>
              <h1 className="mb-3 text-2xl font-bold text-black sm:mb-4 sm:text-3xl md:text-4xl">{service.title}</h1>
              <p className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">{service.description}</p>

              <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
                <div className="flex items-center text-sm text-gray-600 sm:text-base">
                  <FiUser className="mr-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  <span>Provider: <span className="font-semibold">{service.providerName}</span></span>
                </div>
                <div className="flex items-center text-sm text-gray-600 sm:text-base">
                  <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  <span>{service.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 sm:text-base">
                  <FiStar className="mr-2 h-4 w-4 flex-shrink-0 fill-current text-yellow-500 sm:h-5 sm:w-5" />
                  <span className="font-semibold">{service.rating || 0}</span>
                  <span className="ml-2 text-xs text-gray-500 sm:text-sm">({service.totalBookings} bookings)</span>
                </div>
                {currentPakistanTime && (
                  <div className="flex items-center rounded-lg bg-blue-50 p-2 text-xs text-blue-600 sm:text-sm">
                    <FiClock className="mr-2 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span>Current Pakistan Time: <span className="font-semibold">{currentPakistanTime}</span></span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <p className="mb-2 text-2xl font-bold text-primary-600 sm:text-3xl">
                  {formatCurrency(service.hourlyRate)}
                  <span className="text-sm text-gray-600 sm:text-lg"> / hour</span>
                </p>
                <p className="text-xs font-medium text-green-600 sm:text-sm">
                  Only 10% deposit is charged during booking.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 sm:p-6 lg:col-start-2">
              <h2 className="mb-4 text-xl font-bold text-black sm:mb-6 sm:text-2xl">Book Service</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FiCalendar className="mr-1 inline h-4 w-4" />
                    Select Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Select a date"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <FiClock className="mr-1 inline h-4 w-4" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg border px-3 py-2 text-xs transition sm:text-sm ${
                            selectedTime === time
                              ? 'border-primary-600 bg-primary-600 text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(event) => setDuration(parseInt(event.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="min-h-[96px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="Enter your full service address"
                    required
                  />
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rate:</span>
                    <span>{formatCurrency(service.hourlyRate)}/hour</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span>{duration} hour(s)</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Full Price:</span>
                    <span className="font-semibold">{formatCurrency(service.hourlyRate * duration)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold text-green-600">Pay Now (10%):</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
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
                        <p className="text-xs text-gray-600">Pay when the service is delivered.</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={manualCheckout}
                      disabled={submitting}
                      className="rounded-lg bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
                    >
                      {submitting ? 'Processing...' : 'Confirm Booking'}
                    </button>
                    <button
                      onClick={handleCardCheckout}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      Pay with Card
                    </button>
                  </div>
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
          onSubmit={(paymentProof) => submitBooking(paymentProof)}
          paymentMethod={selectedPaymentMethod}
          accountNumber={selectedAccountNumber}
          totalAmount={totalAmount}
          title="Submit Service Payment Proof"
          submitting={submitting}
        />
      )}
    </div>
  )
}
