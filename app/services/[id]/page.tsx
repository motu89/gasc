'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { FiCalendar, FiClock, FiMapPin, FiStar, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import MarketplaceImage from '@/components/shared/MarketplaceImage'
import { apiRequest } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Service } from '@/types'

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

  useEffect(() => {
    if (!params?.id) return

    setLoading(true)
    apiRequest<{ service: Service }>(`/api/services/${params.id}`)
      .then((response) => setService(response.service))
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

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book services.')
      router.push('/auth/login')
      return
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time.')
      return
    }

    try {
      setSubmitting(true)
      const response = await apiRequest<{ booking: { totalAmount: number } }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: service.id,
          userId: user.id,
          userName: user.name,
          date: selectedDate.toISOString(),
          time: selectedTime,
          duration,
        }),
      })

      toast.success(`Booking confirmed for ${formatCurrency(response.booking.totalAmount)}.`)
      setSelectedDate(null)
      setSelectedTime('')
      setDuration(2)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to book service.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:grid-cols-2">
            <div className="space-y-3 sm:space-y-4">
              <MarketplaceImage
                src={service.images[0]}
                alt={service.title}
                fallbackLabel={service.title}
                className="h-64 sm:h-80 md:h-96 w-full rounded-lg"
              />

              {service.images.length > 1 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {service.images.slice(1).map((image, index) => (
                    <MarketplaceImage
                      key={`${image.slice(0, 20)}-${index}`}
                      src={image}
                      alt={`${service.title} ${index + 2}`}
                      fallbackLabel={service.title}
                      className="h-24 sm:h-32 w-full rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              {!service.approved && (
                <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4 text-xs sm:text-sm font-medium text-yellow-900">
                  This service is waiting for admin approval. It is not visible to regular users yet.
                </div>
              )}
              <div className="mb-4">
                <span className="rounded-full bg-green-100 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-green-800">
                  {service.category}
                </span>
              </div>
              <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-black">{service.title}</h1>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">{service.description}</p>

              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <FiUser className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>Provider: <span className="font-semibold">{service.providerName}</span></span>
                </div>
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <FiMapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span>{service.location}</span>
                </div>
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <FiStar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 fill-current text-yellow-500" />
                  <span className="font-semibold">{service.rating || 0}</span>
                  <span className="ml-2 text-xs sm:text-sm text-gray-500">({service.totalBookings} bookings)</span>
                </div>
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <p className="mb-2 text-2xl sm:text-3xl font-bold text-primary-600">
                  {formatCurrency(service.hourlyRate)}
                  <span className="text-sm sm:text-lg text-gray-600"> / hour</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 sm:p-6 lg:col-start-2">
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-black">Book Service</h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                    <FiCalendar className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
                    Select Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
                    dateFormat="MMMM d, yyyy"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">
                      <FiClock className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-lg border px-2 sm:px-3 py-2 text-xs sm:text-sm transition ${
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
                  <label className="mb-2 block text-xs sm:text-sm font-medium text-gray-700">Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(event) => setDuration(parseInt(event.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="rounded-lg border bg-white p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Rate:</span>
                    <span>{formatCurrency(service.hourlyRate)}/hour</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span>{duration} hours</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold text-sm sm:text-base">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">
                      {formatCurrency(service.hourlyRate * duration)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 sm:py-3 font-semibold text-white text-sm sm:text-base transition hover:bg-primary-700 disabled:opacity-60"
                >
                  <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
