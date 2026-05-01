import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse, serializeService, validateServicePayload } from '@/lib/server-utils';
import { ServiceModel } from '@/models/Service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const providerId = searchParams.get('providerId')?.trim();
    const approvedOnly = searchParams.get('approvedOnly') === 'true';
    const limit = Number(searchParams.get('limit') || 0);

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { providerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (providerId) {
      query.providerId = providerId;
    }

    if (approvedOnly) {
      query.approved = true;
      query.available = true;
    }

    let dbQuery = ServiceModel.find(query).sort({ createdAt: -1 });

    if (limit > 0) {
      dbQuery = dbQuery.limit(limit);
    }

    const services = await dbQuery;

    return NextResponse.json({
      services: services.map(serializeService),
    });
  } catch (error) {
    console.error('Get services error:', error);
    return errorResponse('Unable to load services.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/services - Starting service creation');
    await connectToDatabase();
    await ensureAdminUser();

    const payload = await request.json();
    console.log('Service payload received:', JSON.stringify(payload, null, 2));
    
    const validated = validateServicePayload(payload);

    if (typeof validated === 'string') {
      console.error('Service validation failed:', validated);
      return errorResponse(validated);
    }

    if (!validated.providerId || !validated.providerName) {
      console.error('Missing provider information');
      return errorResponse('Provider information is required.');
    }

    console.log('Creating service in database...');
    const service = await ServiceModel.create({
      title: validated.title.trim(),
      description: validated.description.trim(),
      category: validated.category.trim(),
      images: validated.images,
      providerId: validated.providerId,
      providerName: validated.providerName,
      providerEmail: validated.providerEmail || '',
      hourlyRate: Number(validated.hourlyRate),
      location: validated.location.trim(),
      available: validated.available !== false,
      approved: false,
    });

    console.log('Service created successfully:', service._id.toString());
    return NextResponse.json({ service: serializeService(service) }, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    return errorResponse('Unable to create service right now.', 500);
  }
}
