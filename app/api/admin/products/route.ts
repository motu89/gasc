import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { ProductModel } from '@/models/Product';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const products = await ProductModel.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      products: products.map((product) => ({
        id: product._id.toString(),
        title: product.title,
        description: product.description,
        price: product.price,
        type: product.type,
        category: product.category,
        location: product.location,
        available: product.available,
        approved: product.approved,
        vendorName: product.vendorName,
        vendorEmail: product.vendorEmail,
        images: product.images,
        createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin products list error:', error);
    return errorResponse('Unable to load products.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return errorResponse('Product ID is required.', 400);
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return errorResponse('Product not found.', 404);
    }

    await ProductModel.findByIdAndDelete(productId);

    return NextResponse.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return errorResponse('Unable to delete product.', 500);
  }
}
