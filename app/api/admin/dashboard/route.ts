import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';
import { UserModel } from '@/models/User';

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
    ] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'vendor' }),
      UserModel.countDocuments({ role: 'service_provider' }),
      ProductModel.countDocuments(),
      ServiceModel.countDocuments(),
      ProductModel.find({ approved: false }).sort({ createdAt: -1 }).limit(10),
      ServiceModel.find({ approved: false }).sort({ createdAt: -1 }).limit(10),
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return errorResponse('Unable to load admin dashboard.', 500);
  }
}
