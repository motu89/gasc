import { ProductCategory, ProductType, UserRole } from '@/types';

export const APP_NAME = 'General Accessories';

export const PRODUCT_TYPES: ProductType[] = ['rent', 'sale', 'installment', 'sale_installment'];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'electronics',
  'home_appliances',
  'machinery',
  'furniture',
  'vehicles',
  'other',
];

export const SERVICE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Photography',
  'Painting',
  'Carpentry',
  'Appliance Repair',
  'IT Support',
  'Moving',
  'Other',
] as const;

export const REGISTRATION_ROLES: UserRole[] = ['user', 'vendor', 'service_provider'];

export const MAX_IMAGE_UPLOADS = 2;
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  electronics: 'Electronics',
  home_appliances: 'Home Appliances',
  machinery: 'Machinery',
  furniture: 'Furniture',
  vehicles: 'Vehicles',
  other: 'Other',
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  rent: 'Rent',
  sale: 'Sale',
  installment: 'Installment',
  sale_installment: 'Sale/Installment',
};

export const DASHBOARD_ROUTE_BY_ROLE: Partial<Record<UserRole, string>> = {
  admin: '/admin/dashboard',
  vendor: '/vendor/dashboard',
  service_provider: '/provider/dashboard',
  user: '/',
};
