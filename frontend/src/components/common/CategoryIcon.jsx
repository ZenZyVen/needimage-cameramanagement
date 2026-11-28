import React, { useState, useEffect } from 'react';
import { normalizeImageUrl } from '../../utils/imageHelper';

/**
 * Returns true if the stored category icon represents an image URL, upload path, or data URI.
 */
export function isImageIcon(icon) {
  if (!icon || typeof icon !== 'string') return false;
  const trimmed = icon.trim();
  if (!trimmed || trimmed.startsWith('bi-')) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('/') ||
    trimmed.includes('.')
  );
}

/**
 * Normalizes a category icon value before persisting to the API.
 * Preserves Bootstrap Icon classes (bi-*), relative /uploads paths, and data URIs.
 */
export function prepareCategoryIconForSave(rawIcon) {
  if (!rawIcon || typeof rawIcon !== 'string') return 'bi-camera';
  const trimmed = rawIcon.trim();
  if (!trimmed) return 'bi-camera';
  if (
    trimmed.startsWith('bi-') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Renders either a Bootstrap Icon or a custom category image (URL or uploaded file) cleanly.
 */
const CategoryIcon = ({
  icon,
  name = '',
  size = 18,
  className = '',
  fallback = 'bi-camera'
}) => {
  const [imgError, setImgError] = useState(false);
  const showImage = isImageIcon(icon) && !imgError;

  useEffect(() => {
    setImgError(false);
  }, [icon]);

  if (showImage) {
    return (
      <img
        src={normalizeImageUrl(icon)}
        alt={name || 'Category'}
        referrerPolicy="no-referrer"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          borderRadius: '4px',
          flexShrink: 0
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  const iconClass = !isImageIcon(icon) && icon ? icon : fallback;
  return (
    <i
      className={`bi ${iconClass} ${className}`.trim()}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    ></i>
  );
};

export default CategoryIcon;
