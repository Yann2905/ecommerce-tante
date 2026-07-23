import { supabase } from './supabase';

/**
 * ✅ RÉCUPÉRATION DE L'URL DE BASE
 * L'API vit désormais dans la même app Next.js (app/api/**), donc same-origin :
 * on utilise des URLs relatives ("" => "/api/...").
 * NEXT_PUBLIC_API_URL reste utilisable si un jour l'API est hébergée ailleurs.
 */
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, ""); // Enlève le(s) slash(es) à la fin
  }
  return ""; // same-origin
};

const API_URL = getBaseUrl();

export async function apiCall(endpoint: string, options: any = {}) {
  // 1. Récupération du Token de session Supabase
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  // 2. Nettoyage de l'endpoint (on enlève le "/" au début et le "api/" s'il est déjà là)
  const cleanEndpoint = endpoint
    .replace(/^\/+/, "")        // Enlève les "/" au début
    .replace(/^api\//i, "");    // Enlève "api/" au début (insensible à la casse)

  /**
   * ✅ CONSTRUCTION DE L'URL FINALE
   * On s'assure que "/api" n'apparaît qu'une seule fois.
   */
  let finalUrl = "";
  if (API_URL.toLowerCase().endsWith("/api")) {
    finalUrl = `${API_URL}/${cleanEndpoint}`;
  } else {
    finalUrl = `${API_URL}/api/${cleanEndpoint}`;
  }

  console.log(`🚀 Appel API : [${options.method || 'GET'}] ${finalUrl}`);

  try {
    const response = await fetch(finalUrl, {
      ...options,
      mode: 'cors', // Crucial pour Safari/iPhone
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    // 3. Gestion de la réponse (JSON ou Texte)
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textData = await response.text();
      data = { message: textData };
    }

    if (!response.ok) {
      // Si le serveur renvoie une erreur check constraint (ton image 1)
      if (data.message?.includes("violates check constraint")) {
        throw new Error("Données invalides : Vérifiez le statut ou les champs obligatoires.");
      }
      throw new Error(data.error || data.message || `Erreur: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error("❌ Erreur API:", error);

    if (error.message === 'Failed to fetch') {
      throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
    }
    throw error;
  }
}