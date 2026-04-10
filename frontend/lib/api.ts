import { supabase } from './supabase';

/**
 * ✅ RÉCUPÉRATION DYNAMIQUE DE L'URL
 * Sur Render, il lira la variable d'environnement (HTTPS).
 * Sur ton PC (en local), il utilisera localhost.
 */
const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (envUrl) {
    // Retire le slash final et l'étoile si présents pour éviter les erreurs d'URL
    return envUrl.replace(/\/$/, "").replace(/\*$/, "");
  }

  return "http://localhost:5000";
};

const API_URL = getBaseUrl();

export async function apiCall(endpoint: string, options: any = {}) {
  // 1. Récupération du Token de session Supabase pour l'authentification
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  // 2. Nettoyage de l'endpoint (on enlève le / au début s'il existe)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  /**
   * ✅ CONSTRUCTION DE L'URL FINALE
   * On vérifie si l'API_URL contient déjà "/api". 
   * Si non, on l'ajoute pour correspondre à tes routes Backend.
   */
  let finalUrl = "";
  if (API_URL.includes("/api")) {
    finalUrl = `${API_URL}/${cleanEndpoint}`;
  } else {
    finalUrl = `${API_URL}/api/${cleanEndpoint}`;
  }

  console.log(`🚀 Appel API : [${options.method || 'GET'}] ${finalUrl}`);

  try {
    const response = await fetch(finalUrl, {
      ...options,
      // Force le mode cors pour les navigateurs mobiles
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    // Cas spécifique où le serveur ne renvoie pas de JSON (ex: erreur 500 brute)
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur serveur : ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error("❌ Erreur apiCall:", error);

    // Message clair pour le débogage sur téléphone
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error("Connexion impossible au serveur. Vérifie que le Backend Render est bien démarré (HTTPS) et que les CORS sont ouverts.");
    }

    throw error;
  }
}