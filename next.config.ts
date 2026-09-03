import type { NextConfig } from 'next';

/**
 * Origines tierces autorisées, regroupées par usage.
 *
 * ⚠️ Les régies publicitaires sont bloquées SILENCIEUSEMENT par la CSP si leur
 * domaine manque : le script ne se charge pas, aucune erreur JS n'est levée, et
 * Events Manager reste vide. Après activation des pixels, vérifier la console du
 * navigateur (« Refused to load / Refused to connect ») avant de conclure à un
 * problème de configuration côté Meta ou TikTok.
 */
const SUPABASE = 'https://*.supabase.co';
const CLOUDINARY = ['https://api.cloudinary.com', 'https://res.cloudinary.com'];
const META = ['https://connect.facebook.net', 'https://www.facebook.com'];
const TIKTOK = ['https://analytics.tiktok.com', 'https://*.tiktokv.com'];
const FONTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  `img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com ${[...META, ...TIKTOK].join(' ')}`,
  `font-src 'self' ${FONTS.join(' ')}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${[...META, ...TIKTOK].join(' ')}`,
  `connect-src 'self' ${SUPABASE} ${[...CLOUDINARY, ...META, ...TIKTOK].join(' ')}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
