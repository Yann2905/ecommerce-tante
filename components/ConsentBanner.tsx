'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Cookie, X } from 'lucide-react';
import { useConsent } from '@/lib/consent';
import { isMarketingConfigured } from '@/lib/marketing';

/**
 * Bannière de consentement marketing. Aucun pixel publicitaire n'est chargé
 * avant un choix explicite (CNIL : le consentement précède le dépôt du traceur).
 *
 * Ne s'affiche pas sur /admin ni /login, et pas du tout si aucun Pixel ID n'est
 * configuré : il n'y aurait alors aucun traceur à faire accepter.
 */
export default function ConsentBanner() {
  const pathname = usePathname();
  const { marketing, decidedAt, hydrated, acceptAll, denyAll, setMarketing } = useConsent();
  const [details, setDetails] = useState(false);
  const [marketingChoice, setMarketingChoice] = useState(false);

  // Aligne la case du panneau « Personnaliser » sur le choix déjà enregistré.
  useEffect(() => setMarketingChoice(marketing === 'granted'), [marketing]);

  const isPrivateArea = pathname?.startsWith('/admin') || pathname?.startsWith('/login');
  if (!hydrated || decidedAt || isPrivateArea || !isMarketingConfigured()) return null;

  const savePreferences = () => setMarketing(marketingChoice ? 'granted' : 'denied');

  return (
    <div role="dialog" aria-modal="false" aria-label="Préférences de confidentialité"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--line)] bg-white shadow-[0_-8px_30px_rgba(0,0,0,.08)]">
      <div className="container-shop py-6">
        {details ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Personnaliser</p>
                <h2 className="display mt-2 text-3xl">Vos préférences.</h2>
              </div>
              <button type="button" onClick={() => setDetails(false)} aria-label="Fermer la personnalisation"
                className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--line)] text-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="border border-[var(--line)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">Strictement nécessaire</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Panier, session d’administration et mesure d’audience interne anonymisée.
                      Aucune donnée n’est transmise à un tiers publicitaire.
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Toujours actif
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4 border border-[var(--line)] p-4">
                <span>
                  <span className="block text-sm font-bold">Marketing et publicité</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                    Traceurs Meta (Facebook, Instagram) et TikTok, utilisés pour mesurer nos
                    campagnes et vous proposer des annonces pertinentes.
                  </span>
                </span>
                <input type="checkbox" checked={marketingChoice} onChange={(event) => setMarketingChoice(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--olive)]" />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={savePreferences} className="btn-primary sm:w-auto">
                <Check size={15} /> Enregistrer mes choix
              </button>
              <button type="button" onClick={acceptAll} className="btn-secondary sm:w-auto">
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Cookie size={22} className="mt-1 shrink-0 text-[var(--olive)]" />
              <div className="max-w-2xl">
                <p className="text-sm font-bold">Nous respectons votre choix.</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Nous utilisons des traceurs publicitaires Meta et TikTok uniquement si vous
                  l’acceptez, afin de mesurer nos campagnes. Le fonctionnement du site et notre
                  mesure d’audience interne anonymisée n’en dépendent pas.{' '}
                  <Link href="/confidentialite" className="underline">En savoir plus</Link>.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button type="button" onClick={acceptAll} className="btn-primary">Accepter</button>
              <button type="button" onClick={denyAll} className="btn-secondary">Refuser</button>
              <button type="button" onClick={() => setDetails(true)}
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)] underline hover:text-[var(--ink)]">
                Personnaliser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
