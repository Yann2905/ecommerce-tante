'use client';

import { Cookie } from 'lucide-react';
import { useConsent } from '@/lib/consent';
import { isMarketingConfigured } from '@/lib/marketing';

/**
 * Permet de revenir sur son choix depuis /confidentialite : remet `decidedAt` à
 * null, ce qui réaffiche la bannière. Un refus déjà enregistré reste actif tant
 * qu'un nouveau choix n'est pas fait.
 */
export default function ConsentPreferencesButton() {
  const { marketing, decidedAt, hydrated, reopen } = useConsent();
  if (!hydrated || !isMarketingConfigured()) return null;

  const label = !decidedAt
    ? 'Choix en attente'
    : marketing === 'granted' ? 'Traceurs publicitaires acceptés' : 'Traceurs publicitaires refusés';

  return (
    <span className="not-prose mt-4 flex flex-wrap items-center gap-3">
      <button type="button" onClick={reopen} className="btn-secondary">
        <Cookie size={15} /> Modifier mes préférences
      </button>
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
        État actuel : {label}
      </span>
    </span>
  );
}
