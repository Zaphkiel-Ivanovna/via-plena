# Audit performance / Core Web Vitals — ViaPlena

Date : 2026-09-24. Build locale Next.js 16.3.6 (Turbopack), `next start -p 3055`, API bun `http://127.0.0.1:3000`.

## Score global estimé : 68 / 100

| Page | Score lab estimé (mobile) | LCP | INP (proxy TBT) | CLS | Verdict |
|---|---|---|---|---|---|
| `/` (carte) | ~65 | Bon (texte de fallback), carte utile à ~5-6 s | À risque | Bon | Carte perçue lente, trop de JS et de JSON |
| `/station/[id]` | ~85 | Bon (SSR) | Correct | Bon | Rendu HTML bon, mais 900 Ko de JS compressé à parser |
| `/commune/[insee]` | ~50 | **Mauvais (4,9 à 7,0 s)** | Bon | Correct (0,044) | Rendu 100 % client + animation BlurFade |

## 1. Ce qui n'a pas pu être mesuré

- **PageSpeed Insights API** (mobile et desktop, prod) : HTTP 429, quota journalier anonyme épuisé. Pas de score Lighthouse officiel.
- **CrUX (données terrain)** : pas de clé API disponible, donc non interrogé. Le site est probablement trop peu visité pour avoir des données CrUX. À vérifier sur https://cruxvis.withgoogle.com.
- **Fiches station** : la première série de mesures renvoyait 404, parce que `localhost` pointait vers `[::1]:3000` (un autre process Node) au lieu de l'API bun en IPv4. J'ai refait la build et la série avec `NEXT_PUBLIC_API_URL=http://127.0.0.1:3000` : ces chiffres-là sont valides. Ensuite l'API a été arrêtée pendant l'audit (arrêt extérieur à mon serveur 3055). La 3e série (« warm GPU ») n'a donc de valeur que pour `/` sans données POI. J'ai écarté les pages en 500.
- **Vercel Analytics** : n'est injecté qu'en prod, donc impossible à mesurer en local. Son coût est négligeable (~1-2 Ko, chargé en différé).
- Prod : j'ai seulement pris des mesures curl (TTFB 113 à 187 ms, `x-vercel-cache: HIT`, HTML 13 Ko en brotli). La prod est une ancienne version (`/maplibre/maplibre-gl-worker.mjs` y renvoie 404).

## 2. Mesures lab (Playwright + Chromium headless, swiftshader WebGL)

Profil mobile : 412×823 DPR2, latence 150 ms, 1,6 Mbit/s, CPU ×4. Profil desktop : 1350×940 sans throttling. Métriques relevées via PerformanceObserver (LCP, layout-shift, longtask). TBT = somme des (tâche longue - 50 ms) après le FCP.

| Page | Profil | TTFB | FCP | LCP | CLS | TBT | DOM | JS transféré / décodé |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 3 ms | 2 888* | 2 980* | 0,013 | 1 296 | 363 | 776 Ko / 2,65 Mo (+148 Ko worker) |
| `/` | desktop | 7 | 2 728* | 2 728* | 0,002 | 2 073* | 443 | idem |
| `/` (GPU chaud) | desktop | – | 124 | 124 | 0,002 | 371 | – | idem |
| `/station/a039d174…` (gaz) | mobile | 12 | 1 248 | 1 248 | 0 | 145 | 267 | **898 Ko / 3,06 Mo** |
| `/station/a039d174…` | desktop | 12 | 416 | 472 | 0 | 0 | 267 | idem |
| `/station/983de0e0…` (IRVE) | mobile | 18 | 1 132 | 1 132 | 0 | 154 | 278 | 898 Ko / 3,06 Mo |
| `/station/983de0e0…` | desktop | 17 | 156 | 156 | 0 | 132 | 277 | idem |
| `/commune/75056` | mobile | 5 | 944 | **4 920** | **0,044** | 49 | **2 768** | 349 Ko / 1,08 Mo |
| `/commune/75056` | desktop | 13 | 56 | 1 632 | 0,015 | 0 | 2 768 | idem |

\* Les valeurs marquées d'un astérisque sont gonflées par un artefact : au premier `getContext('webgl2')`, Chromium initialise le GPU swiftshader, ce qui bloque le thread principal ~2,2 à 2,7 s. Avec le GPU chaud, le FCP de `/` passe à 124 ms (desktop). Sans JS, la page est peinte en 48 ms. Sur un vrai GPU, cette initialisation coûte ~50 à 150 ms.

Élément LCP :
- `/` : le texte « Chargement de la carte… ». Le canvas de la carte n'est pas éligible au LCP. Le LCP est donc « bon » alors que la carte réelle n'apparaît qu'à ~5-6 s en 4G lente.
- `/station` : `h1` ou adresse, rendus côté serveur (bien).
- `/commune` : `SPAN.truncate` d'une `StationCard`, qui n'est peinte qu'après hydratation, puis 2 appels API, puis l'animation BlurFade.

### Waterfall `/` (mobile)
1. HTML statique (prérendu, `x-nextjs-cache: HIT`) à 3 ms. CSS terminées à ~800 ms. Chunks framework terminés à ~2,4 s.
2. Géolocalisation, puis `GET /poi/nearby` page 1 (2 548 à 3 413 ms), page 2 (3 449 à 4 217 ms), page 3 (4 247 à 4 951 ms). Les pages sont **séquentielles** et chargées automatiquement par la boucle `fetchNextPage`.
3. Chunk maplibre `148er4cr95wxq.js` (283 Ko gz / 1,05 Mo) : 2 500 à 5 032 ms. Ensuite, le worker recharge `maplibre-gl-shared.mjs` (148 Ko gz / 516 Ko) : 5 201 à 6 183 ms.
4. `style.json` Carto demandé **deux fois**, puis tiles.json, sprites, glyphs (7,4 à 8,3 s).
5. Payload API : 3 pages, soit **581 POI = 5,1 Mo de JSON décodé** (~200 Ko en brotli). Tout passe par `JSON.parse`, puis `flatMap`/filter, puis Supercluster sur le thread principal. Tâches longues de 386 à 529 ms en mobile.

### Waterfall `/station/[id]` (mobile)
Le HTML SSR (16 à 26 Ko) est peint à ~1,1-1,25 s, donc le LCP est bon. Ensuite il faut encore télécharger et évaluer :
- maplibre (283 Ko gz), terminé à 3,9 s ;
- recharts `2r7e_3ktcjzut.js` (112 Ko gz / 390 Ko), terminé à 3,1 s ;
- le worker shared (148 Ko gz), terminé à 5,7 s.

Tout ce code est importé **statiquement** par `station-page-view.tsx`. L'hydratation, donc l'interactivité (INP des premiers clics), attend ces 3 Mo décodés. L'appel `/prices/.../history` ne part qu'à 4,17 s, après l'hydratation.

## 3. Poids des bundles (`.next/static/chunks`)

| Chunk | Brut | gzip | Contenu | Chargé sur |
|---|---|---|---|---|
| `148er4cr95wxq.js` | 1 054 Ko | 282 Ko | maplibre-gl.mjs + shared | `/`, `/station` |
| `2r7e_3ktcjzut.js` | 390 Ko | 112 Ko | recharts (+ d3) | `/station` |
| `public/maplibre/maplibre-gl-shared.mjs` | 516 Ko | 148 Ko | **doublon** du code shared, chargé par le worker | `/`, `/station` |
| `34wvn5zw0a69w.js` | 205 Ko | 65 Ko | react-dom | toutes |
| `1113fu4gwe6yy.js` | 156 Ko | 43 Ko | runtime Next | toutes |
| `0_1xyigphk2-u.js` | 130 Ko | 43 Ko | motion (framer) | toutes |
| `0vk45k-8mta57.js` | 120 Ko | 38 Ko | vaul / radix | toutes |
| `1_ucotue1tn3m.js` | 89 Ko | 28 Ko | sonner, providers | toutes |
| `0cz1d0mv5g_q7.js` | 113 Ko | 39 Ko | polyfills `noModule` | non chargé par les navigateurs modernes |

Socle commun à toutes les pages (mesuré sur `/commune`) : **349 Ko gz / 1,08 Mo**. Il est gonflé par `AppProviders`, qui monte globalement `SearchCommand` (cmdk + Dialog radix), `Toaster` (sonner) et `TooltipProvider`, et par motion (utilisé via `BlurFade`, `magic-card`, `border-beam`…).

CSS : 3 feuilles (19 + 10 + 1 Ko gz). La feuille `maplibre-gl.css` (83 Ko brut) est chargée sur la fiche station.

Polices : 2 woff2 préchargés sur chaque page, Geist Sans (23 Ko) et **Geist Mono (29 Ko)**. Mono ne sert qu'à `font-mono` dans le tooltip de `ui/chart.tsx`.

Images : aucune image dans le chemin LCP. Le logo UI est un SVG inline (bien). `public/logo*.png` (12 à 15 Ko) ne servent qu'à OG et JSON-LD. Rien à faire.

API : `Vary: *` sur `/poi/nearby`, ce qui désactive le cache HTTP navigateur malgré `max-age=60`. Le fetcher envoie `Content-Type: application/json` sur **tous les GET**, ce qui déclenche un **preflight CORS OPTIONS**. Chrome met ce preflight en cache par URL : chaque nouveau curseur ou filtre refait un aller-retour (+150 ms en 4G par requête).

## 4. Correctifs par priorité

### P0 — `/commune/[insee]` : LCP 4,9 à 7 s en mobile
**Fichier** : `src/app/commune/[insee]/page.tsx`. Le composant est entièrement `'use client'`, donc aucun contenu dans le HTML. Il fait 2 fetchs après hydratation, puis anime 100 cartes avec `BlurFade`.

Il faut le passer en Server Component et garder un îlot client uniquement pour « Charger plus » :
```tsx
// src/app/commune/[insee]/page.tsx (Server Component)
import { getCommuneByInsee } from '@/api/generated/communes/communes';
import { findPoisByCommune } from '@/api/generated/poi/poi';
import { nextCursor } from '@/api/fetcher';
import { CommunePoiList } from './commune-poi-list'; // 'use client', useInfiniteQuery avec initialData

export default async function CommunePage({ params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params;
  const [commune, first] = await Promise.all([
    getCommuneByInsee(insee),
    findPoisByCommune(insee, { limit: 30 }),
  ]);
  return (
    <main>…<h1>{commune.data.name}</h1>
      <CommunePoiList insee={insee} initialPois={first.data} initialCursor={nextCursor(first)} />
    </main>
  );
}
```
Dans `src/components/station/station-card.tsx`, n'animer que les cartes sous la ligne de flottaison, ou remplacer `BlurFade` (motion) par une animation CSS :
```tsx
// n'applique BlurFade qu'à partir du 7e élément, sinon rendu direct
return delay === 0 ? card : <BlurFade delay={delay}>{card}</BlurFade>;
// et dans commune : delay={i < 6 ? 0 : Math.min((i - 6) * 0.03, 0.3)}
```
Réduire aussi la première page à 30 éléments : le DOM passe de 2 768 à ~800 nœuds. Pour le CLS de 0,044 (squelette `space-y-2` puis cartes), donner au `Skeleton` la hauteur réelle d'une `StationCard`, ou supprimer le squelette une fois en SSR.
Gain attendu : LCP d'environ 5-7 s à moins de 1,5 s en mobile, CLS à 0.

### P0 — `/` : payload POI et boucle de pagination
**Fichier** : `src/app/page.tsx`, lignes 97-102. Ce `useEffect` enchaîne `fetchNextPage` jusqu'à épuisement : 3 requêtes séquentielles et 5,1 Mo de JSON.
- Supprimer la boucle automatique. Charger la page 1 et ne charger la suite qu'au pan/zoom, ou via le bouton de la liste (`onLoadMore` existe déjà).
- Côté API, ajouter une projection légère pour la carte, par exemple `GET /poi/nearby?fields=map` qui renvoie `{id,type,lat,lng,name,brand,price}` (~150 o/POI contre ~9 Ko aujourd'hui, soit ~60× moins). La fiche complète est déjà chargée à part (`getPoiById`) quand on ouvre un POI.
- Gain attendu : 2,4 s de waterfall API en moins en mobile, suppression des tâches longues de 400 à 530 ms (parse + clustering), meilleur INP sur la carte.

**Fichier** : `src/api/fetcher.ts` (supprime le preflight CORS sur les GET) :
```ts
const res = await fetch(fullUrl, {
  ...init,
  headers: {
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...init?.headers,
  },
})
```
**Backend** : remplacer `Vary: *` par `Vary: Origin, Accept-Encoding` pour que `Cache-Control: public, max-age=60` fonctionne réellement.

### P1 — Fiches station : sortir maplibre et recharts du bundle d'hydratation
**Fichier** : `src/components/station/station-page-view.tsx`, lignes 15-16 (imports statiques) :
```tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const StationMap = dynamic(() => import('./station-map').then((m) => m.StationMap), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full rounded-2xl md:h-72" />,
});
const PriceHistoryChart = dynamic(
  () => import('./price-history-chart').then((m) => m.PriceHistoryChart),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-2xl" /> },
);
```
Pour le graphique (sous la ligne de flottaison), aller plus loin : monter `<PriceHistoryChart>` seulement quand il devient visible (IntersectionObserver, ou `useInView` déjà disponible via motion). Autre option : lancer `useGetPriceHistory` dès le SSR (`getPriceHistory` dans `page.tsx`, avec `initialData`) pour ne plus attendre l'hydratation (appel aujourd'hui parti à 4,17 s).
Gain attendu : JS critique d'hydratation de 898 Ko à ~450 Ko gz, soit ~2 s de moins avant interactivité en 4G lente et un TBT/INP réduit.

### P1 — Carte : double chargement du style et recentrage animé
**Fichier** : `src/components/map/map-container.tsx`, lignes 81-84. L'effet `setStyle` s'exécute dès le montage, ce qui recharge le style qui vient d'être passé au constructeur (2× `style.json`, sprites et glyphs refaits) :
```tsx
const appliedTheme = useRef(mapTheme);
useEffect(() => {
  if (!mapRef.current || appliedTheme.current === mapTheme) return;
  appliedTheme.current = mapTheme;
  mapRef.current.setStyle(getThemeUrl(mapTheme));
}, [mapTheme]);
```
Lignes 86-92 : au premier fix GPS, `flyTo` charge les tuiles de tous les niveaux intermédiaires. Utiliser `jumpTo` pour le premier positionnement et garder `flyTo` pour les changements suivants.

**Préconnexion Carto** (dans `map-dynamic.tsx` ou `page.tsx`, rendu au plus tôt) :
```tsx
import { preconnect } from 'react-dom';
preconnect('https://basemaps.cartocdn.com', { crossOrigin: 'anonymous' });
preconnect('https://tiles.basemaps.cartocdn.com', { crossOrigin: 'anonymous' });
```
Gain : ~300 à 600 ms sur l'affichage des premières tuiles en mobile.

### P1 — Worker maplibre : cache et doublon
Le worker recharge `maplibre-gl-shared.mjs` (148 Ko gz) alors que le même code est déjà dans le chunk principal. Sur Vercel, `public/` est servi en `max-age=0, must-revalidate`.
- **Fichier** `package.json`, script `maplibre:worker` : copier dans un dossier versionné, par exemple `public/maplibre/6.11.1/`. Mettre à jour `src/lib/maplibre.ts` en conséquence : `setWorkerUrl('/maplibre/6.11.1/maplibre-gl-worker.mjs')`.
- **Fichier** `next.config.ts`, dans `headers()` :
```ts
{ source: '/maplibre/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
```
Gain : 148 Ko en moins et ~1 s en moins en 4G sur chaque visite répétée.

### P2 — Socle JS commun (349 Ko gz sur chaque page)
**Fichier** : `src/providers/app-providers.tsx`. `SearchCommand` (cmdk + Dialog) est monté partout. Il vaut mieux le charger à la demande :
```tsx
const SearchCommand = dynamic(() => import('@/components/shared/search-command').then(m => m.SearchCommand), { ssr: false });
```
Idéalement, garder le listener ⌘K dans un petit composant et n'importer la palette qu'au premier appui. Faire de même pour `Toaster` (sonner). Remplacer les usages de `motion` décoratifs (`BlurFade`, `border-beam`, `dot-pattern`, `animated-grid-pattern`) par des animations CSS `tw-animate-css` quand c'est possible : ~43 Ko gz en moins.
Gain attendu : environ -60 à -90 Ko gz sur toutes les pages.

### P2 — Polices
**Fichier** : `src/app/layout.tsx` :
```ts
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], preload: false });
```
29 Ko de préchargement en moins sur chaque page. Mono n'est utilisé que dans le tooltip du graphique. `display: 'swap'` est déjà le défaut de next/font, et le fallback ajusté évite le CLS de police.

### P3 — CLS résiduel de la carte (0,002 à 0,013)
La source est le décalage de `.maplibregl-ctrl-bottom-right` (attribution) à l'init. Réserver l'espace ou passer `attributionControl: { compact: true }` dans `map-container.tsx`, comme sur `station-map.tsx`. Impact faible.

### P3 — Divers
- `/stats` : 100 % client (`useGetCoverageStats`). À passer en Server Component avec `revalidate`, pour la même raison que `/commune`.
- Page d'accueil : prérendu statique et TTFB excellents. Le HTML (67 Ko brut / 14 Ko br) inclut toute la `FilterIsland`. C'est acceptable.
- Vercel Analytics : impact négligeable, rien à changer. Pour suivre le terrain (LCP/INP/CLS au P75), ajouter `@vercel/speed-insights`, puisque CrUX n'a probablement pas de données.

## 5. Synthèse d'impact

| # | Correctif | Métrique | Gain attendu |
|---|---|---|---|
| 1 | Commune en SSR + pas de BlurFade au-dessus de la ligne de flottaison | LCP / CLS | 5-7 s → <1,5 s ; CLS → 0 |
| 2 | Pas de pagination auto + projection légère `/nearby` | LCP carte perçu / INP | -2,4 s API, -5 Mo de JSON |
| 3 | Pas de `Content-Type` sur GET + `Vary` corrigé | Réseau | -1 RTT par requête API |
| 4 | `next/dynamic` pour StationMap et PriceHistoryChart | TBT / INP fiches | -450 Ko gz d'hydratation |
| 5 | `setStyle` au montage supprimé + preconnect Carto + `jumpTo` | Affichage carte | -0,5 à 1 s |
| 6 | Cache immutable du worker versionné | Visites répétées | -148 Ko |
| 7 | SearchCommand/Toaster lazy, motion → CSS, Geist Mono sans preload | Toutes pages | -90 Ko gz, -29 Ko de police |
