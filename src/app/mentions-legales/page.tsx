import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { DATA_SOURCES, HOST, PUBLISHER, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Éditeur, hébergeur, sources des données et conditions d'utilisation de ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/mentions-legales` },
};

export default function MentionsLegalesPage() {
  return (
    <ContentPage title="Mentions légales" updated="2026-09-25">
      <section>
        <h2>Éditeur</h2>
        <p>
          {SITE_NAME} ({SITE_URL}) est un service gratuit édité à titre non professionnel par {PUBLISHER.name}. Pour toute
          question ou demande, écrivez via{' '}
          <a href={PUBLISHER.contactUrl} target="_blank" rel="noopener noreferrer">
            le suivi du projet sur GitHub
          </a>
          .
        </p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          {HOST.name}, {HOST.address} (
          <a href={HOST.url} target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
          ).
        </p>
      </section>
      <section>
        <h2>Données</h2>
        <p>
          Les prix des carburants proviennent de{' '}
          <a href={DATA_SOURCES.fuel.url} target="_blank" rel="noopener noreferrer">
            {DATA_SOURCES.fuel.name}
          </a>{' '}
          et les bornes de recharge du{' '}
          <a href={DATA_SOURCES.irve.url} target="_blank" rel="noopener noreferrer">
            {DATA_SOURCES.irve.name}
          </a>
          , publiés sous Licence Ouverte (Etalab). Les prix sont déclarés par les stations et la disponibilité des bornes par
          leurs opérateurs : {SITE_NAME} les affiche tels quels et ne peut garantir leur exactitude. Vérifiez le prix affiché
          à la pompe avant de payer.
        </p>
      </section>
      <section>
        <h2>Propriété et code source</h2>
        <p>
          Le code de {SITE_NAME} est publié sous licence MIT. Les marques et logos des enseignes et opérateurs appartiennent
          à leurs propriétaires respectifs ; {SITE_NAME} n&apos;a aucun lien commercial avec eux.
        </p>
      </section>
    </ContentPage>
  );
}
