import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/layout/content-page';
import { PUBLISHER, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'À propos',
  description: `${SITE_NAME} réunit les prix des carburants et la disponibilité des bornes de recharge sur une seule carte, gratuitement.`,
  alternates: { canonical: `${SITE_URL}/a-propos` },
};

export default function AProposPage() {
  return (
    <ContentPage
      title={`À propos de ${SITE_NAME}`}
      intro="Faire le plein ou recharger au meilleur prix, sans installer d'application."
      updated="2026-09-25"
    >
      <section>
        <h2>Ce que fait {SITE_NAME}</h2>
        <p>
          {SITE_NAME} affiche sur une même carte les prix des carburants de toutes les stations-service de France et les
          bornes de recharge pour véhicules électriques, avec leur disponibilité en temps réel lorsque l&apos;opérateur la
          publie. Chaque station a sa fiche : prix du jour, historique, horaires, services, points de charge et itinéraire.
        </p>
      </section>
      <section>
        <h2>Gratuit et indépendant</h2>
        <p>
          Le service est gratuit, sans publicité et sans compte. Il n&apos;a aucun lien avec les enseignes ni avec les
          opérateurs de recharge, et ne met aucune station en avant contre rémunération.
        </p>
      </section>
      <section>
        <h2>D&apos;où viennent les données</h2>
        <p>
          Uniquement de sources publiques officielles, détaillées dans la <Link href="/methodologie">méthodologie</Link>.
        </p>
      </section>
      <section>
        <h2>Qui est derrière</h2>
        <p>
          {SITE_NAME} est un projet personnel de{' '}
          <a href={PUBLISHER.url} target="_blank" rel="noopener noreferrer">
            {PUBLISHER.name}
          </a>
          , développé en open source. Une erreur dans une fiche, une idée ?{' '}
          <a href={PUBLISHER.contactUrl} target="_blank" rel="noopener noreferrer">
            Ouvrez un ticket
          </a>
          .
        </p>
      </section>
    </ContentPage>
  );
}
