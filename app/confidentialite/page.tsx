import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Confidentialité · Emmaashop' };

export default function PrivacyPage() {
  return <InfoPage eyebrow="Données personnelles" title="Confidentialité." intro="Nous limitons les données collectées à ce qui est nécessaire pour répondre à votre demande et traiter votre commande."><h2>Données collectées</h2><p>Lors d’une commande, nous collectons votre nom, votre adresse e-mail, votre numéro de téléphone, votre adresse de livraison et le contenu de la commande. Ces informations servent à confirmer la commande, organiser la livraison, répondre à vos demandes et assurer le suivi du service.</p><h2>Conservation et accès</h2><p>Les données sont conservées pendant la durée nécessaire à la gestion de la relation commerciale et aux obligations applicables. L’accès est limité aux personnes qui doivent traiter les commandes. Les prestataires techniques utilisés par le site peuvent traiter certaines données uniquement pour fournir leurs services.</p><h2>Vos demandes</h2><p>Pour demander l’accès, la correction ou la suppression de vos données, écrivez à <a className="underline text-[var(--ink)]" href="mailto:contact@emmaashop.fr">contact@emmaashop.fr</a> en précisant l’objet de votre demande.</p><p className="border-l-2 border-[var(--sand)] bg-white p-4 text-[var(--ink)]"><strong>À vérifier avant publication :</strong> durée de conservation exacte, base légale, responsable du traitement, transferts éventuels et autorité de contrôle compétente.</p></InfoPage>;
}
