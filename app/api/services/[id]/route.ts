import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse, serializeService, validateServicePayload } from '@/lib/server-utils';
import { ServiceModel } from '@/models/Service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const service = await ServiceModel.findById(params.id);

    if (!service) {
      return errorResponse('Service not found.', 404);
    }

    return NextResponse.json({ service: serializeService(service) });
  } catch (error) {
    console.error('Get service error:', error);
    return errorResponse('Unable to load this service.', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const validated = validateServicePayload(payload);

    if (typeof validated === 'string') {
      return errorResponse(validated);
    }

    const service = await ServiceModel.findById(params.id);

    if (!service) {
      return errorResponse('Service not found.', 404);
    }

    if (!payload.providerId) {
      return errorResponse('Provider identity is required.', 403);
    }

    if (service.providerId !== payload.providerId) {
      return errorResponse('You cannot update another provider service.', 403);
    }

    service.title = validated.title.trim();
    service.description = validated.description.trim();
    service.category = validated.category.trim();
    service.images = validated.images;
    service.hourlyRate = Number(validated.hourlyRate);
    service.location = validated.location.trim();
    service.available = validated.available !== false;
    service.providerName = validated.providerName || service.providerName;
    service.providerEmail = validated.providerEmail || service.providerEmail;
    service.approved = false;

    await service.save();

    return NextResponse.json({ service: serializeService(service) });
  } catch (error) {
    console.error('Update service error:', error);
    return errorResponse('Unable to update service right now.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    const service = await ServiceModel.findById(params.id);

    if (!service) {
      return errorResponse('Service not found.', 404);
    }

    if (!providerId) {
      return errorResponse('Provider identity is required.', 403);
    }

    if (service.providerId !== providerId) {
      return errorResponse('You cannot delete another provider service.', 403);
    }

    await service.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return errorResponse('Unable to delete service right now.', 500);
  }
}
