import { supabaseAdmin } from './supabase-admin';

/**
 * ✅ Vérifie le token Bearer d'une requête et confirme un utilisateur valide.
 * Remplace l'ancien middleware Express `isAdmin`.
 *
 * @returns l'utilisateur Supabase si le token est valide, sinon `null`.
 */
export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
