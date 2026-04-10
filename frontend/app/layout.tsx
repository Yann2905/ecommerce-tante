import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Configuration de la police Inter (beaucoup plus stable que Geist)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Emma-Shop | Boutique Exclusive",
  description: "Découvrez la collection exclusive de mode et élégance africaine d'Emma-Shop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.className} min-h-full flex flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}