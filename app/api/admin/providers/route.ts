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

    const providers = await UserModel.find({ role: 'service_provider' }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      providers: providers.map((provider) => ({
        id: provider._id.toString(),
        name: provider.name,
        email: provider.email,
        phone: provider.phone || '',
        address: provider.address || '',
        createdAt: provider.createdAt instanceof Date ? provider.createdAt.toISOString() : provider.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin providers list error:', error);
    return errorResponse('Unable to load service providers.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return errorResponse('Provider ID is required.', 400);
    }

    const provider = await UserModel.findById(providerId);
    if (!provider) {
      return errorResponse('Service provider not found.', 404);
    }

    if (provider.role !== 'service_provider') {
      return errorResponse('User is not a service provider.', 400);
    }

    await UserModel.findByIdAndDelete(providerId);

    return NextResponse.json({ message: 'Service provider deleted successfully.' });
  } catch (error) {
    console.error('Admin delete provider error:', error);
    return errorResponse('Unable to delete service provider.', 500);
  }
}
