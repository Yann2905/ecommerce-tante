import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Mentions légales · Emmaashop' };

export default function LegalNoticePage() {
  return <InfoPage eyebrow="Informations légales" title="Mentions légales." intro="Les informations d’identification de la boutique doivent être accessibles avant toute commande."><p className="border-l-2 border-[var(--sand)] bg-white p-4 text-[var(--ink)]"><strong>À compléter avant mise en production :</strong> dénomination légale, forme juridique, adresse, numéro d’immatriculation, numéro fiscal le cas échéant, hébergeur et responsable de publication.</p><h2>Éditeur du site</h2><p>Le site Emmaashop est édité par la personne ou société qui exploite la boutique. Les coordonnées complètes de l’éditeur et du responsable de publication doivent être renseignées dans cette section avant le déploiement public.</p><h2>Hébergement</h2><p>Le site est déployé via Vercel et les données de catalogue et de commande sont hébergées via Supabase. Les coordonnées et liens légaux à jour de ces prestataires doivent être conservés dans la version publiée.</p><h2>Propriété intellectuelle</h2><p>Les textes, visuels, éléments graphiques, marques et logos présents sur Emmaashop ne peuvent être reproduits ou réutilisés sans autorisation de leur titulaire.</p><h2>Contact</h2><p>Pour toute question concernant le site, écrivez à <a className="underline text-[var(--ink)]" href="mailto:contact@emmaashop.fr">contact@emmaashop.fr</a>.</p></InfoPage>;
}
