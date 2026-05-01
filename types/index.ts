export type UserRole = 'user' | 'vendor' | 'service_provider' | 'admin';
export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'cod' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PurchaseOption = 'full' | 'installment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  createdAt: string;
}

export type ProductType = 'rent' | 'sale' | 'installment' | 'sale_installment';
export type ProductCategory = 'electronics' | 'home_appliances' | 'machinery' | 'furniture' | 'vehicles' | 'other';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: ProductType;
  availableOnInstallment: boolean;
  category: ProductCategory;
  images: string[];
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  location: string;
  available: boolean;
  installmentMonths?: number;
  monthlyInstallment?: number;
  createdAt: string;
  approved: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  providerId: string;
  providerName: string;
  providerEmail?: string;
  hourlyRate: number;
  location: string;
  available: boolean;
  rating: number;
  totalBookings: number;
  createdAt: string;
  approved: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  providerEmail?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAddress: string;
  date: string;
  time: string;
  duration: number;
  fullPrice: number;
  depositAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentProof?: string;
  stripeCheckoutSessionId?: string;
  createdAt: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  quantity: number;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
  purchaseOption?: PurchaseOption;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
  purchaseOption?: PurchaseOption;
  installmentMonths?: number;
  monthlyInstallment?: number;
  fullPlanPrice?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentProof?: string;
  rentalDocument?: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  stripeCheckoutSessionId?: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
}


