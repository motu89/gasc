'use client'

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/forms/ImageUploadField';
import { SERVICE_CATEGORIES } from '@/lib/constants';
import { Service } from '@/types';

type ServiceFormValues = {
  title: string;
  description: string;
  category: string;
  images: string[];
  hourlyRate: string;
  location: string;
  available: boolean;
};

const defaultValues: ServiceFormValues = {
  title: '',
  description: '',
  category: SERVICE_CATEGORIES[0],
  images: [],
  hourlyRate: '',
  location: '',
  available: true,
};

function mapServiceToForm(service?: Service | null): ServiceFormValues {
  if (!service) {
    return defaultValues;
  }

  return {
    title: service.title,
    description: service.description,
    category: service.category,
    images: service.images || [],
    hourlyRate: String(service.hourlyRate),
    location: service.location,
    available: service.available,
  };
}

interface ServiceFormProps {
  initialService?: Service | null;
  isSubmitting: boolean;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  onCancel?: () => void;
}

export default function ServiceForm({
  initialService,
  isSubmitting,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [formValues, setFormValues] = useState<ServiceFormValues>(mapServiceToForm(initialService));

  useEffect(() => {
    setFormValues(mapServiceToForm(initialService));
  }, [initialService]);

  const updateField = <Key extends keyof ServiceFormValues>(key: Key, value: ServiceFormValues[Key]) => {
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
          <label className="mb-2 block text-sm font-medium text-gray-800">Service title</label>
          <input
            value={formValues.title}
            onChange={(event) => updateField('title', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="Electrician Services"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Location</label>
          <input
            value={formValues.location}
            onChange={(event) => updateField('location', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="Karachi"
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
          placeholder="Describe what is included in your service."
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Category</label>
          <select
            value={formValues.category}
            onChange={(event) => updateField('category', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">Hourly rate</label>
          <input
            type="number"
            min="1"
            value={formValues.hourlyRate}
            onChange={(event) => updateField('hourlyRate', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder="3000"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="service-available"
          type="checkbox"
          checked={formValues.available}
          onChange={(event) => updateField('available', event.target.checked)}
        />
        <label htmlFor="service-available" className="text-sm font-medium text-gray-800">
          Available for bookings
        </label>
      </div>

      <ImageUploadField
        images={formValues.images}
        onChange={(images) => updateField('images', images)}
        label="Service images"
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : initialService ? 'Update Service' : 'Add Service'}
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
