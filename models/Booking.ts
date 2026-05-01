import mongoose, { Model, Schema } from 'mongoose';

export interface BookingDocument {
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
  paymentMethod?: 'easypaisa' | 'jazzcash' | 'cod' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentReference?: string;
  paymentProof?: string;
  stripeCheckoutSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    serviceId: { type: String, required: true },
    serviceTitle: { type: String, required: true, trim: true },
    providerId: { type: String, required: true },
    providerName: { type: String, required: true, trim: true },
    providerEmail: { type: String, trim: true, lowercase: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    userAddress: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    fullPrice: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'cod', 'card'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentReference: { type: String, trim: true },
    paymentProof: { type: String },
    stripeCheckoutSessionId: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const BookingModel: Model<BookingDocument> = (() => {
  if (mongoose.models.Booking) {
    delete mongoose.models.Booking;
  }

  return mongoose.model<BookingDocument>('Booking', BookingSchema);
})();
