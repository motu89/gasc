import { NextResponse } from 'next/server';
import { Product, Service, User } from '@/types';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES, MAX_IMAGE_UPLOADS } from '@/lib/constants';
import { isInstallmentProduct } from '@/lib/checkout';
import { UserModel } from '@/models/User';
import { hashPassword } from '@/lib/password';

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function normalizeImages(images: unknown) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image): image is string => typeof image === 'string')
    .map((image) => image.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGE_UPLOADS);
}

export function serializeUser(user: any): User {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    easyPaisaAccount: user.easyPaisaAccount || '',
    jazzCashAccount: user.jazzCashAccount || '',
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

export function serializeProduct(product: any): Product {
  const availableOnInstallment = Boolean(
    product.availableOnInstallment || product.type === 'installment' || product.type === 'sale_installment'
  );

  return {
    id: product._id.toString(),
    title: product.title,
    description: product.description,
    price: product.price,
    type: product.type,
    availableOnInstallment,
    category: product.category,
    images: Array.isArray(product.images) ? product.images : [],
    vendorId: product.vendorId,
    vendorName: product.vendorName,
    vendorEmail: product.vendorEmail || '',
    location: product.location,
    available: Boolean(product.available),
    installmentMonths: product.installmentMonths,
    monthlyInstallment: product.monthlyInstallment,
    approved: Boolean(product.approved),
    createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
  };
}

export function serializeService(service: any): Service {
  return {
    id: service._id.toString(),
    title: service.title,
    description: service.description,
    category: service.category,
    images: Array.isArray(service.images) ? service.images : [],
    providerId: service.providerId,
    providerName: service.providerName,
    providerEmail: service.providerEmail || '',
    hourlyRate: service.hourlyRate,
    location: service.location,
    available: Boolean(service.available),
    rating: service.rating ?? 0,
    totalBookings: service.totalBookings ?? 0,
    approved: Boolean(service.approved),
    createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : service.createdAt,
  };
}

export function validateProductPayload(payload: any) {
  if (!payload.title?.trim()) return 'Product title is required.';
  if (!payload.description?.trim()) return 'Product description is required.';
  if (!PRODUCT_TYPES.includes(payload.type)) return 'Product type is invalid.';
  if (!PRODUCT_CATEGORIES.includes(payload.category)) return 'Product category is invalid.';
  if (!payload.location?.trim()) return 'Location is required.';
  if (Number(payload.price) <= 0) return 'Price must be greater than 0.';

  const images = normalizeImages(payload.images);
  if (Array.isArray(payload.images) && payload.images.length > MAX_IMAGE_UPLOADS) {
    return `Only ${MAX_IMAGE_UPLOADS} images are allowed per product.`;
  }

  if (payload.type === 'rent' && payload.availableOnInstallment) {
    return 'Rental products cannot be marked as installment products.';
  }

  if (isInstallmentProduct(payload)) {
    if (Number(payload.installmentMonths) <= 0) return 'Installment months are required.';
    if (Number(payload.monthlyInstallment) <= 0) return 'Monthly installment is required.';
  }

  return {
    ...payload,
    availableOnInstallment: Boolean(payload.availableOnInstallment),
    images,
  };
}

export function validateServicePayload(payload: any) {
  if (!payload.title?.trim()) return 'Service title is required.';
  if (!payload.description?.trim()) return 'Service description is required.';
  if (!payload.category?.trim()) return 'Service category is required.';
  if (!payload.location?.trim()) return 'Location is required.';
  if (Number(payload.hourlyRate) <= 0) return 'Hourly rate must be greater than 0.';

  const images = normalizeImages(payload.images);
  if (Array.isArray(payload.images) && payload.images.length > MAX_IMAGE_UPLOADS) {
    return `Only ${MAX_IMAGE_UPLOADS} images are allowed per service.`;
  }

  return { ...payload, images };
}

export async function ensureAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const existingAdmin = await UserModel.findOne({ email: adminEmail.toLowerCase() });

    if (!existingAdmin) {
      console.log('Creating default admin user...');
      await UserModel.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        passwordHash: hashPassword(adminPassword),
        role: 'admin',
      });
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('ensureAdminUser error:', error);
    // Don't throw - this should not block other operations
  }
}
