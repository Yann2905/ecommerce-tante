import { supabaseAdmin } from './supabase-admin';

function configuredAdminEmails(): Set<string> {
  return new Set(
    [process.env.ADMIN_EMAILS, process.env.SHOP_EMAIL, process.env.OWNER_EMAIL]
      .filter(Boolean)
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: { email?: string | null; app_metadata?: Record<string, unknown> }): boolean {
  // Ne jamais lire user_metadata : ce champ peut être modifié par l’utilisateur.
  if (user.app_metadata?.role === 'admin') return true;
  const email = user.email?.trim().toLowerCase();
  return Boolean(email && configuredAdminEmails().has(email));
}

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return error || !user ? null : user;
}

export async function getAuthUser(request: Request) {
  const user = await getAuthenticatedUser(request);
  return user && isAdminUser(user) ? user : null;
}
