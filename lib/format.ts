import { ProductCategory, ProductType, UserRole } from '@/types';
import {
  APP_NAME,
  DASHBOARD_ROUTE_BY_ROLE,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_TYPE_LABELS,
} from '@/lib/constants';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function getDashboardRoute(role: UserRole) {
  return DASHBOARD_ROUTE_BY_ROLE[role] || '/';
}

export function getRoleLabel(role: UserRole) {
  return role === 'service_provider'
    ? 'Service Provider'
    : role.charAt(0).toUpperCase() + role.slice(1);
}

export function getProductCategoryLabel(category: ProductCategory) {
  return PRODUCT_CATEGORY_LABELS[category];
}

export function getProductTypeLabel(type: ProductType) {
  return PRODUCT_TYPE_LABELS[type];
}

export function getMarketplaceTitle(title?: string) {
  return title ? `${title} | ${APP_NAME}` : APP_NAME;
}
