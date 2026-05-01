import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { OrderModel } from '@/models/Order';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return errorResponse('Order ID is required.', 400);
    }

    const order = await OrderModel.findById(orderId).lean();
    if (!order) {
      return errorResponse('Order not found.', 404);
    }

    return NextResponse.json({
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        userName: order.userName,
        userEmail: order.userEmail,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentProof: order.paymentProof,
        paymentReference: order.paymentReference,
        status: order.status,
        items: order.items,
        rentalDocument: order.rentalDocument,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      },
    });
  } catch (error) {
    console.error('Admin order details error:', error);
    return errorResponse('Unable to load order details.', 500);
  }
}
