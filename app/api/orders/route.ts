import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { OrderModel } from '@/models/Order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, paymentMethod, paymentProof, vendorId, vendorName, userId, userName, userEmail } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    if (!paymentMethod || !['easypaisa', 'jazzcash'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 });
    }

    if (!paymentProof) {
      return NextResponse.json({ error: 'Payment proof screenshot is required' }, { status: 400 });
    }

    if (!vendorId || !vendorName) {
      return NextResponse.json({ error: 'Vendor information is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate subtotal
    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    const newOrder = await OrderModel.create({
      orderNumber,
      userId: userId || 'anonymous',
      userName: userName || 'Guest User',
      userEmail: userEmail || 'guest@example.com',
      items,
      subtotal,
      totalAmount: subtotal,
      paymentMethod,
      paymentProof,
      vendorId,
      vendorName,
      status: 'pending',
    });

    return NextResponse.json({
      message: 'Order placed successfully',
      order: {
        id: newOrder._id,
        orderNumber: newOrder.orderNumber,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Unable to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const orders = await OrderModel.find({ vendorId }).sort({ createdAt: -1 });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentProof: order.paymentProof,
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Unable to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, vendorId } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const allowedStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await connectToDatabase();

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (vendorId && order.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized to update this order' }, { status: 403 });
    }

    order.status = status;
    await order.save();

    return NextResponse.json({
      message: `Order status updated to ${status}`,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Unable to update order status' }, { status: 500 });
  }
}
