'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { sendInternalEvent } from '@/lib/analytics-client';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/login')) return;

    // Une seule vue par page et par session. sessionStorage peut lever en
    // navigation privée : la mesure est alors dégradée, jamais bloquante.
    try {
      const key = `emmaashop:tracked:${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // On mesure quand même la vue, au risque d'un doublon.
    }

    sendInternalEvent(pathname.startsWith('/produit/') ? 'product_view' : 'page_view', pathname);
  }, [pathname]);

  return null;
}
