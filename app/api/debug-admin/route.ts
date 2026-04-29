import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

// DEBUG endpoint to reset approvals for testing - REMOVE IN PRODUCTION
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const { action, type, id } = payload;

    if (!action || !type) {
      return NextResponse.json({
        error: 'Missing action and type parameters'
      }, { status: 400 });
    }

    const Model = type === 'product' ? ProductModel : ServiceModel;

    if (action === 'reset-all') {
      // Set all items to approved: false
      const result = await (Model as any).updateMany(
        {},
        { $set: { approved: false } }
      );
      return NextResponse.json({
        success: true,
        action: 'reset-all',
        type,
        modifiedCount: result.modifiedCount
      });
    }

    if (action === 'approve' && id) {
      const item = await (Model as any).findById(id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      item.approved = true;
      await item.save();
      return NextResponse.json({ success: true, action: 'approve', id });
    }

    if (action === 'reject' && id) {
      const item = await (Model as any).findById(id);
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      await item.deleteOne();
      return NextResponse.json({ success: true, action: 'reject', id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Debug admin action error:', error);
    return NextResponse.json({
      error: 'Failed to perform admin action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
