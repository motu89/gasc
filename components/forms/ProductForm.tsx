'use client'

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/forms/ImageUploadField';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/lib/constants';
import { getProductCategoryLabel, getProductTypeLabel } from '@/lib/format';
import { Product } from '@/types';

type ProductFormValues = {
  title: string;
  description: string;
  price: string;
  type: 'rent' | 'sale';
  availableOnInstallment: boolean;
  category: Product['category'];
  images: string[];
  location: string;
  available: boolean;
  installmentMonths: string;
  monthlyInstallment: string;
};

const defaultValues: ProductFormValues = {
  title: '',
  description: '',
  price: '',
  type: 'sale',
  availableOnInstallment: false,
  category: 'electronics',
  images: [],
  location: '',
  available: true,
  installmentMonths: '',
  monthlyInstallment: '',
};

function mapProductToForm(product?: Product | null): ProductFormValues {
  if (!product) {
    return defaultValues;
  }

  return {
    title: product.title,
    description: product.description,
    price: String(product.price),
    type: product.type === 'rent' ? 'rent' : 'sale',
    availableOnInstallment: Boolean(product.availableOnInstallment),
    category: product.category,
    images: product.images || [],
    location: product.location,
    available: product.available,
    installmentMonths: product.installmentMonths ? String(product.installmentMonths) : '',
    monthlyInstallment: product.monthlyInstallment ? String(product.monthlyInstallment) : '',
  };
}

interface ProductFormProps {
  initialProduct?: Product | null;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel?: () => void;
}

export default function ProductForm({
  initialProduct,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [formValues, setFormValues] = useState<ProductFormValues>(mapProductToForm(initialProduct));

  useEffect(() => {
    setFormValues(mapProductToForm(initialProduct));
  }, [initialProduct]);

  const updateField = <Key extends keyof ProductFormValues>(key: Key, value: ProductFormValues[Key]) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(formValues);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Product title</label>
          <input
            value={formValues.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="MacBook Pro 16"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Location</label>
          <input
            value={formValues.location}
            onChange={(event) => updateField('location', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="Lahore"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-800">Description</label>
        <textarea
          value={formValues.description}
          onChange={(event) => updateField('description', event.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          placeholder="Describe the product, condition, and terms."
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            {formValues.type === 'rent' ? 'Price per day (PKR)' : 'Price (PKR)'}
          </label>
          <input
            type="number"
            min="1"
            value={formValues.price}
            onChange={(event) => updateField('price', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder={formValues.type === 'rent' ? '2500' : '50000'}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {formValues.type === 'rent' ? 'This will be shown to customers as price per day.' : 'One-time product price.'}
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Type</label>
          <select
            value={formValues.type}
            onChange={(event) => {
              const nextType = event.target.value as 'rent' | 'sale';
              updateField('type', nextType);
              if (nextType === 'rent') {
                updateField('availableOnInstallment', false);
                updateField('installmentMonths', '');
                updateField('monthlyInstallment', '');
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {getProductTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Category</label>
          <select
            value={formValues.category}
            onChange={(event) => updateField('category', event.target.value as Product['category'])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {getProductCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formValues.type === 'sale' && (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <input
              id="product-installment"
              type="checkbox"
              checked={formValues.availableOnInstallment}
              onChange={(event) => updateField('availableOnInstallment', event.target.checked)}
            />
            <label htmlFor="product-installment" className="text-sm font-medium text-gray-800">
              Available on installment
            </label>
          </div>

          {formValues.availableOnInstallment && (
            <div className="rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-orange-800">Installment Plan</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">Installment Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={formValues.installmentMonths}
                    onChange={(event) => updateField('installmentMonths', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="12"
                    required={formValues.availableOnInstallment}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-800">Monthly Installment Amount (PKR)</label>
                  <input
                    type="number"
                    min="1"
                    value={formValues.monthlyInstallment}
                    onChange={(event) => updateField('monthlyInstallment', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    placeholder="5000"
                    required={formValues.availableOnInstallment}
                  />
                  {formValues.installmentMonths && formValues.monthlyInstallment && (
                    <p className="mt-1 text-xs font-medium text-green-600">
                      Total plan value: PKR {(parseInt(formValues.monthlyInstallment, 10) * parseInt(formValues.installmentMonths, 10)).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        <input
          id="product-available"
          type="checkbox"
          checked={formValues.available}
          onChange={(event) => updateField('available', event.target.checked)}
        />
        <label htmlFor="product-available" className="text-sm font-medium text-gray-800">
          Available for customers
        </label>
      </div>

      <ImageUploadField
        images={formValues.images}
        onChange={(images) => updateField('images', images)}
        label="Product images"
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : initialProduct ? 'Update Product' : 'Add Product'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
