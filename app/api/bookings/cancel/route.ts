import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { BookingModel } from '@/models/Booking';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, userId, reason } = body;

    if (!bookingId || !userId) {
      return NextResponse.json({ error: 'bookingId and userId are required.' }, { status: 400 });
    }

    await connectToDatabase();

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this booking.' }, { status: 403 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled.' }, { status: 400 });
    }

    // Check if cancellation is within 30 minutes
    const createdAt = new Date(booking.createdAt);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (minutesSinceCreation > 30) {
      return NextResponse.json(
        { error: 'Bookings can only be cancelled within 30 minutes of booking.' },
        { status: 400 }
      );
    }

    // Calculate refund amount (95% after 5% penalty)
    const totalAmount = booking.totalAmount;
    const penaltyAmount = totalAmount * 0.05;
    const refundAmount = totalAmount - penaltyAmount;

    booking.status = 'cancelled';
    await booking.save();

    // TODO: Send notification to admin/provider for refund processing
    // TODO: Send email to user about cancellation and refund

    return NextResponse.json({
      message: 'Booking cancelled successfully. Refund will be processed within 3-5 business days.',
      refundAmount,
      penaltyAmount,
      booking: {
        id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json({ error: 'Unable to cancel booking.' }, { status: 500 });
  }
}
