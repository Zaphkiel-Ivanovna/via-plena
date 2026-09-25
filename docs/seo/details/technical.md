# Audit SEO technique — ViaPlena (Next.js 16.3.6, App Router)

Date : 2026-09-24 · Périmètre : code local (non commité) + build de production local + prod (ancienne version)

## Méthodologie et limites

- **Conflit d'environnement** : `localhost:3000` est servi par deux processus (API bun en IPv4 et une autre app Next « Error Club » en `[::1]`). Le fetch SSR de Next résolvait `localhost` en IPv6, d'où des **404 parasites sur /station/*** à la première passe sur :3002. Ce n'est PAS un défaut du site.
- Pour les mesures fiables, le projet a été **copié dans le scratchpad** (`scratchpad/seo/copy`, sans `.env*`), buildé en **production** (`next build`) avec `NEXT_PUBLIC_API_URL=http://127.0.0.1:3000`, puis servi avec `next start -p 3017`. Aucun fichier du projet n'a été modifié. Les réponses HTTP brutes sont dans `scratchpad/seo/raw/p/`.
- L'API locale a ensuite été arrêtée par le coordinateur. **Impossible de revérifier après l'arrêt** : rendu des stations sur :3002, pagination réelle de `/poi/by-commune`, et le test des anciennes URL legacy contre la nouvelle API. Tout ce qui figure ci-dessous a été mesuré AVANT l'arrêt, ou vient du code source ou de la prod.

Sortie du build (qui détermine le mode de rendu) :
```
┌ ○ /                 (static, client-only)
├ ƒ /commune/[insee]  (dynamic, mais 'use client' → HTML vide)
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ƒ /station/[id]     (SSR, sans cache)
└ ○ /stats            (static, contenu client-only)
```

## Score technique : 52 / 100

| Catégorie | Statut | Note | Poids |
|---|---|---|---|
| 1. Crawlabilité (robots, sitemap, maillage) | FAIL | 25/100 | 20 % |
| 2. Indexabilité (canonicals, titres, soft 404) | FAIL | 40/100 | 20 % |
| 3. Sécurité (HTTPS, headers) | PASS partiel | 70/100 | 10 % |
| 4. Structure d'URL / redirections | PASS partiel | 60/100 | 10 % |
| 5. Mobile | PASS | 85/100 | 10 % |
| 6. Core Web Vitals (potentiel) | Needs improvement | 55/100 | 10 % |
| 7. Données structurées | PASS partiel | 70/100 | 10 % |
| 8. Rendu JS (SSR vs CSR) | FAIL (hors fiches station) | 45/100 | 10 % |

Point fort : les fiches `/station/[id]` sont désormais correctes. SSR complet, title/description uniques, canonical propre, JSON-LD GasStation/AutomotiveBusiness + BreadcrumbList, vrai 404 sur ID inconnu ou invalide. Tout le reste du site reste une SPA invisible pour les moteurs.

---

## CRITIQUE

### C1. Aucun chemin de crawl vers les ~46 700 fiches : accueil sans lien, sitemap réduit à l'accueil

**Preuve**
```
$ python3 ex.py _.html            # accueil, build prod
 a-internal: []                   # zéro <a href="/..."> dans le HTML serveur
 text words: 85
$ curl -s localhost:3017/sitemap.xml
<url><loc>https://via-plena.zaphkiel.dev</loc>...</url>   # 1 seule URL
$ curl -s 127.0.0.1:3000/api/v1/stats/coverage
{"totals":{"evStations":36784,"gasStations":9903,"poiPrices":105132,"communes":34875}...
```
Seuls chemins vers une fiche : la carte MapLibre (`ssr:false`), `StationCard` en `onClick` (`src/components/station/station-card.tsx:48` : `<div onClick={() => setSelectedPoi(poi.id)}>`, pas un `<a>`), `router.push` dans `search-command.tsx:56`, et le `<Link>` de `station-detail.tsx:239`, affiché seulement après une interaction. Googlebot ne clique pas et ne suit pas `router.push`.

**Impact** : les 46 687 fiches et 34 875 communes ne sont découvrables par aucun moyen (ni lien, ni sitemap). Même avec des fiches SSR parfaites, elles ne seront pas indexées, faute d'être découvertes.

**Correctif**
1. `src/app/sitemap.ts` : un index de sitemaps via `generateSitemaps` (limite 50 000 URL par fichier), avec un sitemap par département. L'API expose déjà `GET /api/v1/poi/by-department/{code}` (pagination par curseur `x-next-cursor`).
```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import { findPoisByDepartment } from '@/api/generated/poi/poi';
import { DEPARTMENTS } from '@/lib/departments'; // ['01',...,'2A','2B',...,'976']
const SITE_URL = 'https://via-plena.zaphkiel.dev';
export const revalidate = 86400;

export async function generateSitemaps() {
  return [{ id: 'static' }, ...DEPARTMENTS.map((d) => ({ id: `dep-${d}` }))];
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const key = await id;
  if (key === 'static') return [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/stats`, changeFrequency: 'daily', priority: 0.5 },
  ];
  const code = key.replace('dep-', '');
  const out: MetadataRoute.Sitemap = [];
  const communes = new Set<string>();
  let cursor: string | undefined;
  do {
    const res = await findPoisByDepartment(code, { limit: 500, cursor });
    for (const p of res.data as Poi[]) {
      out.push({ url: `${SITE_URL}/station/${p.id}`, lastModified: latestUpdate(p) });
      if (p.inseeCode) communes.add(p.inseeCode); // cf. H4 : champ à ajouter côté API
    }
    cursor = res.headers.get('x-next-cursor') ?? undefined;
  } while (cursor);
  for (const c of communes) out.push({ url: `${SITE_URL}/commune/${c}` });
  return out;
}
```
   `lastModified` doit venir de la donnée (`fuels[].lastUpdate`), pas de `new Date()` (voir M5). Côté robots, déclarer l'index (Next le sert sous `/sitemap/[id].xml` ; ajouter chaque sitemap ou un index dans `robots.ts`).
2. Des liens `<a>` réels dans le HTML serveur de l'accueil. Ajouter un bloc SSR sous la carte (hors du composant client), par exemple dans un `page.tsx` serveur qui enveloppe le client (voir C3) : « Prix des carburants par ville » (top 50 communes), « Par département », lien `/stats`.
3. `station-card.tsx` : envelopper la carte dans `<Link href={`/station/${poi.id}`}>` (en gardant l'ouverture du panneau via `onClick` + `e.preventDefault()` sur desktop si besoin). Cela ne sert que si la liste est SSR, mais c'est indispensable pour les pages commune (C2).

### C2. `/commune/[insee]` : page entièrement cliente, title/canonical de l'accueil, soft 404 pour toute valeur

**Preuve** (build prod, API active)
```
$ curl -s -o /dev/null -w '%{http_code}' localhost:3017/commune/75056   → 200
 title: ['ViaPlena - Trouvez les meilleurs prix de carburant']   (title de l'accueil)
 canonical: ['https://via-plena.zaphkiel.dev']                    (canonical → accueil)
 robots: index, follow
 h1: []   text words: 15 | "Retour à la carte Command Palette Search for a command to run..."
$ curl ... /commune/99999 → 200   /commune/abc → 200     (même HTML, indexable)
$ curl 127.0.0.1:3000/api/v1/communes/99999 → 404 ; /communes/abc → 404
```
Source : `src/app/commune/[insee]/page.tsx` a `'use client'` en ligne 1, pas de `generateMetadata`, et hérite de `alternates.canonical: SITE_URL` de `src/app/layout.tsx`.

**Impact** : les 34 875 pages commune, qui ont le plus de potentiel (« prix essence Paris », « borne recharge Lyon »), sont vides sans JS, dupliquent le title de l'accueil et déclarent l'accueil comme canonical. Google les regroupera avec l'accueil ou les ignorera. Toute URL `/commune/*` renvoie 200 : c'est un soft 404 illimité.

**Correctif** : passer la page en Server Component et isoler le chargement infini dans un composant client.
```tsx
// src/app/commune/[insee]/page.tsx  (serveur, sans 'use client')
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCommuneByInsee } from '@/api/generated/communes/communes';
import { findPoisByCommune } from '@/api/generated/poi/poi';
import { CommuneStationList } from '@/components/commune/commune-station-list'; // 'use client', infinite
export const revalidate = 900;

const load = cache(async (insee: string) => {
  try {
    const [c, p] = await Promise.all([getCommuneByInsee(insee), findPoisByCommune(insee, { limit: 100 })]);
    return { commune: c.data, pois: p.data as Poi[], cursor: p.headers.get('x-next-cursor') };
  } catch (e) { if (e instanceof ApiError && e.status < 500) return null; throw e; }
});

export async function generateMetadata({ params }): Promise<Metadata> {
  const { insee } = await params;
  const d = await load(insee);
  if (!d) return { title: 'Commune introuvable', robots: { index: false } };
  const title = `Prix carburants et bornes de recharge à ${d.commune.name} (${d.commune.postalCode})`;
  return {
    title,
    description: `Comparez les prix du gazole, SP95, SP98, E10 dans les ${d.pois.length} stations et bornes de ${d.commune.name}...`,
    alternates: { canonical: `/commune/${insee}` },
    openGraph: { url: `/commune/${insee}`, title },
  };
}

export default async function CommunePage({ params }) {
  const { insee } = await params;
  const d = await load(insee);
  if (!d) notFound();
  return (<>
    <h1>Prix des carburants à {d.commune.name}</h1>
    {/* liste SSR avec <Link href={`/station/${p.id}`}> pour chaque POI */}
    <CommuneStationList insee={insee} initial={d.pois} initialCursor={d.cursor} />
    {/* JSON-LD ItemList + BreadcrumbList (Accueil > Département > Commune) */}
  </>);
}
```

### C3. Canonical global dans le layout : toute page sans override pointe vers l'accueil

**Preuve** : `src/app/layout.tsx` contient `alternates: { canonical: SITE_URL }`. Résultats mesurés : `/stats` → canonical `https://via-plena.zaphkiel.dev`, `/commune/*` → idem, pages 404 → idem.

**Impact** : c'est la cause directe du problème de canonical sur `/stats` et `/commune/*`, et un piège pour toute future page (département, marque, carburant…).

**Correctif** : dans `src/app/layout.tsx`, supprimer `alternates.canonical` et `openGraph.url` du layout. Les déclarer dans `src/app/page.tsx`, ce qui impose que l'accueil ait un `page.tsx` serveur. Renommer le `page.tsx` client actuel en `src/components/home/home-client.tsx` :
```tsx
// src/app/page.tsx (serveur)
import type { Metadata } from 'next';
import { HomeClient } from '@/components/home/home-client';
export const metadata: Metadata = { alternates: { canonical: '/' }, openGraph: { url: '/' } };
export default function Page() { return (<><HomeClient /><HomeSeoLinks /></>); }
```
Même traitement pour `/stats` (`src/app/stats/page.tsx` serveur avec `metadata` + `alternates: { canonical: '/stats' }` ; la partie client dans un composant séparé, idéalement pré-remplie côté serveur avec `revalidate = 3600`, puisque `/api/v1/stats/coverage` ne change que quotidiennement).

---

## HAUTE

### H1. `/stats` : title de l'accueil, contenu absent du HTML

**Preuve** (`stats2.html`, build prod)
```
 title: ['ViaPlena - Trouvez les meilleurs prix de carburant']
 canonical: ['https://via-plena.zaphkiel.dev']
 h1: ['Couverture']   text words: 16   (skeletons uniquement)
```
**Impact** : page dupliquée de l'accueil (title, description, canonical) sans contenu. Le H1 « Couverture » ne se positionne sur rien.
**Correctif** : voir C3. En plus, `title: 'Statistiques : stations-service et bornes de recharge en France'`, données rendues côté serveur et JSON-LD `Dataset` si l'on veut viser les requêtes « nombre de bornes de recharge en France ».

### H2. Les fiches station essence sont des culs-de-sac (aucun lien interne sortant)

**Preuve**
```
_station_a039d174...html (essence)  a-internal: ['/']
_station_983de0e0...html (borne)    a-internal: ['/', '/commune/75104']
```
`station-page-view.tsx:49` : `const commune = isEv(poi) && poi.data.inseeCode ? ... : null`. Les POI essence n'ont pas d'`inseeCode` : la réponse API `data` contient `brand, populationType, departmentCode, regionCode, services, fuels, ...` et aucun champ INSEE. Le fil d'Ariane affiche donc « Paris » en texte brut.
**Impact** : aucun PageRank ne circule entre fiches. Pas de maillage géographique : 9 903 pages essence isolées.
**Correctif**
- Backend : exposer `inseeCode` sur les `gas_station` (géocodage inverse via la table `fr_communes`, déjà présente d'après `/health/ready`). Ensuite, dans `station-page-view.tsx`, `const insee = poi.inseeCode ?? poi.data.inseeCode`, et le JSON-LD BreadcrumbList utilise la même source.
- Ajouter une section SSR « Stations à proximité » : dans `station/[id]/page.tsx`, appel serveur `findPoisNearby({ lat, lng, radius: 3000, limit: 10, type: poi.type })`, rendu en `<Link>` avec nom + prix. Ce bloc apporte à la fois du maillage et du contenu unique.
- Liens vers le département : `/departement/75`, une page à créer à partir de `/poi/by-department/{code}` et de `/prices/department/{code}`.

### H3. Lien de fil d'Ariane EV cassé : `/commune/75104` → commune inexistante (soft 404)

**Preuve**
```
$ curl 127.0.0.1:3000/api/v1/communes/75104        → 404
$ curl 127.0.0.1:3000/api/v1/poi/by-commune/75104  → [ {"id":"983de0e0-...","name":"Bump - SAGS – Paris – Lobau" ...} ]
$ curl 127.0.0.1:3000/api/v1/communes/75056        → 200
```
La borne porte le code INSEE d'arrondissement (751xx), alors que le référentiel communes ne connaît que 75056. Le même cas existe pour Lyon (6938x vs 69123) et Marseille (132xx vs 13055). Par ailleurs, `by-commune/99999` renvoie des bornes de Saint-Brieuc : il y a des `inseeCode` invalides dans le jeu IRVE.
**Impact** : le fil d'Ariane (HTML + JSON-LD BreadcrumbList) pointe vers une page qui, une fois rendue côté serveur, devra renvoyer 404. Des milliers de liens internes cassés à Paris, Lyon et Marseille.
**Correctif** : côté backend, normaliser les codes d'arrondissement vers la commune parente (751xx→75056, 6938x→69123, 132xx→13055), ou ajouter les arrondissements dans `fr_communes` avec un `parentInsee`. Valider `inseeCode` contre `fr_communes` à l'ingestion (99999 → null). Côté front, n'afficher le lien que si la commune existe, ou pointer vers le parent.

### H4. Titles dupliqués en masse sur les fiches essence (enseigne + ville)

**Preuve** : template `${name}${brand} : prix des carburants à ${poi.city}`. Échantillon API de 53 stations essence du 75 : `('Total / Paris', 8), ('Avia / Paris', 7), ('TotalEnergies / Paris', 7), ('Esso / Paris', 3)`. On obtient 8 pages intitulées « Total : prix des carburants à Paris | ViaPlena ». Le H1 vaut simplement « Total ».
**Impact** : titles et H1 non différenciants, risque de regroupement comme doublons ou de réécriture des titles par Google. Le même problème touche toutes les villes (Leclerc, Intermarché…).
**Correctif** (`src/app/station/[id]/page.tsx`, `generateMetadata`) : inclure la rue, et pour Paris/Lyon/Marseille, l'arrondissement ou le code postal :
```ts
const street = poi.address ? toTitleCase(poi.address) : '';
title = `${name}${brand} ${street}, ${poi.postalCode} ${poi.city} : prix carburants`;
// ex. "Total 114 Bd de l'Hôpital, 75013 Paris : prix carburants"
```
Faire de même pour le H1 dans `station-page-view.tsx` (par exemple `Total — 114 bd de l'Hôpital`). Normaliser la casse des adresses essence (« 114 BD DE L HOPITAL »), qui apparaissent en majuscules dans le title, la description et le JSON-LD.

### H5. Migration des URL : les anciennes URL `/station/{id numérique}` vont casser sans redirection

**Preuve** : la version en prod (`git show HEAD:src/app/station/[id]/page.tsx`) utilisait `fetchStationById(Number(id))` sur `api.prix-carburants.2aaz.fr`, donc des ID numériques issus de prix-carburants.gouv. La nouvelle version attend un UUID, et tout 4xx de l'API produit `notFound()`.
**Impact** : toute URL déjà indexée ou partagée (`/station/75013001`) renverra 404 après le déploiement. Perte des signaux acquis. Non testable localement après l'arrêt de l'API.
**Correctif** : côté API, conserver l'identifiant source (`sourceId` = ID prix-carburants) et exposer `GET /api/v1/poi/by-source/{sourceId}`. Côté front, dans `station/[id]/page.tsx` :
```ts
if (/^\d+$/.test(id)) {
  const uuid = await resolveLegacyId(id);        // null si inconnu
  if (uuid) permanentRedirect(`/station/${uuid}`); // 308
  notFound();
}
```
Vérifier dans Google Search Console (Pages indexées) le volume réel d'anciennes URL.

### H6. Fiches station non mises en cache : SSR + appel API à chaque requête

**Preuve**
```
/station/a039d174...  Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
build : ƒ /station/[id]  (Dynamic)
```
`src/api/fetcher.ts` appelle `fetch()` sans option `next`, et la page n'exporte pas `revalidate`.
**Impact** : le TTFB dépend de l'API pour chaque hit Googlebot. Crawler 46 000 fiches génère 46 000 requêtes API, avec risque de 5xx sous charge ; or un 5xx fait throw (page 500), ce qui réduit le budget de crawl. L'LCP est dégradé.
**Correctif** : ISR court, cohérent avec la fraîcheur des prix (quelques minutes).
```ts
// src/app/station/[id]/page.tsx
export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() { return []; } // ISR à la demande
```
Et dans `fetcher.ts`, permettre `init.next = { revalidate: 300 }` pour les appels serveur. Les données temps réel (disponibilité EV) restent chargées côté client (`useLiveCharging`, déjà en place).

---

## MOYENNE

### M1. robots.txt : les groupes IA annulent le `Disallow: /api/`, bots de recherche IA absents

**Preuve**
```
User-Agent: *            Allow: /   Disallow: /api/
User-Agent: GPTBot       Allow: /
User-Agent: ClaudeBot    Allow: /
User-Agent: PerplexityBot Allow: /
```
Un bot n'applique que le groupe le plus spécifique : GPTBot, ClaudeBot et PerplexityBot n'héritent donc PAS du `Disallow: /api/`. En pratique, `/api/` n'existe pas sur ce domaine (l'API est un service séparé), la ligne est donc sans effet, mais l'intention est mal traduite. Manquent : `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `Perplexity-User`, `Google-Extended`, `Applebot-Extended`, `CCBot`. Pas de `/llms.txt` (404 en prod).
**Correctif** (`src/app/robots.ts`) :
```ts
const AI_SEARCH = ['OAI-SearchBot','ChatGPT-User','Claude-SearchBot','Claude-User','PerplexityBot','Perplexity-User'];
const AI_TRAINING = ['GPTBot','ClaudeBot','Google-Extended','Applebot-Extended','CCBot']; // décision business
rules: [
  { userAgent: '*', allow: '/', disallow: ['/api/', '/*?station='] },
  { userAgent: AI_SEARCH, allow: '/', disallow: ['/api/'] },
  { userAgent: AI_TRAINING, allow: '/', disallow: ['/api/'] }, // ou disallow: '/' pour refuser l'entraînement
],
sitemap: [`${SITE_URL}/sitemap.xml`], // + sitemaps départementaux si generateSitemaps
```
Remarque : `disallow '/*?station='` ne doit être ajouté QUE si la redirection de M3 n'est pas mise en place. Sinon, laisser crawler pour que la redirection 308 soit suivie.

### M2. og:image absent des fiches station (écrasement du bloc openGraph)

**Preuve** : l'accueil a `og:image https://via-plena.zaphkiel.dev/logo_dark.png` ; les fiches station ont `og:title` et `og:url` mais **aucun `og:image` ni `twitter:image`**. Le `openGraph` de `generateMetadata` remplace entièrement celui du layout (pas de fusion profonde dans Next).
**Impact** : partages sociaux et aperçus de messageries sans visuel ; perte de CTR sur les partages (la fonction « Partager » est mise en avant).
**Correctif** : créer `src/app/station/[id]/opengraph-image.tsx` (`ImageResponse` avec nom, adresse et prix principaux) : généré automatiquement et injecté par Next. À défaut, ajouter `images: ['/logo_dark.png']` dans `openGraph` et `twitter`. Passer `twitter.card` en `summary_large_image`.

### M3. Paramètre `?station=` : duplication client-only

**Preuve** : `/?station=a039d174-...` → 200, HTML identique à l'accueil, canonical `https://via-plena.zaphkiel.dev` (correct). `src/app/page.tsx` lit le paramètre dans un `useEffect` et le réécrit via `history.replaceState`.
**Impact** : faible grâce au canonical, mais les liens partagés depuis la vue carte (copie de la barre d'adresse) diluent les signaux vers l'accueil au lieu de la fiche.
**Correctif** : redirection serveur dans `src/proxy.ts` (le middleware en Next 16) :
```ts
import { NextResponse, type NextRequest } from 'next/server';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function proxy(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('station');
  if (req.nextUrl.pathname === '/' && id && UUID.test(id) && !req.headers.get('rsc'))
    return NextResponse.redirect(new URL(`/station/${id}`, req.url), 308);
}
export const config = { matcher: '/' };
```
(Si l'on préfère garder l'ouverture de la carte pour les humains, ne rediriger que les bots, mais le cloaking léger est déconseillé. Mieux : conserver le canonical actuel et utiliser `/station/{id}` pour le bouton Partager, ce que fait déjà `sharePoi`.)

### M4. Structure d'URL : UUID opaques

**Preuve** : `/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48`, `/commune/75056`.
**Impact** : aucun mot-clé dans l'URL, CTR plus faible dans les SERP, URL non mémorisables. C'est un signal mineur mais réel pour le local (« total-paris-13 »).
**Correctif** : `/station/{slug}-{uuid}` ou `/station/{ville}/{slug}--{shortId}`, par exemple `/station/total-114-bd-de-l-hopital-paris-13--a039d174`. Dans `page.tsx`, extraire l'ID en fin de segment ; si le slug ne correspond pas, `permanentRedirect()` vers l'URL canonique. Garder `/station/{uuid}` en 308 vers la version slug. Communes : `/commune/paris-75056` (avec redirection depuis `/commune/75056`). À faire AVANT d'alimenter le sitemap (C1), pour ne pas migrer deux fois.

### M5. `lastmod` du sitemap = date du build

**Preuve** : `<lastmod>2026-09-24T21:32:14.775Z</lastmod>` = `new Date()` dans `sitemap.ts`, route statique (`○ /sitemap.xml`), `cache-control: public, max-age=0, must-revalidate`.
**Impact** : lastmod non fiable, que Google apprend à ignorer. Avec `new Date()`, chaque déploiement « modifie » tout.
**Correctif** : `lastModified` = max(`fuels[].lastUpdate`) par station ; `export const revalidate = 3600` dans `sitemap.ts`. Retirer `changeFrequency` et `priority` (ignorés par Google).

### M6. Core Web Vitals : JS lourd sur les fiches station (INP/LCP)

**Preuve** (build prod, somme des scripts `<script src>` gzippés)
```
/                 361 KB gz
/station/[id]     667 KB gz   ← maplibre-gl (chunk 1 054 128 o brut) + recharts importés statiquement
/stats            247 KB gz
```
`src/components/station/station-map.tsx` importe `maplibre-gl` et sa CSS en statique, et `price-history-chart.tsx` importe recharts, tous deux inclus dans `StationPageView`.
**Impact** : 667 KB gz à parser et hydrater sur mobile milieu de gamme, soit un risque d'INP > 200 ms et de TBT élevé. L'LCP (le H1) est SSR, donc il n'est pas bloqué, mais l'hydratation retarde l'interactivité.
**Correctif** (`station-page-view.tsx`) :
```ts
const StationMap = dynamic(() => import('./station-map').then(m => m.StationMap), { ssr: false, loading: () => <Skeleton className="h-64 rounded-3xl" /> });
const PriceHistoryChart = dynamic(() => import('./price-history-chart').then(m => m.PriceHistoryChart), { ssr: false });
```
Donner une hauteur fixe aux conteneurs (réserver l'espace, CLS < 0.1). Idéalement, charger la carte seulement quand elle devient visible (IntersectionObserver). Le HTML de la fiche borne pèse 203 KB, car les 233 points de charge sont sérialisés dans le payload RSC : ne passer au composant client que les champs utiles.

### M7. Headers de sécurité incomplets

**Preuve** (local + prod)
```
présents : X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy
prod     : strict-transport-security: max-age=63072000   (défaut Vercel, sans includeSubDomains/preload)
absents  : Content-Security-Policy ; X-Powered-By: Next.js exposé (local)
```
HTTPS OK : `http://` → 308 vers `https://`. `www.` n'est pas résolu (pas de variante dupliquée, OK).
**Correctif** (`next.config.ts`) :
```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...
};
securityHeaders.push(
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data: blob: https:; connect-src 'self' https://<api-host> https://*.maptiler.com https://va.vercel-scripts.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'" },
);
```
(Adapter `connect-src` au fournisseur de tuiles de `getThemeUrl` et au domaine de l'API. Commencer en `Content-Security-Policy-Report-Only`.)

---

## BASSE

### B1. Page 404 des stations : HTML d'erreur sans `lang` ni contenu SSR
`/station/00000000-...` et `/station/not-a-uuid` → **404 correct**, `noindex` présent, mais `<html id="__next_error__">` (sans `lang="fr"`) et un body vide : l'UI `not-found.tsx` n'est rendue qu'après hydratation. Le statut est bon, c'est donc sans enjeu SEO réel. En revanche `/nimporte` → 404 avec le HTML complet. Piste : laisser `generateMetadata` retourner vite, ou ajouter `src/app/station/[id]/not-found.tsx`.

### B2. Balises robots dupliquées et canonical vers l'accueil sur les 404
Les 404 contiennent `<meta name="robots" content="noindex">` (injecté par Next) ET `noindex, nofollow` (not-found.tsx), plus `canonical → accueil` hérité du layout. Signaux contradictoires (canonical sur une page noindex). Disparaît avec C3.

### B3. Texte anglais dans le HTML serveur
Toutes les pages contiennent `<h2>Command Palette</h2>` et « Search for a command to run... » (dialogue cmdk de `search-command.tsx`, rendu en sr-only). C'est un H2 anglais parasite sur un site `lang="fr"`. Correctif : passer `title="Rechercher"` / `description="Rechercher une ville ou une station"` à `CommandDialog`, ou monter le dialogue seulement à l'ouverture.

### B4. JSON-LD : détails
- EV : `streetAddress: "4 Rue de Lobau 75004 Paris"` duplique le code postal et la ville (source IRVE) ; à nettoyer.
- `image` = logo du site pour chaque station (acceptable, mais une image par station / l'OG dynamique serait mieux).
- `makesOffer[].itemOffered.name` en anglais (« Diesel ») via `FUEL_NAMES` : préférer « Gazole ».
- Pas de `priceRange` ni de `telephone` sur GasStation ; `openingHours` seulement quand l'établissement est ouvert 24/24 (ajouter `openingHoursSpecification` pour les horaires réels via `parseGasSchedule`).
- Accueil : `WebSite` sans `potentialAction` SearchAction (inutile depuis la fin de la sitelinks searchbox, OK). `Organization.logo` → `/logo.png` existe (OK).

### B5. Manifest
`/manifest.json` 200, `lang: fr`, `display: standalone`. `purpose: "any maskable"` sur une seule icône (déconseillé : séparer `any` et `maskable`) ; pas d'icônes 192/512 (requises pour l'installabilité Chrome). `theme_color` fixé en sombre alors que le viewport déclare clair/sombre. Pas d'impact sur le classement.

### B6. `keywords` meta et `category`
`<meta name="keywords">` est ignoré par Google (sans impact, mais inutile) ; `category: technology` est hors sujet (plutôt `travel`/`automotive`).

### B7. Pagination commune : bouton « load more » client
Une fois C2 en place : rendre les 100 premiers POI côté serveur, et exposer les suivants via `?page=2` en `<a href>` (ou tout rendre si ≤ 300), avec un canonical auto-référent par page.

---

## Points conformes (vérifiés)

- `lang="fr"` sur `<html>` ; `og:locale fr_FR`. Site monolingue : pas de hreflang nécessaire (aucun `<link rel="alternate">`, ce qui est correct). Si une version EN est prévue (le README.en existe), déléguer la validation à `seo-hreflang`.
- Viewport : `width=device-width, initial-scale=1, maximum-scale=5` (le zoom n'est pas bloqué).
- Trailing slash : `/stats/` et `/station/{id}/` → **308** vers la version sans slash. Casse : `/STATS` → 404 (pas de doublon).
- `/index.html` → 404. `http` → `https` en 308 (prod). Pas de `www`.
- Fiches station : SSR complet (texte, prix, horaires présents sans JS : 125 mots pour l'essence, 195 pour la borne), un seul appel API partagé via `cache()`, title/description uniques, canonical auto-référent absolu, `robots index,follow`, JSON-LD escapé (`<` → `<`), 404 réels pour ID inconnu ou invalide ; les erreurs 5xx remontent en 500 (pas de faux 404).
- Fonts Geist en `next/font` (auto-hébergées, preload woff2, pas de FOIT externe).
- Accueil : `<h1>` présent (sr-only).

## Plan d'action priorisé

1. C3 + C2 + H1 : pages serveur avec metadata/canonical propres pour l'accueil, `/commune`, `/stats` ; retrait du canonical du layout.
2. M4 (décider du format d'URL à slug) puis C1 (index de sitemaps par département + liens SSR depuis l'accueil).
3. H3 + H2 (backend : `inseeCode` pour les stations essence, normalisation des arrondissements) + section « stations à proximité ».
4. H4 (titles différenciés), H5 (redirections legacy), H6 (ISR 300 s).
5. M1, M2, M5, M6, M7, puis les points Basse.
