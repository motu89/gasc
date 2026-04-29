import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse } from '@/lib/server-utils';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/approvals - Processing approval request');
    await connectToDatabase();

    const payload = await request.json();
    const { kind, id, action } = payload;
    
    console.log(`Approval request: kind=${kind}, id=${id}, action=${action}`);

    if (!kind || !id || !action) {
      return errorResponse('Kind, id, and action are required.');
    }

    const Model = kind === 'product' ? ProductModel : ServiceModel;

    if (!Model) {
      return errorResponse('Invalid approval type.');
    }

    const item = await (Model as any).findById(id);

    if (!item) {
      console.error(`Item not found: ${kind} - ${id}`);
      return errorResponse('Item not found.', 404);
    }

    if (action === 'approve') {
      console.log(`Approving ${kind}: ${id}`);
      item.approved = true;
      await item.save();
      console.log(`Successfully approved ${kind}: ${id}`);
    } else if (action === 'reject') {
      console.log(`Rejecting ${kind}: ${id}`);
      await item.deleteOne();
      console.log(`Successfully rejected ${kind}: ${id}`);
    } else {
      return errorResponse('Invalid action.');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin approval error:', error);
    return errorResponse('Unable to update approval right now.', 500);
  }
}
