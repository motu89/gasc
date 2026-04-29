import mongoose, { Model, Schema } from 'mongoose';

export interface ServiceDocument {
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
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<ServiceDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 2,
        message: 'A service can have at most 2 images.',
      },
    },
    providerId: { type: String, required: true },
    providerName: { type: String, required: true, trim: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalBookings: { type: Number, default: 0, min: 0 },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ServiceModel: Model<ServiceDocument> =
  mongoose.models.Service || mongoose.model<ServiceDocument>('Service', ServiceSchema);
