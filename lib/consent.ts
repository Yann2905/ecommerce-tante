import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Consentement marketing (CNIL) : aucun traceur publicitaire ne doit être déposé
 * avant un choix explicite. Tant que `marketing` vaut 'denied', aucun script
 * Meta/TikTok n'est chargé et aucun événement serveur n'est envoyé.
 *
 * La mesure d'audience first-party (`AnalyticsTracker` + /api/analytics) reste
 * distincte : anonymisée, sans IP, sans partage tiers.
 */
export type ConsentValue = 'granted' | 'denied';

interface ConsentStore {
  marketing: ConsentValue;
  decidedAt: string | null;
  hydrated: boolean;
  acceptAll: () => void;
  denyAll: () => void;
  setMarketing: (value: ConsentValue) => void;
  reopen: () => void;
}

export const useConsent = create<ConsentStore>()(
  persist(
    (set) => ({
      marketing: 'denied',
      decidedAt: null,
      hydrated: false,

      acceptAll: () => set({ marketing: 'granted', decidedAt: new Date().toISOString() }),
      denyAll: () => set({ marketing: 'denied', decidedAt: new Date().toISOString() }),
      setMarketing: (value) => set({ marketing: value, decidedAt: new Date().toISOString() }),

      // Permet de revenir sur son choix depuis /confidentialite.
      reopen: () => set({ decidedAt: null }),
    }),
    {
      name: 'emmaashop-consent',
      version: 1,
      // `hydrated` ne doit jamais être persisté : il décrit l'état du navigateur.
      partialize: (state) => ({ marketing: state.marketing, decidedAt: state.decidedAt }),
      // Appelé même en navigation privée ou si localStorage lève : la bannière
      // doit pouvoir s'afficher dans tous les cas.
      onRehydrateStorage: () => () => useConsent.setState({ hydrated: true }),
    },
  ),
);

/** Vrai uniquement si l'utilisateur a explicitement accepté le marketing. */
export function hasMarketingConsent(): boolean {
  return useConsent.getState().marketing === 'granted';
}
