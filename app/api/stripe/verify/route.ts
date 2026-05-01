import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { sendBookingEmails, sendOrderEmails } from '@/lib/notifications';
import { retrieveCheckoutSession } from '@/lib/stripe';
import { BookingModel } from '@/models/Booking';
import { OrderModel } from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { kind, recordId, sessionId } = await request.json();

    if (!kind || !recordId || !sessionId) {
      return NextResponse.json({ error: 'kind, recordId, and sessionId are required.' }, { status: 400 });
    }

    const session = await retrieveCheckoutSession(sessionId);
    const paid = session.payment_status === 'paid';

    if (kind === 'order') {
      const order = await OrderModel.findById(recordId);
      if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (order.paymentStatus !== 'paid' && paid) {
        order.paymentStatus = 'paid';
        order.paymentReference = session.payment_intent || session.id;
        order.status = 'confirmed';
        order.stripeCheckoutSessionId = session.id;
        await order.save();

        await sendOrderEmails({
          orderNumber: order.orderNumber,
          userEmail: order.userEmail,
          vendorEmail: order.vendorEmail,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          items: order.items,
        });
      }

      return NextResponse.json({
        success: paid,
        paymentStatus: paid ? 'paid' : 'pending',
        status: paid ? 'confirmed' : 'pending',
      });
    }

    if (kind === 'booking') {
      const booking = await BookingModel.findById(recordId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
      }

      if (booking.paymentStatus !== 'paid' && paid) {
        booking.paymentStatus = 'paid';
        booking.paymentReference = session.payment_intent || session.id;
        booking.status = 'confirmed';
        booking.stripeCheckoutSessionId = session.id;
        await booking.save();

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
      }

      return NextResponse.json({
        success: paid,
        paymentStatus: paid ? 'paid' : 'pending',
        status: paid ? 'confirmed' : 'pending',
      });
    }

    return NextResponse.json({ error: 'Invalid checkout kind.' }, { status: 400 });
  } catch (error) {
    console.error('Stripe verify error:', error);
    return NextResponse.json({ error: 'Unable to verify card payment.' }, { status: 500 });
  }
}
