import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';
import { validateBookingTime } from '@/lib/time-utils';
import { BookingModel } from '@/models/Booking';
import { OrderModel } from '@/models/Order';
import { ServiceModel } from '@/models/Service';

function buildOrigin(request: NextRequest) {
  return new URL(request.url).origin;
}

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const origin = buildOrigin(request);
    const body = await request.json();

    if (body.kind === 'order') {
      const {
        items,
        vendorId,
        vendorName,
        vendorEmail,
        userId,
        userName,
        userEmail,
        shippingAddress,
        rentalDocument,
      } = body;

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'Order items are required.' }, { status: 400 });
      }

      if (!shippingAddress?.trim()) {
        return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
      }

      if (!vendorId || !vendorName) {
        return NextResponse.json({ error: 'Vendor information is required.' }, { status: 400 });
      }

      const normalizedItems = items.map((item: any) => ({
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

      const hasRentalItems = normalizedItems.some((item: any) => item.rentalDays || (item.startDate && item.endDate));

      if (hasRentalItems && !rentalDocument) {
        return NextResponse.json({ error: 'Rental document is required for rent orders.' }, { status: 400 });
      }

      const subtotal = normalizedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      // Stripe requires a minimum charge equivalent to ~$0.50 USD (~₨140 PKR).
      const STRIPE_MIN_PKR = 140;
      if (subtotal < STRIPE_MIN_PKR) {
        return NextResponse.json(
          { error: `Order total ₨${subtotal.toFixed(0)} is below the ₨${STRIPE_MIN_PKR} minimum for card payments. Please add more items or choose a longer rental period.` },
          { status: 400 }
        );
      }
      const order = await OrderModel.create({
        orderNumber: generateOrderNumber(),
        userId,
        userName,
        userEmail,
        shippingAddress: shippingAddress.trim(),
        items: normalizedItems,
        subtotal,
        totalAmount: subtotal,
        paymentMethod: 'card',
        paymentStatus: 'pending',
        vendorId,
        vendorName,
        vendorEmail: vendorEmail || '',
        rentalDocument: rentalDocument || undefined,
        status: 'pending',
      });

      const session = await createCheckoutSession({
        successUrl: `${origin}/checkout/success?kind=order&recordId=${order._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/checkout/cancel?kind=order`,
        customerEmail: userEmail,
        metadata: {
          kind: 'order',
          recordId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
        lineItems: normalizedItems.map((item: any) => ({
          name: item.productTitle,
          description:
            item.purchaseOption === 'installment'
              ? 'Installment charge due now'
              : item.rentalDays
                ? `${item.rentalDays} rental day(s)`
                : 'Product purchase',
          amount: item.totalPrice / item.quantity,
          quantity: item.quantity,
        })),
      });

      order.stripeCheckoutSessionId = session.id;
      await order.save();

      return NextResponse.json({ url: session.url });
    }

    if (body.kind === 'booking') {
      const {
        serviceId,
        userId,
        userName,
        userEmail,
        userAddress,
        date,
        time,
        duration,
      } = body;

      if (!serviceId || !userId || !userName || !date || !time || Number(duration) <= 0) {
        return NextResponse.json({ error: 'Please provide valid booking details.' }, { status: 400 });
      }

      if (!userAddress?.trim()) {
        return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
      }

      const timeValidation = validateBookingTime(date, time);
      if (!timeValidation.isValid) {
        return NextResponse.json({ error: timeValidation.message }, { status: 400 });
      }

      const service = await ServiceModel.findById(serviceId);
      if (!service || !service.available || !service.approved) {
        return NextResponse.json({ error: 'This service is not available.' }, { status: 404 });
      }

      const fullPrice = Number(duration) * service.hourlyRate;
      const depositAmount = Math.ceil(fullPrice * 0.1);
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
        totalAmount: depositAmount,
        status: 'pending',
        paymentMethod: 'card',
        paymentStatus: 'pending',
      });

      service.totalBookings = (service.totalBookings || 0) + 1;
      if (!service.rating) {
        service.rating = 4.5;
      }
      await service.save();

      const session = await createCheckoutSession({
        successUrl: `${origin}/checkout/success?kind=booking&recordId=${booking._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/checkout/cancel?kind=booking`,
        customerEmail: userEmail,
        metadata: {
          kind: 'booking',
          recordId: booking._id.toString(),
          serviceTitle: booking.serviceTitle,
        },
        lineItems: [
          {
            name: booking.serviceTitle,
            description: 'Service booking deposit',
            amount: booking.totalAmount,
            quantity: 1,
          },
        ],
      });

      booking.stripeCheckoutSessionId = session.id;
      await booking.save();

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid checkout kind.' }, { status: 400 });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Unable to start card checkout.' }, { status: 500 });
  }
}