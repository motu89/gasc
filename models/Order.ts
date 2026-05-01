import mongoose, { Model, Schema } from 'mongoose';

export interface OrderItemDocument {
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

export interface OrderDocument {
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItemDocument[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'easypaisa' | 'jazzcash';
  paymentProof: string;
  vendorId: string;
  vendorName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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
  paymentMethod: { type: String, enum: ['sale', 'installment'] },
  installmentMonths: { type: Number, min: 1 },
  monthlyInstallment: { type: Number, min: 0 },
});

const OrderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'jazzcash'],
      required: true,
    },
    paymentProof: { type: String, required: true },
    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
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
