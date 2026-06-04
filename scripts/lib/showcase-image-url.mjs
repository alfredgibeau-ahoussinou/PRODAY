/**
 * URLs Unsplash recadrées (imgix) — sujets centrés pour les cartes UI ProDay.
 */

const BASE = 'https://images.unsplash.com/photo-';

export function showcaseUrl(photoId, { w = 1400, h = 900, crop = 'faces' } = {}) {
  const params = new URLSearchParams({
    w: String(w),
    h: String(h),
    fit: 'crop',
    crop,
    auto: 'format',
    q: '85',
  });
  return `${BASE}${photoId}?${params}`;
}

/** Hero plein écran (16:9). */
export const HERO = (id, crop = 'faces') => showcaseUrl(id, { w: 1400, h: 788, crop });

/** Cartes Discover / modules (4:3). */
export const CARD = (id, crop = 'faces') => showcaseUrl(id, { w: 1200, h: 900, crop });

/** Bandeau bas (21:9). */
export const WIDE = (id, crop = 'faces') => showcaseUrl(id, { w: 1400, h: 600, crop });

/** Stade / terrain sans portrait. */
export const STADIUM = (id) => showcaseUrl(id, { w: 1400, h: 788, crop: 'entropy' });

/** Pexels — foot féminin (licence Pexels, 13 visuels distincts). */
const pexelsBase = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

export const PEXELS_HERO = (id) => pexelsBase(id, 1400, 788);
export const PEXELS_CARD = (id) => pexelsBase(id, 1200, 900);
export const PEXELS_WIDE = (id) => pexelsBase(id, 1400, 600);
export const PEXELS_STADIUM = (id) => pexelsBase(id, 1400, 788);
