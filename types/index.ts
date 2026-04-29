export type UserRole = 'user' | 'vendor' | 'service_provider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: string;
}

export type ProductType = 'rent' | 'sale' | 'installment';
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
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  deliveryAddress: string;
}

export interface ApiErrorResponse {
  error: string;
}


