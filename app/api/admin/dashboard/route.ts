import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { BookingModel } from '@/models/Booking';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    console.log('GET /api/admin/dashboard - Loading admin dashboard');
    await connectToDatabase();
    await ensureAdminUser();

    console.log('Fetching dashboard stats...');
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
    ]);

    console.log(`Found ${pendingProducts.length} pending products and ${pendingServices.length} pending services`);

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

    console.log(`Returning ${pendingItems.length} pending items to admin dashboard`);

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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return errorResponse('Unable to load admin dashboard.', 500);
  }
}
