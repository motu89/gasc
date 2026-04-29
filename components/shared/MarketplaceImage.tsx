'use client'

interface MarketplaceImageProps {
  src?: string;
  alt: string;
  fallbackLabel: string;
  className?: string;
  imgClassName?: string;
}

export default function MarketplaceImage({
  src,
  alt,
  fallbackLabel,
  className = '',
  imgClassName = '',
}: MarketplaceImageProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary-100 via-white to-primary-200 ${className}`}
      >
        <span className="text-4xl font-bold text-primary-600">
          {fallbackLabel.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-gray-100 ${className}`}>
      <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  );
}
