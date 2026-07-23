import { createClient } from '@supabase/supabase-js';

/**
 * ✅ Client Supabase ADMIN (service_role) — SERVEUR UNIQUEMENT.
 * À n'importer que dans des Route Handlers (app/api/**), jamais côté client.
 * Il bypasse les RLS : ne jamais l'exposer au navigateur.
 */
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Variables manquantes : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY sont requises.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
