import mongoose, { Model, Schema } from 'mongoose';

export interface ProductDocument {
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale' | 'installment';
  category: 'electronics' | 'home_appliances' | 'machinery' | 'furniture' | 'vehicles' | 'other';
  images: string[];
  vendorId: string;
  vendorName: string;
  location: string;
  available: boolean;
  installmentMonths?: number;
  monthlyInstallment?: number;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['rent', 'sale', 'installment'], required: true },
    category: {
      type: String,
      enum: ['electronics', 'home_appliances', 'machinery', 'furniture', 'vehicles', 'other'],
      required: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 2,
        message: 'A product can have at most 2 images.',
      },
    },
    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
    installmentMonths: { type: Number, min: 1 },
    monthlyInstallment: { type: Number, min: 0 },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ProductModel: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);
