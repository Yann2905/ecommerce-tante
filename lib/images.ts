/**
 * Transformations Cloudinary appliquées à la volée aux images produits.
 *
 * Le catalogue stocke le `secure_url` brut renvoyé par l'upload : sans
 * transformation, l'original de l'appareil photo (souvent plusieurs Mo) est servi
 * partout — y compris dans les vignettes de 96 px du panier. Injecter les
 * paramètres dans l'URL corrige cela **sans migration de base** : les URLs déjà
 * enregistrées continuent de fonctionner.
 *
 * On passe volontairement par Cloudinary plutôt que par `next/image` pour ces
 * images : la transformation est déjà incluse dans le service qui les héberge,
 * et les faire transiter par l'optimiseur Vercel serait payer deux fois le même
 * travail. `next/image` reste utilisé pour les images locales de `public/`.
 *
 *   f_auto   → AVIF/WebP selon le navigateur
 *   q_auto   → qualité adaptée au contenu
 *   c_limit  → ne jamais agrandir une image plus petite que demandé
 *   dpr_auto → densité d'écran gérée par Cloudinary
 */

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

function isCloudinary(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

/**
 * Renvoie l'URL transformée, ou l'URL d'origine telle quelle si elle ne vient pas
 * de Cloudinary (anciennes images Supabase Storage, URL externe, chaîne vide).
 */
export function productImageUrl(url: string | null | undefined, width: number): string {
  if (!url || !isCloudinary(url)) return url || '';

  const [prefix, rest] = url.split(CLOUDINARY_UPLOAD_SEGMENT);

  // Une URL déjà transformée (réenregistrée par erreur) ne doit pas être empilée.
  if (/^(?:[a-z]+_[^/,]+)(?:,[a-z]+_[^/,]+)*\//.test(rest)) return url;

  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}f_auto,q_auto,c_limit,dpr_auto,w_${width}/${rest}`;
}

/**
 * `srcset` sur plusieurs largeurs, pour que le navigateur choisisse selon la
 * taille réelle d'affichage. À accompagner d'un attribut `sizes`.
 */
export function productImageSrcSet(url: string | null | undefined, widths: number[]): string | undefined {
  if (!url || !isCloudinary(url)) return undefined;
  return widths.map((width) => `${productImageUrl(url, width)} ${width}w`).join(', ');
}

/** Largeurs de référence, alignées sur les emplacements réels du site. */
export const IMAGE_WIDTHS = {
  /** Vignette panier et miniatures de galerie. */
  thumb: [96, 192, 288],
  /** Carte produit : 2 colonnes sur mobile, 4 sur desktop. */
  card: [280, 400, 560, 720],
  /** Image principale de la fiche produit. */
  detail: [480, 720, 960, 1280],
} as const;
