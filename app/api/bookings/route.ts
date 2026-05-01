import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { ServiceModel } from '@/models/Service';
import { validateBookingTime, calculateDeposit } from '@/lib/time-utils';
import { sendBookingEmails } from '@/lib/notifications';

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
        providerEmail: booking.providerEmail,
        userId: booking.userId,
        userName: booking.userName,
        userEmail: booking.userEmail,
        userAddress: booking.userAddress,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        fullPrice: booking.fullPrice,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paymentReference: booking.paymentReference,
        paymentProof: booking.paymentProof,
        stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
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
    const {
      serviceId,
      userId,
      userName,
      userEmail,
      userAddress,
      date,
      time,
      duration,
      paymentMethod,
      paymentProof,
    } = payload;

    if (!serviceId || !userId || !userName || !date || !time || Number(duration) <= 0) {
      return errorResponse('Please provide valid booking details.');
    }

    if (!userAddress?.trim()) {
      return errorResponse('Address is required.');
    }

    if (!paymentMethod || !['easypaisa', 'jazzcash', 'cod'].includes(paymentMethod)) {
      return errorResponse('Select a valid payment method.');
    }

    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !paymentProof) {
      return errorResponse('Payment screenshot is required for manual payments.');
    }

    const timeValidation = validateBookingTime(date, time);
    if (!timeValidation.isValid) {
      return errorResponse(timeValidation.message, 400);
    }

    const service = await ServiceModel.findById(serviceId);

    if (!service || !service.available || !service.approved) {
      return errorResponse('This service is not available for booking.', 404);
    }

    const fullPrice = Number(duration) * service.hourlyRate;
    const depositAmount = calculateDeposit(fullPrice);
    const totalAmount = depositAmount;

    const booking = await BookingModel.create({
      serviceId: service._id.toString(),
      serviceTitle: service.title,
      providerId: service.providerId,
      providerName: service.providerName,
      providerEmail: service.providerEmail || '',
      userId,
      userName,
      userEmail: userEmail || '',
      userAddress: userAddress.trim(),
      date,
      time,
      duration: Number(duration),
      fullPrice,
      depositAmount,
      totalAmount,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      paymentProof: paymentProof || undefined,
    });

    service.totalBookings = (service.totalBookings || 0) + 1;
    if (!service.rating) {
      service.rating = 4.5;
    }
    await service.save();

    await sendBookingEmails({
      serviceTitle: booking.serviceTitle,
      userEmail: booking.userEmail,
      providerEmail: booking.providerEmail,
      userAddress: booking.userAddress,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
    });

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        fullPrice: booking.fullPrice,
        depositAmount: booking.depositAmount,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
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
