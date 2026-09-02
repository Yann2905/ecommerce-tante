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

export function isAdminUser(user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role;
  if (metadataRole === 'admin') return true;

  const email = user.email?.trim().toLowerCase();
  return Boolean(email && configuredAdminEmails().has(email));
}

/** Récupère l’utilisateur correspondant au Bearer token, sans lui attribuer de droits. */
export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  return error || !user ? null : user;
}

/** Vérifie le Bearer token et confirme que l’utilisateur est un administrateur. */
export async function getAuthUser(request: Request) {
  const user = await getAuthenticatedUser(request);
  return user && isAdminUser(user) ? user : null;
}
