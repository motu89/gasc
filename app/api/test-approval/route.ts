import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

// Test endpoint to verify approval functionality
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');
    const type = searchParams.get('type');

    if (!testId || !type) {
      return NextResponse.json({
        error: 'Missing id and type parameters',
        usage: '/api/test-approval?id=PRODUCT_ID&type=product'
      }, { status: 400 });
    }

    const Model = type === 'product' ? ProductModel : ServiceModel;
    const item = await (Model as any).findById(testId);

    if (!item) {
      return NextResponse.json({
        error: 'Item not found',
        searched: { id: testId, type }
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      id: item._id.toString(),
      type: type,
      title: item.title,
      approved: item.approved,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      fullItem: item
    });
  } catch (error) {
    console.error('Test approval check error:', error);
    return NextResponse.json({
      error: 'Failed to check item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
