export const SITE_URL = 'https://via-plena.zaphkiel.dev'
export const SITE_NAME = 'ViaPlena'

export const SITE_TAGLINE = 'Prix carburant & bornes de recharge en temps réel'
export const SITE_DESCRIPTION =
  'Comparez les prix des carburants de près de 10 000 stations et trouvez une borne de recharge libre près de vous. Données officielles, historique des prix, gratuit.'

export const PUBLISHER = {
  name: 'Zaphkiel',
  url: 'https://github.com/Zaphkiel-Ivanovna',
  contactUrl: 'https://github.com/Zaphkiel-Ivanovna/via-plena/issues',
}

export const HOST = {
  name: 'Vercel Inc.',
  address: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis',
  url: 'https://vercel.com',
}

export const DATA_SOURCES = {
  fuel: { name: 'prix-carburants.gouv.fr', url: 'https://www.prix-carburants.gouv.fr/' },
  irve: {
    name: 'Fichier consolidé des bornes de recharge (IRVE), data.gouv.fr',
    url: 'https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/',
  },
  irveDynamic: {
    name: 'IRVE dynamique (disponibilité en temps réel), data.gouv.fr',
    url: 'https://www.data.gouv.fr/fr/datasets/?q=irve%20dynamique',
  },
}

export const absoluteUrl = (path: string): string => new URL(path, SITE_URL).toString()
