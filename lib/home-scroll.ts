/**
 * Mémorise l'endroit du catalogue que la visiteuse était en train de regarder.
 *
 * Pourquoi c'est nécessaire : l'accueil charge ses produits côté client, après
 * le premier rendu. Au moment où le navigateur tente sa restauration native, la
 * grille est encore vide et la page a une hauteur nulle — il n'y a nulle part où
 * revenir. On rejoue donc la position nous-mêmes, une fois le catalogue affiché.
 *
 * Les filtres font partie de la vue : revenir à la bonne position dans une liste
 * filtrée différemment afficherait d'autres produits au même endroit.
 *
 * sessionStorage : la mémoire s'efface à la fermeture de l'onglet, et n'est
 * jamais partagée entre visiteuses.
 */
const KEY = 'emmaashop-home-view';

export type HomeView = { scrollY: number; query: string; category: string };

export function saveHomeView(view: HomeView) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(view));
  } catch {
    // Navigation privée ou stockage plein : la restauration est un confort, pas
    // une fonctionnalité critique.
  }
}

export function readHomeView(): HomeView | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.scrollY !== 'number' || !Number.isFinite(parsed.scrollY)) return null;
    return {
      scrollY: Math.max(0, parsed.scrollY),
      query: typeof parsed.query === 'string' ? parsed.query : '',
      category: typeof parsed.category === 'string' ? parsed.category : 'Tout',
    };
  } catch {
    return null;
  }
}

/** Retour volontaire à l'accueil (clic sur le logo) : on repart du haut. */
export function forgetHomeView() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // sans effet
  }
}
