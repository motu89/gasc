import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { ServiceModel } from '@/models/Service';
import { validateBookingTime, calculateDeposit } from '@/lib/time-utils';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');

    const query: Record<string, any> = {};

    if (providerId) {
      query.providerId = providerId;
    }

    if (userId) {
      query.userId = userId;
    }

    const bookings = await BookingModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        id: booking._id.toString(),
        serviceId: booking.serviceId,
        serviceTitle: booking.serviceTitle,
        providerId: booking.providerId,
        providerName: booking.providerName,
        userId: booking.userId,
        userName: booking.userName,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        fullPrice: booking.fullPrice,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        paymentProof: booking.paymentProof,
        createdAt:
          booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return errorResponse('Unable to load bookings.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const { serviceId, userId, userName, date, time, duration, paymentMethod, paymentProof } = payload;

    if (!serviceId || !userId || !userName || !date || !time || Number(duration) <= 0) {
      return errorResponse('Please provide valid booking details.');
    }

    if (!paymentMethod || !paymentProof) {
      return errorResponse('Payment method and payment proof are required.');
    }

    // Validate booking time (must be at least 2 hours ahead of Pakistan time)
    const timeValidation = validateBookingTime(date, time);
    if (!timeValidation.isValid) {
      return errorResponse(timeValidation.message, 400);
    }

    const service = await ServiceModel.findById(serviceId);

    if (!service || !service.available || !service.approved) {
      return errorResponse('This service is not available for booking.', 404);
    }

    // Calculate prices
    const fullPrice = Number(duration) * service.hourlyRate;
    const depositAmount = calculateDeposit(fullPrice);
    const totalAmount = depositAmount; // User pays 10% now

    const booking = await BookingModel.create({
      serviceId: service._id.toString(),
      serviceTitle: service.title,
      providerId: service.providerId,
      providerName: service.providerName,
      userId,
      userName,
      date,
      time,
      duration: Number(duration),
      fullPrice,
      depositAmount,
      totalAmount,
      status: 'pending',
      paymentMethod,
      paymentProof,
    });

    service.totalBookings = (service.totalBookings || 0) + 1;
    if (!service.rating) {
      service.rating = 4.5;
    }
    await service.save();

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        fullPrice: booking.fullPrice,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return errorResponse('Unable to create booking right now.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { bookingId, status, providerId } = body;

    if (!bookingId || !status) {
      return errorResponse('bookingId and status are required.');
    }

    const allowedStatuses = ['confirmed', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse('Invalid status value.');
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return errorResponse('Booking not found.', 404);
    }

    if (providerId && booking.providerId !== providerId) {
      return errorResponse('Unauthorized to update this booking.', 403);
    }

    booking.status = status;
    await booking.save();

    return NextResponse.json({
      message: `Booking status updated to ${status}`,
      booking: {
        id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Booking status update error:', error);
    return errorResponse('Unable to update booking status.', 500);
  }
}
