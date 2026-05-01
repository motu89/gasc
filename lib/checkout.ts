import { CartItem, Product } from '@/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isRentProduct(product: Pick<Product, 'type'>) {
  return product.type === 'rent';
}

export function isInstallmentProduct(
  product: Partial<Pick<Product, 'type' | 'availableOnInstallment'>>
) {
  return Boolean(
    product.availableOnInstallment ||
      product.type === 'installment' ||
      product.type === 'sale_installment'
  );
}

export function calculateRentalDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

export function getCartItemAmountDueNow(item: CartItem) {
  if (isRentProduct(item.product)) {
    const rentalDays = item.rentalDays || calculateRentalDays(item.startDate, item.endDate);
    return item.product.price * rentalDays * item.quantity;
  }

  if (
    isInstallmentProduct(item.product) &&
    item.purchaseOption === 'installment' &&
    item.product.monthlyInstallment
  ) {
    return item.product.monthlyInstallment * item.quantity;
  }

  return item.product.price * item.quantity;
}

export function getCartItemFullValue(item: CartItem) {
  if (isRentProduct(item.product)) {
    return getCartItemAmountDueNow(item);
  }

  if (
    isInstallmentProduct(item.product) &&
    item.purchaseOption === 'installment' &&
    item.product.monthlyInstallment &&
    item.product.installmentMonths
  ) {
    return item.product.monthlyInstallment * item.product.installmentMonths * item.quantity;
  }

  return item.product.price * item.quantity;
}

export function buildCartItemId(item: {
  productId: string;
  purchaseOption?: string;
  startDate?: string;
  endDate?: string;
}) {
  return [
    item.productId,
    item.purchaseOption || 'full',
    item.startDate || 'na',
    item.endDate || 'na',
  ].join('::');
}
