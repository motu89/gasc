import mongoose, { Model, Schema } from 'mongoose';

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'vendor' | 'service_provider' | 'admin';
  phone?: string;
  address?: string;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'vendor', 'service_provider', 'admin'],
      required: true,
      default: 'user',
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    easyPaisaAccount: { type: String, trim: true },
    jazzCashAccount: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
