import { supabase } from './supabase'; // ✅ Import indispensable pour le token

const API_URL = "http://localhost:5000"; 

export async function apiCall(endpoint: string, options: any = {}) {
  // 1. Récupération du Token de session Supabase
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  // 2. Nettoyage de l'URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
  const url = `${API_URL}/${finalEndpoint}`;

  console.log(`🚀 Appel API : [${options.method || 'GET'}] ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // ✅ ON AJOUTE LA CLÉ ICI
        'Authorization': token ? `Bearer ${token}` : '', 
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur HTTP: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error("Le serveur Backend (port 5000) est éteint.");
    }
    throw error;
  }
}