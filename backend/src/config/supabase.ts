import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// On charge le .env qui est à la racine du dossier backend
dotenv.config();

// ✅ On utilise les noms EXACTS de ton fichier .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- Tentative de connexion Supabase ---");
console.log("URL détectée :", supabaseUrl ? "OUI ✅" : "NON ❌");
console.log("Clé Admin détectée :", supabaseServiceKey ? "OUI ✅" : "NON ❌");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERREUR : Les variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY sont introuvables.");
  console.log("Vérifiez que votre fichier .env contient bien ces noms exacts.");
  process.exit(1);
}

// Création du client avec les pleins pouvoirs (Service Role)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log("🚀 Client Supabase Admin initialisé avec succès !");