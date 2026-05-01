import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { OrderModel } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';
import { UserModel } from '@/models/User';
import { getAdminPaymentMethods } from '@/lib/payment-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const [
      totalUsers,
      totalVendors,
      totalProviders,
      totalProducts,
      totalServices,
      pendingProducts,
      pendingServices,
      recentUsers,
      recentProducts,
      recentServices,
      totalBookings,
      recentOrders,
      recentBookings,
      paymentMethods,
    ] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'vendor' }),
      UserModel.countDocuments({ role: 'service_provider' }),
      ProductModel.countDocuments(),
      ServiceModel.countDocuments(),
      ProductModel.find({ approved: false }).sort({ createdAt: -1 }).limit(10).lean(),
      ServiceModel.find({ approved: false }).sort({ createdAt: -1 }).limit(10).lean(),
      UserModel.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      ProductModel.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      ServiceModel.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      BookingModel.countDocuments(),
      OrderModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      BookingModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      getAdminPaymentMethods(),
    ]);

    const pendingItems = [
      ...pendingProducts.map((product) => ({
        id: product._id.toString(),
        type: 'product' as const,
        name: product.title,
        ownerName: product.vendorName,
        location: product.location,
        createdAt:
          product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
      })),
      ...pendingServices.map((service) => ({
        id: service._id.toString(),
        type: 'service' as const,
        name: service.title,
        ownerName: service.providerName,
        location: service.location,
        createdAt:
          service.createdAt instanceof Date ? service.createdAt.toISOString() : service.createdAt,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalVendors,
          totalProviders,
          pendingApprovals: pendingItems.length,
          totalProducts,
          totalServices,
          totalBookings,
          newUsersThisMonth: recentUsers,
          newProductsThisMonth: recentProducts,
          newServicesThisMonth: recentServices,
        },
        pendingItems,
        paymentMethods: {
          easyPaisaAccount: paymentMethods.easyPaisaAccount,
          jazzCashAccount: paymentMethods.jazzCashAccount,
        },
        recentOrders: recentOrders.map((order) => ({
          id: order._id.toString(),
          orderNumber: order.orderNumber,
          userName: order.userName,
          shippingAddress: order.shippingAddress,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentProof: order.paymentProof,
          status: order.status,
          createdAt:
            order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        })),
        recentBookings: recentBookings.map((booking) => ({
          id: booking._id.toString(),
          serviceTitle: booking.serviceTitle,
          userName: booking.userName,
          userAddress: booking.userAddress,
          totalAmount: booking.totalAmount,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
          paymentProof: booking.paymentProof,
          status: booking.status,
          createdAt:
            booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
        })),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return errorResponse('Unable to load admin dashboard.', 500);
  }
}
