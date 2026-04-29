import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ProductModel } from '@/models/Product';
import { ServiceModel } from '@/models/Service';

// This is a DEBUG endpoint - REMOVE IT IN PRODUCTION
export async function GET() {
  try {
    await connectToDatabase();

    const allProducts = await ProductModel.find({}).sort({ createdAt: -1 }).limit(20);
    const allServices = await ServiceModel.find({}).sort({ createdAt: -1 }).limit(20);
    const pendingProducts = await ProductModel.find({ approved: false }).sort({ createdAt: -1 });
    const pendingServices = await ServiceModel.find({ approved: false }).sort({ createdAt: -1 });
    const approvedProducts = await ProductModel.find({ approved: true }).sort({ createdAt: -1 });
    const approvedServices = await ServiceModel.find({ approved: true }).sort({ createdAt: -1 });

    return NextResponse.json({
      summary: {
        totalProducts: allProducts.length,
        totalServices: allServices.length,
        pendingProducts: pendingProducts.length,
        pendingServices: pendingServices.length,
        approvedProducts: approvedProducts.length,
        approvedServices: approvedServices.length,
      },
      pendingProducts: pendingProducts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        vendorName: p.vendorName,
        approved: p.approved,
        createdAt: p.createdAt,
      })),
      pendingServices: pendingServices.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        providerName: s.providerName,
        approved: s.approved,
        createdAt: s.createdAt,
      })),
      recentProducts: allProducts.slice(0, 5).map((p) => ({
        id: p._id.toString(),
        title: p.title,
        vendorName: p.vendorName,
        approved: p.approved,
        createdAt: p.createdAt,
      })),
      recentServices: allServices.slice(0, 5).map((s) => ({
        id: s._id.toString(),
        title: s.title,
        providerName: s.providerName,
        approved: s.approved,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { 
        error: 'Database check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
