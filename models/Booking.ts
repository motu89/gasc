import mongoose, { Model, Schema } from 'mongoose';

export interface BookingDocument {
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
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    serviceId: { type: String, required: true },
    serviceTitle: { type: String, required: true, trim: true },
    providerId: { type: String, required: true },
    providerName: { type: String, required: true, trim: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
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
      enum: ['easypaisa', 'jazzcash'],
    },
    paymentProof: { type: String },
  },
  {
    timestamps: true,
  }
);

export const BookingModel: Model<BookingDocument> =
  mongoose.models.Booking || mongoose.model<BookingDocument>('Booking', BookingSchema);
