import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EventSchema = z.object({
  // Doit rester aligné sur la contrainte CHECK de site_activities (migration 0007) :
  // un type absent d'ici est rejeté en 400 même si Postgres l'accepterait.
  eventType: z.enum(['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'order_created']),
  path: z.string().trim().min(1).max(500).regex(/^\//),
});

function countryFromRequest(request: Request): string | null {
  const raw = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || request.headers.get('x-country');
  const country = raw?.trim().toUpperCase();
  return country && /^[A-Z]{2}$/.test(country) ? country : null;
}

function visitorIdFromRequest(request: Request): string | null {
  const value = request.headers.get('cookie')?.match(/(?:^|;\s*)emmaashop_visitor=([^;]+)/)?.[1];
  return value && /^[a-f0-9-]{16,80}$/i.test(value) ? value : null;
}

export async function POST(request: Request) {
  const parsed = EventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Événement invalide.' }, { status: 400 });

  const visitorId = visitorIdFromRequest(request) || crypto.randomUUID();
  const { error } = await supabaseAdmin.from('site_activities').insert({
    visitor_id: visitorId,
    event_type: parsed.data.eventType,
    path: parsed.data.path,
    country_code: countryFromRequest(request),
  });
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer la visite.' }, { status: 500 });

  const response = NextResponse.json({ ok: true });
  if (!visitorIdFromRequest(request)) {
    response.cookies.set('emmaashop_visitor', visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || !isAdminUser(user)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 403 });

  const rawDays = Number(new URL(request.url).searchParams.get('days') || 7);
  const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.floor(rawDays))) : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin.rpc('get_site_analytics', { p_since: since });
  if (error) return NextResponse.json({ error: 'Impossible de charger les statistiques.' }, { status: 500 });
  return NextResponse.json({ days, ...(data || { visits: 0, unique_visitors: 0, countries: [], events: [] }) });
}
