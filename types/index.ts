export type UserRole = 'user' | 'vendor' | 'service_provider' | 'admin';

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
  userId: string;
  userName: string;
  date: string;
  time: string;
  duration: number;
  fullPrice: number;
  depositAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethod?: 'easypaisa' | 'jazzcash';
  paymentProof?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: 'sale' | 'installment';
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  rentalDays?: number;
  paymentMethod?: 'sale' | 'installment';
  installmentMonths?: number;
  monthlyInstallment?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'easypaisa' | 'jazzcash';
  paymentProof: string;
  vendorId: string;
  vendorName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface PaymentModalState {
  isOpen: boolean;
  step: 'select-method' | 'view-details' | 'upload-proof';
  selectedMethod: 'easypaisa' | 'jazzcash' | null;
  accountNumber: string;
  screenshot: string | null;
}

export interface ApiErrorResponse {
  error: string;
}


