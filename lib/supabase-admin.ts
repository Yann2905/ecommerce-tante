import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuration Supabase serveur manquante. Renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
  }
  client ??= createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

// L’accès est évalué à la première requête et non à l’import du module : cela
// permet à `next build` de fonctionner sans .env local, sans assouplir la prod.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const value = (getClient() as any)[property];
    return typeof value === 'function' ? value.bind(getClient()) : value;
  },
});
