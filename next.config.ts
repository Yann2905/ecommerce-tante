/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'; img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://api.cloudinary.com https://res.cloudinary.com; media-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Les sources de `public/` plafonnent à 1200 px : annoncer 1920/2048/3840
    // ne produirait que des variantes upscalées, facturées et jamais utiles.
    deviceSizes: [360, 480, 640, 828, 1080, 1200],
    imageSizes: [96, 128, 256, 384],
    // AVIF d'abord, WebP en repli. Les images produits passent par Cloudinary
    // (voir lib/images.ts) et ne traversent pas cet optimiseur.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
