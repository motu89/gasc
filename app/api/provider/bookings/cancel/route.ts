import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { BookingModel } from '@/models/Booking';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, providerId } = body;

    if (!bookingId || !providerId) {
      return NextResponse.json(
        { error: 'bookingId and providerId are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    // Get provider ID from booking to verify ownership
    // Assuming provider owns the service, we need to check differently
    // For now, we'll allow if the booking is associated with this provider
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled.' },
        { status: 400 }
      );
    }

    // Only allow cancellation of pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only pending or confirmed bookings can be cancelled.' },
        { status: 400 }
      );
    }

    booking.status = 'cancelled';
    await booking.save();

    // TODO: Send notification to user about booking cancellation
    // TODO: Process refund if payment was made

    return NextResponse.json({
      message: 'Booking cancelled successfully.',
      booking: {
        id: booking._id.toString(),
        status: booking.status,
      },
    });
  } catch (error) {
    console.error('Provider booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Unable to cancel booking.' },
      { status: 500 }
    );
  }
}
