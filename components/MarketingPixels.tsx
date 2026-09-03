'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useConsent } from '@/lib/consent';
import { loadMarketingPixels, trackMarketingPageView } from '@/lib/marketing';

/**
 * Charge les pixels Meta/TikTok — jamais avant consentement — puis émet PageView
 * au premier chargement et à chaque changement de route (App Router : pas de
 * rechargement complet, donc pas de PageView automatique).
 *
 * Aucun script n'est injecté sur /admin ni /login (garde dans lib/marketing).
 */
export default function MarketingPixels() {
  const pathname = usePathname();
  const marketing = useConsent((state) => state.marketing);

  useEffect(() => {
    if (marketing !== 'granted') return;
    loadMarketingPixels();
    trackMarketingPageView();
  }, [marketing, pathname]);

  return null;
}
