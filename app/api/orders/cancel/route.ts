import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { OrderModel } from '@/models/Order';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId, reason } = body;

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'orderId and userId are required.' }, { status: 400 });
    }

    await connectToDatabase();

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this order.' }, { status: 403 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled.' }, { status: 400 });
    }

    // Check if cancellation is within 30 minutes
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (minutesSinceCreation > 30) {
      return NextResponse.json(
        { error: 'Orders can only be cancelled within 30 minutes of placement.' },
        { status: 400 }
      );
    }

    // Calculate refund amount (95% after 5% penalty)
    const totalAmount = order.totalAmount;
    const penaltyAmount = totalAmount * 0.05;
    const refundAmount = totalAmount - penaltyAmount;

    order.status = 'cancelled';
    await order.save();

    // TODO: Send notification to admin/vendor for refund processing
    // TODO: Send email to user about cancellation and refund

    return NextResponse.json({
      message: 'Order cancelled successfully. Refund will be processed within 3-5 business days.',
      refundAmount,
      penaltyAmount,
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json({ error: 'Unable to cancel order.' }, { status: 500 });
  }
}
