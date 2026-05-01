import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const vendors = await UserModel.find({ role: 'vendor' }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      vendors: vendors.map((vendor) => ({
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone || '',
        address: vendor.address || '',
        createdAt: vendor.createdAt instanceof Date ? vendor.createdAt.toISOString() : vendor.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin vendors list error:', error);
    return errorResponse('Unable to load vendors.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return errorResponse('Vendor ID is required.', 400);
    }

    const vendor = await UserModel.findById(vendorId);
    if (!vendor) {
      return errorResponse('Vendor not found.', 404);
    }

    if (vendor.role !== 'vendor') {
      return errorResponse('User is not a vendor.', 400);
    }

    await UserModel.findByIdAndDelete(vendorId);

    return NextResponse.json({ message: 'Vendor deleted successfully.' });
  } catch (error) {
    console.error('Admin delete vendor error:', error);
    return errorResponse('Unable to delete vendor.', 500);
  }
}
