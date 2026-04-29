import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse, serializeProduct, validateProductPayload } from '@/lib/server-utils';
import { ProductModel } from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const type = searchParams.get('type')?.trim();
    const vendorId = searchParams.get('vendorId')?.trim();
    const approvedOnly = searchParams.get('approvedOnly') === 'true';
    const limit = Number(searchParams.get('limit') || 0);

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    if (approvedOnly) {
      query.approved = true;
      query.available = true;
    }

    let dbQuery = ProductModel.find(query).sort({ createdAt: -1 });

    if (limit > 0) {
      dbQuery = dbQuery.limit(limit);
    }

    const products = await dbQuery;

    return NextResponse.json({
      products: products.map(serializeProduct),
    });
  } catch (error) {
    console.error('Get products error:', error);
    return errorResponse('Unable to load products.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const payload = await request.json();
    const validated = validateProductPayload(payload);

    if (typeof validated === 'string') {
      return errorResponse(validated);
    }

    if (!validated.vendorId || !validated.vendorName) {
      return errorResponse('Vendor information is required.');
    }

    const product = await ProductModel.create({
      title: validated.title.trim(),
      description: validated.description.trim(),
      price: Number(validated.price),
      type: validated.type,
      category: validated.category,
      images: validated.images,
      vendorId: validated.vendorId,
      vendorName: validated.vendorName,
      location: validated.location.trim(),
      available: validated.available !== false,
      installmentMonths:
        validated.type === 'installment' ? Number(validated.installmentMonths) : undefined,
      monthlyInstallment:
        validated.type === 'installment' ? Number(validated.monthlyInstallment) : undefined,
      approved: false,
    });

    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse('Unable to create product right now.', 500);
  }
}
