import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

const SITE_URL = "https://emmaashop.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/cart`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Ajoute chaque fiche produit active (aide Google à tout indexer).
  try {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, created_at")
      .eq("is_active", true);

    for (const p of data ?? []) {
      routes.push({
        url: `${SITE_URL}/produit/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Si la base est indisponible, on renvoie au moins les routes statiques.
  }

  return routes;
}
