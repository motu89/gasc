import mongoose, { Model, Schema } from 'mongoose';

export interface ProductDocument {
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale' | 'installment' | 'sale_installment';
  availableOnInstallment: boolean;
  category: 'electronics' | 'home_appliances' | 'machinery' | 'furniture' | 'vehicles' | 'other';
  images: string[];
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
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
    type: { type: String, enum: ['rent', 'sale', 'installment', 'sale_installment'], required: true },
    availableOnInstallment: { type: Boolean, default: false },
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
    vendorEmail: { type: String, trim: true },
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

export const ProductModel: Model<ProductDocument> = (() => {
  if (mongoose.models.Product) {
    // Delete cached model to apply schema updates
    delete mongoose.models.Product;
  }
  return mongoose.model<ProductDocument>('Product', ProductSchema);
})();
