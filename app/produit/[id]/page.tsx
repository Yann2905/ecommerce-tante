import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ProductView from "./ProductView";

// Métadonnées par produit (SEO + aperçu de partage avec la photo du produit).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data: p } = await supabaseAdmin
      .from("products")
      .select("name, description, image_url, is_active")
      .eq("id", id)
      .single();

    if (!p || p.is_active === false) {
      return { title: "Produit introuvable", robots: { index: false } };
    }

    const title = p.name as string;
    const description =
      (p.description as string) ||
      `${p.name} — disponible sur Emmaashop, boutique de mode et d'élégance africaine.`;
    const images = p.image_url ? [{ url: p.image_url as string }] : undefined;

    return {
      title,
      description,
      alternates: { canonical: `/produit/${id}` },
      openGraph: { title, description, images, type: "website", url: `/produit/${id}` },
      twitter: { card: "summary_large_image", title, description, images: p.image_url ? [p.image_url as string] : undefined },
    };
  } catch {
    return {};
  }
}

export default function Page() {
  return <ProductView />;
}
