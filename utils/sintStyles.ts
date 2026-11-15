// The Sinterklaas photo per poem style, built by scripts/build-sint-images.ts
// into public/sint-styles/. The hero shows the style the visitor picked; the
// form shows a small avatar of it next to the style choice. Klassiek and
// Grappig keep the usual photo.

export type SintStyle = 'funny' | 'classic' | 'ironic' | 'old-fashioned' | 'spicy' | 'roast';

/** Styles with their own edited photo; the others show the usual one. */
const EDITED: readonly SintStyle[] = ['ironic', 'old-fashioned', 'spicy', 'roast'];

export interface SintPhoto {
  src: string;
  srcset: string;
}

/** The usual hero photo: before a style is picked, and for Klassiek and Grappig. */
export const DEFAULT_SINT_PHOTO: SintPhoto = {
  src: '/sint-hero-800.webp',
  srcset: '/sint-hero-400.webp 400w, /sint-hero-600.webp 600w, /sint-hero-800.webp 800w',
};

export function hasOwnPhoto(style: SintStyle | null): style is SintStyle {
  return style !== null && EDITED.includes(style);
}

export function sintStylePhoto(style: SintStyle | null): SintPhoto {
  if (!hasOwnPhoto(style)) return DEFAULT_SINT_PHOTO;
  const file = (width: number) => `/sint-styles/${style}-${width}.webp`;
  return {
    src: file(800),
    srcset: `${file(400)} 400w, ${file(600)} 600w, ${file(800)} 800w`,
  };
}

export function sintStyleAvatar(style: SintStyle): string {
  return `/sint-styles/${hasOwnPhoto(style) ? style : 'classic'}-176.webp`;
}
