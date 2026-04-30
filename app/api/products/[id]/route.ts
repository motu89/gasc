import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { errorResponse, serializeProduct, validateProductPayload } from '@/lib/server-utils';
import { ProductModel } from '@/models/Product';

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

    const product = await ProductModel.findById(params.id);

    if (!product) {
      return errorResponse('Product not found.', 404);
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Get product error:', error);
    return errorResponse('Unable to load this product.', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const payload = await request.json();
    const validated = validateProductPayload(payload);

    if (typeof validated === 'string') {
      return errorResponse(validated);
    }

    const product = await ProductModel.findById(params.id);

    if (!product) {
      return errorResponse('Product not found.', 404);
    }

    if (!payload.vendorId) {
      return errorResponse('Vendor identity is required.', 403);
    }

    if (product.vendorId !== payload.vendorId) {
      return errorResponse('You cannot update another vendor product.', 403);
    }

    product.title = validated.title.trim();
    product.description = validated.description.trim();
    product.price = Number(validated.price);
    product.type = validated.type;
    product.category = validated.category;
    product.images = validated.images;
    product.location = validated.location.trim();
    product.available = validated.available !== false;
    product.vendorName = validated.vendorName || product.vendorName;
    product.installmentMonths =
      validated.type === 'installment' ? Number(validated.installmentMonths) : undefined;
    product.monthlyInstallment =
      validated.type === 'installment' ? Number(validated.monthlyInstallment) : undefined;
    product.approved = false;

    await product.save();

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse('Unable to update product right now.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const product = await ProductModel.findById(params.id);

    if (!product) {
      return errorResponse('Product not found.', 404);
    }

    if (!vendorId) {
      return errorResponse('Vendor identity is required.', 403);
    }

    if (product.vendorId !== vendorId) {
      return errorResponse('You cannot delete another vendor product.', 403);
    }

    await product.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return errorResponse('Unable to delete product right now.', 500);
  }
}
