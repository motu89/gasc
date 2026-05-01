import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { BookingModel } from '@/models/Booking';
import { ServiceModel } from '@/models/Service';
import { validateBookingTime } from '@/lib/time-utils';
import { sendBookingEmails } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const providerId = searchParams.get('providerId');

    if (!userId && !providerId) {
      return NextResponse.json({ error: 'userId or providerId is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const query = userId ? { userId } : { providerId };
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
        createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
      })),
    });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json({ error: 'Unable to fetch bookings.' }, { status: 500 });
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
      return NextResponse.json({ error: 'Please provide valid booking details.' }, { status: 400 });
    }

    if (!userAddress?.trim()) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
    }

    if (!paymentMethod || !['easypaisa', 'jazzcash', 'cod'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Select a valid payment method (Easypaisa, JazzCash, or manual payment).' }, { status: 400 });
    }

    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !paymentProof) {
      return NextResponse.json(
        { error: 'Payment screenshot is required for manual payments.' },
        { status: 400 }
      );
    }

    const timeValidation = validateBookingTime(date, time);
    if (!timeValidation.isValid) {
      return NextResponse.json({ error: timeValidation.message }, { status: 400 });
    }

    const service = await ServiceModel.findById(serviceId);

    if (!service || !service.available || !service.approved) {
      return NextResponse.json(
        { error: 'This service is not available for booking.' },
        { status: 404 }
      );
    }

    const fullPrice = Number(duration) * service.hourlyRate;
    const depositAmount = Math.ceil(fullPrice * 0.1);
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
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      paymentProof,
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
      message: 'Booking created successfully.',
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
    return NextResponse.json({ error: 'Unable to create booking right now.' }, { status: 500 });
  }
}
