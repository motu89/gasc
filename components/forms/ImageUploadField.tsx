'use client'

import type { ChangeEvent } from 'react';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_UPLOADS } from '@/lib/constants';

interface ImageUploadFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  label: string;
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadField({ images, onChange, label }: ImageUploadFieldProps) {
  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);

    if (!fileList.length) {
      return;
    }

    const allowedFiles = fileList.slice(0, MAX_IMAGE_UPLOADS);
    const validFiles = allowedFiles.filter((file) => file.size <= MAX_IMAGE_SIZE_BYTES);

    const base64Images = await Promise.all(validFiles.map(fileToDataUrl));
    onChange([...images, ...base64Images].slice(0, MAX_IMAGE_UPLOADS));
    event.target.value = '';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="block w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-sm text-gray-700"
      />
      <p className="text-xs text-gray-500">
        Upload up to {MAX_IMAGE_UPLOADS} images. Each image must be smaller than 2 MB.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={`${image.slice(0, 20)}-${index}`} className="space-y-2">
              <div className="h-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img src={image} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
