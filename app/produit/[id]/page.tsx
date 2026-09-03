import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
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

/**
 * Chargement serveur de la fiche.
 *
 * Avant, ProductView montait vide puis déclenchait trois requêtes client — dont
 * le catalogue entier, uniquement pour calculer les produits similaires. La fiche
 * mettait ainsi ~3 s à s'afficher. Tout est désormais résolu côté serveur : le
 * HTML arrive complet, il n'y a plus d'état de chargement.
 */
export const revalidate = 60;

const PRODUCT_FIELDS = 'id, name, description, price, discount_price, stock, category_id, image_url, gallery, is_active, categories(name)';

async function loadPage(id: string) {
  const { data: product } = await supabaseAdmin
    .from('products').select(PRODUCT_FIELDS).eq('id', id).eq('is_active', true).single();
  if (!product) return null;

  const [{ data: variants }, { data: catalogue }] = await Promise.all([
    supabaseAdmin.from('product_variants').select('*')
      .eq('product_id', id).eq('is_active', true).order('created_at', { ascending: true }),
    supabaseAdmin.from('products').select(PRODUCT_FIELDS)
      .eq('is_active', true).neq('id', id).order('created_at', { ascending: false }).limit(40),
  ]);

  // Même catégorie d'abord, complétée par le reste : une catégorie qui ne contient
  // qu'un seul article ne doit pas laisser un bas de page vide.
  const others = catalogue ?? [];
  const sameCategory = product.category_id ? others.filter((item: any) => item.category_id === product.category_id) : [];
  const sameCategoryIds = new Set(sameCategory.map((item: any) => item.id));
  const similar = [...sameCategory, ...others.filter((item: any) => !sameCategoryIds.has(item.id))].slice(0, 12);

  return { product, variants: variants ?? [], similar };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadPage(id).catch(() => null);
  if (!data) notFound();
  return <ProductView product={data.product} variants={data.variants as any} similar={data.similar} />;
}
