import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return errorResponse('Booking ID is required.', 400);
    }

    const booking = await BookingModel.findById(bookingId).lean();
    if (!booking) {
      return errorResponse('Booking not found.', 404);
    }

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        serviceTitle: booking.serviceTitle,
        userName: booking.userName,
        userEmail: booking.userEmail,
        userAddress: booking.userAddress,
        totalAmount: booking.totalAmount,
        fullPrice: booking.fullPrice,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paymentProof: booking.paymentProof,
        paymentReference: booking.paymentReference,
        status: booking.status,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
      },
    });
  } catch (error) {
    console.error('Admin booking details error:', error);
    return errorResponse('Unable to load booking details.', 500);
  }
}
