import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from '@/components/AnalyticsTracker';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const SITE_URL = "https://emmaashop.fr";
const SITE_NAME = "Emmaashop";
const DESCRIPTION =
  "Emmaashop, la boutique en ligne de mode et d'élégance africaine : boubous, caftans, robes et ensembles d'exception. Commande facile, livraison en Côte d'Ivoire et à l'international.";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f2a24',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Emmaashop — Boutique de mode & élégance africaine",
    template: "%s | Emmaashop",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Emmaashop Studio',
    statusBarStyle: 'black-translucent',
  },
  keywords: [
    "Emmaashop", "Emma shop", "emmashop", "Emma-Shop", "emmaashop.fr",
    "boutique mode africaine", "vêtements africains", "boubou", "caftan",
    "robe africaine", "ensemble africain", "mode femme africaine", "Côte d'Ivoire",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Emmaashop — Boutique de mode & élégance africaine",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Emmaashop — Boutique de mode & élégance africaine",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "shopping",
};

// Données structurées : aide Google à comprendre la marque + activer la recherche.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: DESCRIPTION,
      areaServed: "CI",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "fr-FR",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`h-full ${inter.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-full flex flex-col antialiased">
        <AnalyticsTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
