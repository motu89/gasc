import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { sendOrderEmails } from '@/lib/notifications';
import { OrderModel } from '@/models/Order';

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizeItems(items: any[]) {
  return items.map((item) => ({
    productId: item.productId,
    productTitle: item.productTitle,
    productImage: item.productImage || '',
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    totalPrice: Number(item.totalPrice) || 0,
    rentalDays: item.rentalDays ? Number(item.rentalDays) : undefined,
    startDate: item.startDate || undefined,
    endDate: item.endDate || undefined,
    purchaseOption: item.purchaseOption || 'full',
    installmentMonths: item.installmentMonths ? Number(item.installmentMonths) : undefined,
    monthlyInstallment: item.monthlyInstallment ? Number(item.monthlyInstallment) : undefined,
    fullPlanPrice: item.fullPlanPrice ? Number(item.fullPlanPrice) : undefined,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      paymentMethod,
      paymentProof,
      vendorId,
      vendorName,
      vendorEmail,
      userId,
      userName,
      userEmail,
      shippingAddress,
      rentalDocument,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required.' }, { status: 400 });
    }

    if (!paymentMethod || !['easypaisa', 'jazzcash', 'cod'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'A valid payment method is required.' }, { status: 400 });
    }

    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !paymentProof) {
      return NextResponse.json({ error: 'Payment screenshot is required for manual payments.' }, { status: 400 });
    }

    if (!shippingAddress?.trim()) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
    }

    if (!vendorId || !vendorName) {
      return NextResponse.json({ error: 'Vendor information is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedItems = normalizeItems(items);
    const hasRentalItems = normalizedItems.some((item) => item.rentalDays || (item.startDate && item.endDate));
    const hasInstallmentItems = normalizedItems.some((item) => item.purchaseOption === 'installment');

    if (hasRentalItems && !rentalDocument) {
      return NextResponse.json({ error: 'Rental document is required for rent orders.' }, { status: 400 });
    }

    if (hasInstallmentItems) {
      return NextResponse.json({ error: 'Installment orders must be paid with card checkout.' }, { status: 400 });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      userId: userId || 'anonymous',
      userName: userName || 'Guest User',
      userEmail: userEmail || 'guest@example.com',
      shippingAddress: shippingAddress.trim(),
      items: normalizedItems,
      subtotal,
      totalAmount: subtotal,
      paymentMethod,
      paymentStatus: 'pending',
      paymentProof: paymentProof || undefined,
      vendorId,
      vendorName,
      vendorEmail: vendorEmail || '',
      rentalDocument: rentalDocument || undefined,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    });

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

    return NextResponse.json({
      message: 'Order placed successfully.',
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Unable to create order.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const userId = searchParams.get('userId');

    await connectToDatabase();

    let query = {};
    if (vendorId) {
      query = { vendorId };
    } else if (userId) {
      query = { userId };
    }

    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail,
        shippingAddress: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference,
        paymentProof: order.paymentProof,
        rentalDocument: order.rentalDocument,
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        vendorEmail: order.vendorEmail,
        status: order.status,
        stripeCheckoutSessionId: order.stripeCheckoutSessionId,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Unable to fetch orders.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, vendorId } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required.' }, { status: 400 });
    }

    const allowedStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    await connectToDatabase();

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (vendorId && order.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized to update this order.' }, { status: 403 });
    }

    order.status = status;
    await order.save();

    return NextResponse.json({
      message: `Order status updated to ${status}.`,
      order: {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Unable to update order status.' }, { status: 500 });
  }
}
