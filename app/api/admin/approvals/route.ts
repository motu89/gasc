import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse } from '@/lib/server-utils';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const { kind, id, action } = payload;

    if (!kind || !id || !action) {
      return errorResponse('Kind, id, and action are required.');
    }

    const Model = kind === 'product' ? ProductModel : ServiceModel;

    if (!Model) {
      return errorResponse('Invalid approval type.');
    }

    const item = await (Model as any).findById(id);

    if (!item) {
      return errorResponse('Item not found.', 404);
    }

    if (action === 'approve') {
      item.approved = true;
      await item.save();
    } else if (action === 'reject') {
      await item.deleteOne();
    } else {
      return errorResponse('Invalid action.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin approval error:', error);
    return errorResponse('Unable to update approval right now.', 500);
  }
}
