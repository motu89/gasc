import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { OrderModel } from '@/models/Order';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, vendorId } = body;

    if (!orderId || !vendorId) {
      return NextResponse.json(
        { error: 'orderId and vendorId are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this order.' },
        { status: 403 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled.' },
        { status: 400 }
      );
    }

    // Only allow cancellation of pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Only pending or confirmed orders can be cancelled.' },
        { status: 400 }
      );
    }

    order.status = 'cancelled';
    await order.save();

    // TODO: Send notification to user about order cancellation
    // TODO: Process refund if payment was made

    return NextResponse.json({
      message: 'Order cancelled successfully.',
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Vendor order cancellation error:', error);
    return NextResponse.json(
      { error: 'Unable to cancel order.' },
      { status: 500 }
    );
  }
}
