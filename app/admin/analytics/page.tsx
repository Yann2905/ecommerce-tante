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

const eventLabels: Record<string, string> = { page_view: 'Visite', product_view: 'Fiche produit', add_to_cart: 'Ajout au panier', checkout_started: 'Début commande', order_created: 'Commande' };

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
    <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[var(--muted)] sm:text-sm">Données anonymisées · aucun nom ni adresse IP enregistré</p><label className="grid grid-cols-[minmax(0,1fr)] gap-1 sm:contents"><span className="eyebrow sm:hidden">Période analysée</span><select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Période analysée" className="min-h-11 w-full border border-[var(--line)] bg-white px-3 py-2 font-bold sm:min-h-0 sm:w-auto sm:text-xs"><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option></select></label></div>
    {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-[var(--olive)]"/></div> : data && <>
      {/* 3 colonnes dès le mobile : empilées, ces tuiles occupaient un écran entier. */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-4">{[
        { icon: Eye, label: 'Pages vues', value: data.visits },
        { icon: Users, label: 'Visiteurs uniques', value: data.unique_visitors },
        { icon: Globe2, label: 'Pays détectés', value: data.countries.length },
      ].map(({ icon: Icon, label, value }) => <div key={label} className="min-w-0 bg-white p-3 sm:p-5"><Icon className="h-4 w-4 text-[var(--olive)] sm:h-5 sm:w-5"/><p className="mt-3 text-[10px] leading-tight text-[var(--muted)] sm:mt-6 sm:text-xs">{label}</p><p className="mt-1 text-xl font-bold tabular-nums sm:mt-2 sm:text-3xl">{value}</p></div>)}</div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><section className="min-w-0 bg-white p-4 sm:p-6"><div className="flex items-center gap-3 border-b border-[var(--line)] pb-4"><Globe2 size={18} className="shrink-0 text-[var(--olive)]"/><h2 className="display text-xl sm:text-2xl">Origine des visiteurs</h2></div><div className="mt-3 divide-y divide-[var(--line)]">{data.countries.length ? data.countries.map((country) => <div key={country.country} className="flex items-center justify-between gap-3 py-4 sm:gap-4"><div className="min-w-0"><p className="truncate font-semibold">{countryName(country.country)}</p><p className="mt-1 text-xs text-[var(--muted)]">{country.visitors} visiteur{country.visitors > 1 ? 's' : ''}</p></div><strong className="shrink-0 whitespace-nowrap tabular-nums">{country.visits} vue{country.visits > 1 ? 's' : ''}</strong></div>) : <p className="py-8 text-sm text-[var(--muted)]">Aucune donnée pour cette période.</p>}</div></section><section className="min-w-0 bg-white p-4 sm:p-6"><div className="flex items-center gap-3 border-b border-[var(--line)] pb-4"><Activity size={18} className="shrink-0 text-[var(--olive)]"/><h2 className="display text-xl sm:text-2xl">Activité récente</h2></div><div className="mt-3 divide-y divide-[var(--line)]">{data.events.length ? data.events.map((event, index) => <div key={`${event.created_at}-${index}`} className="flex items-start justify-between gap-3 py-4 sm:gap-4"><div className="min-w-0"><p className="truncate font-semibold">{eventLabels[event.event_type] || event.event_type}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{event.path} · {event.country_code ? countryName(event.country_code) : 'Pays inconnu'}</p></div><time className="shrink-0 whitespace-nowrap text-[10px] text-[var(--muted)]">{date(event.created_at)}</time></div>) : <p className="py-8 text-sm text-[var(--muted)]">Aucune activité pour cette période.</p>}</div></section></div>
    </>}
  </AdminChrome>;
}
