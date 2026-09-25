import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { PUBLISHER, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Confidentialité',
  description: `Quelles données ${SITE_NAME} utilise (position, préférences, mesure d'audience) et quels services tiers reçoivent une requête.`,
  alternates: { canonical: `${SITE_URL}/confidentialite` },
};

export default function ConfidentialitePage() {
  return (
    <ContentPage
      title="Confidentialité"
      intro={`${SITE_NAME} ne demande ni compte, ni adresse e-mail, et ne dépose pas de cookie publicitaire.`}
      updated="2026-09-25"
    >
      <section>
        <h2>Votre position</h2>
        <p>
          Si vous l&apos;autorisez, votre navigateur fournit votre position pour centrer la carte et trouver les stations
          autour de vous. Les coordonnées sont envoyées au serveur de {SITE_NAME} pour cette recherche, et au service
          d&apos;itinéraire OSRM (router.project-osrm.org) pour tracer la route vers une station. Elles ne sont pas
          associées à votre identité. Vous pouvez refuser la géolocalisation : la carte s&apos;ouvre alors sur Paris.
        </p>
      </section>
      <section>
        <h2>Vos préférences</h2>
        <p>
          Le thème de carte et la taille des marqueurs sont enregistrés dans le stockage local de votre navigateur
          (localStorage). Ils ne quittent pas votre appareil ; vider les données du site les efface.
        </p>
      </section>
      <section>
        <h2>Mesure d&apos;audience</h2>
        <p>
          {SITE_NAME} utilise Vercel Web Analytics, qui compte les pages vues de façon agrégée, sans cookie et sans
          identifiant personnel persistant.
        </p>
      </section>
      <section>
        <h2>Services tiers</h2>
        <p>Pour fonctionner, votre navigateur contacte aussi :</p>
        <ul>
          <li>CARTO, OpenFreeMap et maps.black, pour les fonds de carte ;</li>
          <li>l&apos;API Adresse de data.gouv.fr, pour la recherche d&apos;adresse ;</li>
          <li>OSRM, pour le calcul d&apos;itinéraire ;</li>
          <li>Vercel, qui héberge le site.</li>
        </ul>
        <p>Comme tout serveur web, ces services reçoivent votre adresse IP au moment de la requête.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Pour toute question sur vos données, écrivez via{' '}
          <a href={PUBLISHER.contactUrl} target="_blank" rel="noopener noreferrer">
            le suivi du projet sur GitHub
          </a>
          .
        </p>
      </section>
    </ContentPage>
  );
}
