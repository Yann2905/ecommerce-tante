'use client';

import { useEffect, useState } from 'react';
import { Activity, Globe2, Loader2, Users, Eye } from 'lucide-react';
import AdminChrome from '@/components/AdminChrome';
import { apiCall } from '@/lib/api';

type Analytics = {
  days: number;
  visits: number;
  unique_visitors: number;
  countries: Array<{ country: string; visits: number; visitors: number }>;
  events: Array<{ event_type: string; path: string; country_code: string | null; created_at: string }>;
};

const eventLabels: Record<string, string> = { page_view: 'Visite', product_view: 'Fiche produit', add_to_cart: 'Ajout au panier', checkout_started: 'Début commande' };

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiCall(`/api/analytics?days=${days}`).then(setData).catch((err) => setError(err instanceof Error ? err.message : 'Impossible de charger les statistiques.')).finally(() => setLoading(false));
  }, [days]);

  const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  const countryName = (code: string) => code === 'XX' ? 'Inconnu' : new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) || code;

  return <AdminChrome eyebrow="Audience & activité" title="Statistiques">
    {error && <p role="alert" className="mt-6 bg-[#f9e8e4] p-3 text-xs text-[var(--coral)]">{error}</p>}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--muted)]">Données anonymisées · aucun nom ni adresse IP enregistré</p><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold"><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option></select></div>
    {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[var(--olive)]"/></div> : data && <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="bg-white p-5"><Eye size={19} className="text-[var(--olive)]"/><p className="mt-6 text-xs text-[var(--muted)]">Pages vues</p><p className="mt-2 text-3xl font-bold">{data.visits}</p></div><div className="bg-white p-5"><Users size={19} className="text-[var(--olive)]"/><p className="mt-6 text-xs text-[var(--muted)]">Visiteurs uniques</p><p className="mt-2 text-3xl font-bold">{data.unique_visitors}</p></div><div className="bg-white p-5"><Globe2 size={19} className="text-[var(--olive)]"/><p className="mt-6 text-xs text-[var(--muted)]">Pays détectés</p><p className="mt-2 text-3xl font-bold">{data.countries.length}</p></div></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="bg-white p-6"><div className="flex items-center gap-3 border-b border-[var(--line)] pb-4"><Globe2 size={18} className="text-[var(--olive)]"/><h2 className="display text-2xl">Origine des visiteurs</h2></div><div className="mt-3 divide-y divide-[var(--line)]">{data.countries.length ? data.countries.map((country) => <div key={country.country} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{countryName(country.country)}</p><p className="mt-1 text-xs text-[var(--muted)]">{country.visitors} visiteur{country.visitors > 1 ? 's' : ''}</p></div><strong>{country.visits} vue{country.visits > 1 ? 's' : ''}</strong></div>) : <p className="py-8 text-sm text-[var(--muted)]">Aucune donnée pour cette période.</p>}</div></section><section className="bg-white p-6"><div className="flex items-center gap-3 border-b border-[var(--line)] pb-4"><Activity size={18} className="text-[var(--olive)]"/><h2 className="display text-2xl">Activité récente</h2></div><div className="mt-3 divide-y divide-[var(--line)]">{data.events.length ? data.events.map((event, index) => <div key={`${event.created_at}-${index}`} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><p className="font-semibold">{eventLabels[event.event_type] || event.event_type}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{event.path} · {event.country_code ? countryName(event.country_code) : 'Pays inconnu'}</p></div><time className="shrink-0 text-[10px] text-[var(--muted)]">{date(event.created_at)}</time></div>) : <p className="py-8 text-sm text-[var(--muted)]">Aucune activité pour cette période.</p>}</div></section></div>
    </>}
  </AdminChrome>;
}
