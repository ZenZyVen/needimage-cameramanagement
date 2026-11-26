export const DEFAULT_EQUIPMENT_IMAGE =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80';

export const DEFAULT_AVATAR_IMAGE =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

/**
 * Normalizes user-entered or stored image URLs so relative /uploads paths,
 * data URIs, and external HTTP(S) URLs all resolve cleanly.
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Safe img onError handler that swaps to a fallback image without infinite loops.
 */
export function handleImgError(fallback = DEFAULT_EQUIPMENT_IMAGE) {
  return (e) => {
    e.currentTarget.onerror = null;
    if (e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
  };
}
