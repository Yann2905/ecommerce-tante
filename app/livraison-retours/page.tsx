import type { Metadata } from 'next';
import InfoPage from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Livraison & retours · Emmaashop' };

export default function DeliveryReturnsPage() {
  return <InfoPage eyebrow="Service client" title="Livraison & retours." intro="Tout ce qu’il faut savoir avant de recevoir une pièce Emmaashop."><h2>Livraison</h2><p>Nous préparons chaque commande avec soin et vous contactons au numéro indiqué afin de confirmer l’adresse, le créneau et les modalités de remise. La livraison est proposée dans les zones desservies en Côte d’Ivoire. Le délai et les frais exacts sont confirmés avec vous avant l’expédition.</p><h2>Réception de la commande</h2><p>À la réception, vérifiez l’état du colis et de la pièce. En cas d’anomalie, prenez des photos et contactez-nous rapidement avec votre numéro de commande. Le paiement est effectué à la livraison, selon le montant confirmé par notre équipe.</p><h2>Retours et échanges</h2><p>Si une pièce ne vous convient pas, contactez-nous avant tout renvoi. La pièce doit être non portée, non lavée, munie de ses étiquettes et retournée dans son état d’origine. Les modalités d’échange ou de remboursement dépendent de la disponibilité, de la nature de la pièce et de la zone de livraison.</p><p className="border-l-2 border-[var(--olive)] bg-white p-4 text-[var(--ink)]"><strong>Besoin d’aide ?</strong> Écrivez-nous à <a className="underline" href="mailto:contact@emmaashop.fr">contact@emmaashop.fr</a> en indiquant votre nom et votre numéro de commande.</p></InfoPage>;
}
