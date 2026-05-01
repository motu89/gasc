import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { ServiceModel } from '@/models/Service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const services = await ServiceModel.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      services: services.map((service) => ({
        id: service._id.toString(),
        title: service.title,
        description: service.description,
        category: service.category,
        location: service.location,
        hourlyRate: service.hourlyRate,
        available: service.available,
        approved: service.approved,
        providerName: service.providerName,
        providerEmail: service.providerEmail,
        images: service.images,
        createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : service.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin services list error:', error);
    return errorResponse('Unable to load services.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return errorResponse('Service ID is required.', 400);
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      return errorResponse('Service not found.', 404);
    }

    await ServiceModel.findByIdAndDelete(serviceId);

    return NextResponse.json({ message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Admin delete service error:', error);
    return errorResponse('Unable to delete service.', 500);
  }
}
