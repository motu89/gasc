import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { ServiceModel } from '@/models/Service';

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
        totalAmount: booking.totalAmount,
        status: booking.status,
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
    const { serviceId, userId, userName, date, time, duration } = payload;

    if (!serviceId || !userId || !userName || !date || !time || Number(duration) <= 0) {
      return errorResponse('Please provide valid booking details.');
    }

    const service = await ServiceModel.findById(serviceId);

    if (!service || !service.available || !service.approved) {
      return errorResponse('This service is not available for booking.', 404);
    }

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
      totalAmount: Number(duration) * service.hourlyRate,
      status: 'pending',
    });

    service.totalBookings = (service.totalBookings || 0) + 1;
    if (!service.rating) {
      service.rating = 4.5;
    }
    await service.save();

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        totalAmount: booking.totalAmount,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return errorResponse('Unable to create booking right now.', 500);
  }
}
