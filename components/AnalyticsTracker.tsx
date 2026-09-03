'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/login')) return;
    const key = `emmaashop:tracked:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: pathname.startsWith('/produit/') ? 'product_view' : 'page_view',
        path: pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
