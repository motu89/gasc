import mongoose, { Model, Schema } from 'mongoose';

export interface OrderItemDocument {
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  rentalDays?: number;
  startDate?: string;
  endDate?: string;
  purchaseOption?: 'full' | 'installment';
  installmentMonths?: number;
  monthlyInstallment?: number;
  fullPlanPrice?: number;
}

export interface OrderDocument {
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  shippingAddress: string;
  items: OrderItemDocument[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'easypaisa' | 'jazzcash' | 'cod' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentReference?: string;
  paymentProof?: string;
  rentalDocument?: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  stripeCheckoutSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItemDocument>({
  productId: { type: String, required: true },
  productTitle: { type: String, required: true, trim: true },
  productImage: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  rentalDays: { type: Number, min: 1 },
  startDate: { type: String },
  endDate: { type: String },
  purchaseOption: { type: String, enum: ['full', 'installment'] },
  installmentMonths: { type: Number, min: 1 },
  monthlyInstallment: { type: Number, min: 0 },
  fullPlanPrice: { type: Number, min: 0 },
});

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    shippingAddress: { type: String, required: true, trim: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'cod', 'card'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentReference: { type: String, trim: true },
    paymentProof: { type: String },
    rentalDocument: { type: String },
    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true, trim: true },
    vendorEmail: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    stripeCheckoutSessionId: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const OrderModel: Model<OrderDocument> = (() => {
  if (mongoose.models.Order) {
    delete mongoose.models.Order;
  }
  return mongoose.model<OrderDocument>('Order', OrderSchema);
})();
