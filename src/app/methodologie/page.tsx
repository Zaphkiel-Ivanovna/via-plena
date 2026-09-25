import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/layout/content-page';
import { DATA_SOURCES, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Méthodologie et sources',
  description: `D'où viennent les prix des carburants et la disponibilité des bornes sur ${SITE_NAME}, à quelle fréquence ils sont mis à jour et comment lire les avertissements.`,
  alternates: { canonical: `${SITE_URL}/methodologie` },
};

export default function MethodologiePage() {
  return (
    <ContentPage
      title="Méthodologie et sources"
      intro="Comment les données sont collectées, mises à jour et affichées."
      updated="2026-09-25"
    >
      <section>
        <h2>Prix des carburants</h2>
        <p>
          Les prix viennent du flux officiel{' '}
          <a href={DATA_SOURCES.fuel.url} target="_blank" rel="noopener noreferrer">
            {DATA_SOURCES.fuel.name}
          </a>
          , alimenté par les stations elles-mêmes, qui ont l&apos;obligation de déclarer leurs prix. {SITE_NAME} le relit
          toutes les 6 heures et conserve chaque prix relevé pour construire l&apos;historique par station. Les ruptures de
          stock déclarées sont reprises telles quelles.
        </p>
        <p>
          Chaque prix est affiché avec sa date de mise à jour. Au-delà de 7 jours sans mise à jour, la fiche avertit que
          le prix a pu changer.
        </p>
      </section>
      <section>
        <h2>Bornes de recharge</h2>
        <p>
          La liste des bornes, leur puissance, leurs prises et leurs moyens de paiement viennent du{' '}
          <a href={DATA_SOURCES.irve.url} target="_blank" rel="noopener noreferrer">
            {DATA_SOURCES.irve.name}
          </a>
          , relu chaque nuit.
        </p>
        <p>
          La disponibilité (libre, occupée, hors service) vient du flux IRVE dynamique transmis par les opérateurs, relu
          toutes les 2 minutes. Tous les opérateurs ne le publient pas ; certains n&apos;envoient que les changements
          d&apos;état. Quand le dernier signal d&apos;une borne date de plus de 24 heures, la fiche indique que
          l&apos;information n&apos;est pas vérifiée.
        </p>
      </section>
      <section>
        <h2>Moyennes et comparaisons</h2>
        <p>
          Les prix moyens (France, commune, stations voisines) sont calculés sur le dernier prix publié par chaque station
          qui vend le carburant concerné. Les comparaisons de voisinage portent sur les stations situées dans un rayon de
          3 km.{' '}
          <Link href="/stats">Voir les statistiques nationales</Link>.
        </p>
      </section>
      <section>
        <h2>Limites</h2>
        <p>
          Les données sont publiées par des tiers : une station peut tarder à mettre à jour son prix, une borne peut être
          indiquée libre alors qu&apos;elle vient d&apos;être prise. En cas d&apos;écart, le prix affiché à la pompe fait
          foi.
        </p>
      </section>
    </ContentPage>
  );
}
