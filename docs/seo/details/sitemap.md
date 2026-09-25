# ViaPlena — Audit sitemap et architecture de pages programmatiques

Date : 2026-09-24. Périmètre : `src/app/sitemap.ts`, `src/app/robots.ts`, les routes `/station/[id]`, `/commune/[insee]`, `/stats`, l'API locale (bun, `http://127.0.0.1:3000`, spec `/openapi.json`), le front local (`localhost:3002`) et la prod (`https://via-plena.zaphkiel.dev`).
Données de volume : crawl complet de l'API locale via `GET /api/v1/poi/by-department/{code}` (100 départements, 46 651 POI : 9 898 stations essence et 36 753 stations IRVE ; `stats/coverage` annonce 9 903 + 36 784, soit 36 POI sans département).
Doc Next lue : `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-sitemaps.md`, `.../03-file-conventions/01-metadata/sitemap.md`, `.../upgrading/version-16.md` (§ « Async id parameter »), `.../03-file-conventions/route.md`, plus le loader réel `next/dist/build/webpack/loaders/next-metadata-route-loader.js` (Next 16.3.6).

---

## 1. Diagnostic

### 1.1 Sitemap actuel

| Check | Prod | Local (3002) | Sévérité | Verdict |
|---|---|---|---|---|
| XML valide, `Content-Type: application/xml` | OK | OK | Critical | PASS |
| < 50 000 URL / < 50 Mo | 1 URL | 1 URL | Critical | PASS (trivial) |
| Couverture des pages indexables | 1 URL sur ~50 000 possibles | idem | **Critical** | **FAIL** : aucune station, aucune commune, pas `/stats` |
| URLs non-200 | aucune | aucune | High | PASS |
| URLs noindex | aucune | aucune | High | PASS |
| URLs redirigées | `loc` sans slash final, pas de redirection | idem | Medium | PASS |
| `lastmod` exact | `2026-02-26T08:02:18Z` = date du build, figée depuis 7 mois (cache Vercel `age: 715284`) | `new Date()` : change à chaque requête | Low | **FAIL** : dans les deux cas la date est fausse. Google ignore les `lastmod` d'un site quand ils sont systématiquement faux |
| `priority` / `changefreq` | présents (`daily`, `1`) | présents | Info | Google les ignore, à supprimer |

Prod : `/commune/75056` et `/stats` renvoient **404**, et le bundle prod appelle encore `https://api.prix-carburants.2aaz.fr`. La refonte (nouvelle API, commune, stats) **n'est pas déployée** et les UUID de la nouvelle API renvoient 404 en prod. Le nouveau sitemap doit donc partir **dans le même déploiement** que la nouvelle API. Sinon il annonce ~46k URL en 404.

### 1.2 robots.txt (prod = local)

```
User-Agent: *            Allow: /   Disallow: /api/
User-Agent: GPTBot       Allow: /
User-Agent: ClaudeBot    Allow: /
User-Agent: PerplexityBot Allow: /
Sitemap: https://via-plena.zaphkiel.dev/sitemap.xml
```
- PASS : syntaxe correcte et directive `Sitemap` présente.
- Info : `Disallow: /api/` ne sert à rien sur le front, car l'API est sur un autre hôte. C'est sans danger.
- Info : un groupe spécifique à un bot remplace entièrement le groupe `*`. GPTBot, ClaudeBot et PerplexityBot n'héritent donc pas du `Disallow: /api/`. Ajoutez-le à ces groupes, ou supprimez-les, puisque `*` autorise déjà tout.
- À faire : pointer vers l'index `sitemap-index.xml` (voir §3).

### 1.3 Problèmes bloquants trouvés sur les pages (hors sitemap, mais ils conditionnent l'indexation)

| # | Problème | Preuve | Sévérité |
|---|---|---|---|
| P1 | **Canonical hérité vers l'accueil.** `layout.tsx` définit `alternates.canonical: SITE_URL`. Toute page qui ne le redéfinit pas (`/commune/*`, `/stats`, 404) déclare `<link rel="canonical" href="https://via-plena.zaphkiel.dev"/>`. Google fusionnera ces pages avec l'accueil. | curl `localhost:3002/commune/75056` et `/stats` | Critical |
| P2 | **`/commune/[insee]` et `/stats` sont `'use client'`.** Le HTML SSR ne contient ni `h1`, ni liste de stations, ni `<title>` propre (title de l'accueil), ni lien. | idem, 0 `href` interne dans le HTML | Critical |
| P3 | **Soft 404 commune** : `/commune/99999` renvoie 200 avec `index, follow`. | curl | High |
| P4 | **Aucun lien vers les fiches.** `StationCard` est un `<div onClick>` et non un `<a href>`. La carte d'accueil est un canvas client. `search-command` utilise `router.push`. Seul le fil d'Ariane de la fiche lie `/commune/{insee}`, et seulement pour les IRVE. | `station-card.tsx:48` | Critical (découverte) |
| P5 | **Les stations essence n'ont pas de code INSEE** dans l'API (`by-commune` fait un filtre spatial). Pas de lien commune ni de BreadcrumbList commune sur les fiches essence, et pas de sitemap commune possible pour l'essence sans nouvel endpoint. | modèle `data` gas | High |
| P6 | **Codes INSEE IRVE hétérogènes.** Paris existe à la fois en `75056` (85 IRVE) et en arrondissements `75115`, `75116`… Or `GET /communes/75101` renvoie 404 alors que `by-commune/75101` renvoie des POI. Le fil d'Ariane lie donc des communes « inexistantes ». Même chose attendue pour Lyon (6938x) et Marseille (132xx). | curl | High |
| P7 | **Région en double** : `Provence-Alpes-Côte d'Azur` et `Provence-Alpes-Côte d’Azur` (apostrophe typographique). À normaliser avant de générer des slugs. | crawl | Medium |
| P8 | *(Artefact d'environnement, pas un bug du site, corrigé par le coordinateur)* : en local, `localhost:3000` était résolu en `::1`, où écoute un autre process Node. Le serveur 3002 tourne maintenant avec `NEXT_PUBLIC_API_URL=http://127.0.0.1:3000`. Revérifié : `/station/{gas}` et `/station/{ev}` renvoient 200, avec un canonical propre, `index, follow` et un title spécifique. Recommandation : utiliser `127.0.0.1` dans `.env.example`, pour que le build des sitemaps ne tombe pas dans le même piège. | ~~High~~ Info |
| P10 | **INSEE factice `99999`** sur 37 IRVE (et 5 vides). La fiche IRVE `e4092201-…` (Paris) lie `/commune/99999`, qui est une soft 404 indexable (P3). Il faut filtrer `99999` et les valeurs vides dans le fil d'Ariane et le JSON-LD, et corriger à l'ingestion (géocodage inverse). | HTML de la fiche + crawl | Medium |
| P9 | Fiche station : `robots: { index: true }` inconditionnel, y compris pour les 495 stations essence **sans aucun prix** et les ~1 415 IRVE sans puissance connue. | crawl | Medium |

Côté positif : la fiche `/station/[id]` est déjà bien construite (SSR, `generateMetadata`, canonical propre, JSON-LD GasStation/AutomotiveBusiness + BreadcrumbList, `notFound()` sur ID inconnu).

---

## 2. Architecture cible

### 2.1 Hiérarchie et patterns d'URL

Règle générale : minuscules ASCII, tirets, pas de slash final. Le code technique (INSEE, n° de département) est gardé en suffixe pour rester stable même si le libellé change.

```
/                                         accueil (carte + liens SSR)
├── /stats                                couverture nationale
├── /carburants                           hub prix moyens nationaux (6 carburants)
│   └── /prix/{carburant}                 ex. /prix/gazole    (6)
│       └── /prix/{carburant}/{dep}       ex. /prix/gazole/75-paris
│           └── /prix/{carburant}/{dep}/{commune}   ex. /prix/gazole/75-paris/paris-75056
├── /bornes-recharge                      hub national IRVE
│   └── /bornes-recharge/{dep}            ex. /bornes-recharge/14-calvados
│       └── /bornes-recharge/{dep}/{commune}/rapide  (>= 50 kW)
├── /region/{slug}                        ex. /region/ile-de-france   (17 avec données)
│   └── /departement/{code}-{slug}        ex. /departement/75-paris   (100)
│       └── /commune/{slug}-{insee}       ex. /commune/paris-75056    (route existante enrichie)
│           └── /station/{uuid}           (route existante)
└── /plan-du-site                         plan HTML (régions → départements → communes)
```

- `carburant` ∈ `gazole, sp95, sp98, e10, e85, gplc`. C'est un mapping du `FUEL_NAMES_ORDER` existant, en slug minuscule.
- `/commune/{insee}` (l'URL actuelle) doit rediriger en **301** vers `/commune/{slug}-{insee}`. Pour limiter la migration, on peut aussi garder `/commune/{insee}` comme URL canonique ; c'est acceptable, le slug n'apporte qu'un gain marginal. Dans tous les cas, **une seule forme canonique**.
- Arrondissements (P6) : il faut choisir une option et la tenir.
  - Option A, recommandée : pages arrondissement indexables (`/commune/paris-15e-75115`), rattachées à `paris-75056`. « prix essence Paris 15 » est une vraie requête.
  - Option B : l'API normalise 751xx/6938x/132xx vers le code commune, et `/commune/75115` redirige en 301 vers `paris-75056`.
- Pas de combinaison prise × ville, ni opérateur × ville : trop de pages, trop peu de données par page. Prise et opérateur restent des filtres (`?plug=CCS`) sur les pages département, en **noindex via canonical vers la page sans filtre**.

### 2.2 Volumes estimés (mesurés sur le crawl, communes regroupées par (département, ville))

| Type de page | Univers brut | Règle d'indexation | Pages indexées | Pages servies en `noindex,follow` |
|---|---|---|---|---|
| Accueil, stats, hubs `/carburants`, `/bornes-recharge`, `/plan-du-site` | 5 | toujours | 5 | 0 |
| Régions | 17 | ≥ 1 POI | 17 | 0 |
| Départements | 100 (976 Mayotte : 0 POI) | ≥ 10 POI | ~98 (973 Guyane : 2 POI, 972 : 10) | ~2 |
| Communes | 11 423 avec ≥ 1 POI (IRVE : 11 535 INSEE distincts) | **(≥ 2 stations essence avec prix) OU (≥ 3 IRVE) OU (≥ 3 POI au total)** | **~4 400** | ~7 000 |
| Fiches essence | 9 898 | ≥ 1 prix mis à jour depuis ≤ 30 j (9 212) | **~9 200** | ~690 (495 sans prix + prix périmés) |
| Fiches IRVE | 36 753 | `chargingPointCount > 0` et coordonnées valides | **~35 300** | ~1 400 |
| Prix carburant national | 6 | toujours | 6 | 0 |
| Carburant × département | 572 | ≥ 5 stations vendant ce carburant | **~563** | ~9 |
| Carburant × commune | 20 521 | **≥ 5 stations** avec prix pour ce carburant (≥ 3 : 2 192) | **~556** | ne pas générer les autres (404 ou redirection vers carburant × département) |
| Bornes rapides × commune | 1 118 à ≥ 3, 536 à ≥ 5 | ≥ 5 stations ≥ 50 kW | **~536** | ne pas générer |
| **Total indexable** | | | **~50 700** | |

Ordre de grandeur : ~51k URL, dont 88 % de fiches station. Le plus gros département fait 1 253 IRVE + 274 essence (Calvados 14 pour les IRVE, Bouches-du-Rhône 13 pour l'essence), soit **< 2 000 URL par fichier** si on découpe par département. On est très loin des 50k URL ou 50 Mo par fichier.

### 2.3 Règles de qualité (index bloat / thin content)

1. **Même règle pour la page et pour le sitemap.** Une fonction partagée (`src/lib/seo/indexability.ts`, voir §3.3) pilote à la fois `generateMetadata().robots` et l'inclusion dans le sitemap. Une URL en noindex ne doit jamais être dans le sitemap.
2. **Commune** : sous le seuil, la page reste servie aux utilisateurs en `noindex, follow` : elle transmet les liens vers les fiches mais n'est pas indexée. INSEE inconnu → `notFound()` (corrige P3).
3. **Fiche essence** : noindex si aucun prix, ou si le dernier prix a plus de 30 jours (station probablement fermée). Au-delà de 180 jours, renvoyer 410 ou 404.
4. **Carburant × commune / bornes × commune** : n'existent que **au-dessus du seuil**. Sous le seuil, `permanentRedirect` vers le niveau département. On évite ainsi de produire des milliers de pages quasi vides.
5. **Contenu unique minimal par page de lieu**, calculé à partir des données :
   - min/moy/max du carburant dans la zone, comparés au département et au national (`/prices/department`, `/prices/national`) ;
   - top 5 des moins chères, avec la date du relevé ;
   - historique 30 j (`/prices/pois/{id}/history` agrégé) ;
   - nombre de stations 24/24 et de ruptures (`fuelOutages`) ;
   - pour les IRVE : répartition par puissance, opérateurs, gratuité, disponibilité temps réel ;
   - communes voisines.
   Si une page ne peut remplir que 2 de ces blocs, elle ne passe pas le seuil.
6. Filtres en query string (`?plug=`, `?fuel=`, `?minPower=`) : canonical vers l'URL sans paramètre et jamais dans le sitemap.

### 2.4 Quality gate « location pages »

- **WARNING (≥ 30 pages de lieu)** et **HARD STOP (≥ 50 pages de lieu)** : le plan prévoit ~4 400 communes + ~560 carburant × commune + ~536 bornes × commune + ~660 pages départ./région, soit **~6 000 pages de lieu programmatiques**. Selon la règle de ce projet, **il faut une justification explicite de l'utilisateur avant de générer ces pages**.
- Arguments qui peuvent justifier le déploiement :
  - chaque page repose sur des **données propres et vérifiables** (prix officiels horodatés, inventaire IRVE data.gouv, temps réel), et pas seulement sur un nom de ville remplacé ;
  - des sites comparables (prix-carburants.gouv, carbu.com) sont indexés à cette échelle.
- Conditions à respecter : ≥ 60 % de contenu propre à chaque page (voir règle 5, les blocs de données chiffrées comptent, le texte gabarit non), pas de texte généré en masse, et des seuils stricts.
- **Déploiement progressif recommandé** :
  - vague 1 : fiches station + ~98 départements + 17 régions + ~300 communes (≥ 20 POI) ;
  - vague 2 : toutes les communes au-dessus du seuil, après 4 à 6 semaines si le rapport « Pages » de Search Console montre < 20 % de « Détectée/Explorée, actuellement non indexée » ;
  - vague 3 : carburant × commune et bornes rapides × commune.
- Pages « sûres à grande échelle » : les fiches station (données propres à chaque station). Pages « à risque » : carburant × commune, si le seuil est baissé.

---

## 3. Stratégie de sitemaps Next.js 16

### 3.1 Ce que dit la doc embarquée (Next 16.3.6), et ce qu'elle ne dit pas

- `generateSitemaps()` renvoie `[{ id }]`. En v16, **`id` est passé au `sitemap()` sous forme de `Promise<string>`** (breaking change v16). Les fichiers sont servis sur `/<segment>/sitemap/<id>.xml`, par exemple `/station/sitemap/75.xml`.
- Le loader (`next-metadata-route-loader.js`) montre plusieurs points utiles :
  - `generateSitemaps()` est **appelée à chaque requête** pour valider l'id. Elle doit donc être gratuite : liste statique, pas d'appel API.
  - Un `generateStaticParams` est généré automatiquement, donc **tous les sitemaps sont prérendus au build**.
  - Les exports de config (`revalidate`, etc.) sont **réexportés**, donc `export const revalidate = 3600` fonctionne (ISR).
  - La réponse porte `Cache-Control: public, max-age=0, must-revalidate`.
  - L'id peut être une chaîne (`item.id.toString()`), donc `2A` est valide.
- **Next ne génère pas de sitemap index.** Ni la doc ni le loader n'en produisent. Il faut un Route Handler. Attention : un dossier `app/sitemap.xml/route.ts` correspond au regex metadata `[\\/]sitemap\.xml$` (`lib/metadata/is-metadata-route.js`) et entre en conflit avec `app/sitemap.ts`. Il faut donc le nommer **`app/sitemap-index.xml/route.ts`**, qui ne correspond à aucun motif metadata.
- `changeFrequency` et `priority` : ignorés par Google, **ne pas les émettre**. `lastModified` doit être une vraie date de modification du contenu.
- Protocole : un sitemap ne devrait lister que des URL sous son propre chemin. `/station/sitemap/75.xml` ne liste que `/station/...` : c'est cohérent. Les hubs racine restent dans `/sitemap.xml`.

### 3.2 Découpage proposé

| Fichier | Source Next | Contenu | URL max |
|---|---|---|---|
| `/sitemap-index.xml` | `app/sitemap-index.xml/route.ts` | index de tous les fichiers ci-dessous | — |
| `/sitemap.xml` | `app/sitemap.ts` (réécrit) | accueil, `/stats`, hubs, régions, départements, `/prix/{carburant}`, carburant × département | ~700 |
| `/commune/sitemap.xml` | `app/commune/sitemap.ts` | communes indexables | ~4 400 (plafond théorique 35k, < 50k) |
| `/station/sitemap/{dep}.xml` ×100 | `app/station/sitemap.ts` + `generateSitemaps` | fiches indexables du département | < 2 000 chacun |
| `/prix/sitemap.xml` (vague 3) | `app/prix/sitemap.ts` | carburant × commune | ~560 |
| `/bornes-recharge/sitemap.xml` (vague 3) | `app/bornes-recharge/sitemap.ts` | départements + rapide × commune | ~640 |

Pourquoi un fichier par département plutôt que des tranches de 50k :
- ids stables ;
- chaque fichier coûte peu en appels API ;
- une erreur API ne vide qu'un fichier ;
- `lastmod` pertinent par zone ;
- Search Console donne l'indexation par département, ce qui est un bon outil de diagnostic.

**`lastmod` réel** :

| Page | Source |
|---|---|
| fiche essence | `max(data.fuels[].lastUpdate)` pour les carburants qui ont un prix |
| fiche IRVE | `data.lastModified ?? data.lastUpdateDate` (inventaire data.gouv). **Pas** `realtime.observedAt` : la disponibilité change à la minute, c'est un état et non une modification de contenu |
| commune / département / carburant × zone | max des `lastmod` des stations de la zone |
| accueil, hubs, `/stats` | `max(listPriceItems()[].lastObservedAt)` |

**Revalidation** : `revalidate = 3600` (les prix remontent au mieux toutes les heures). Si l'API échoue pendant une revalidation, il faut **throw**, pas renvoyer `[]` : l'ISR garde alors l'ancienne version au lieu de publier un sitemap vide.

**Risque de rate limit au build** : l'API limite à `120 req/min` (`x-ratelimit-limit`). Le prérendu des 100 sitemaps station fait au moins 100 appels, et jusqu'à ~250 avec la pagination à 500. Chaque réponse IRVE pèse environ 5,8 Ko par POI (Calvados : ~7 Mo JSON pour un seul fichier). **Il faut donc des endpoints dédiés** (§3.4), exemptés de rate limit via un jeton serveur. En attendant, le code ci-dessous relance après un 429 avec un backoff.

### 3.3 Code TS proposé (à créer, rien n'a été modifié dans le projet)

`src/lib/seo/site.ts`
```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://via-plena.zaphkiel.dev';
/** Prices are refreshed hourly at best; sitemaps follow. */
export const SITEMAP_REVALIDATE = 3600;
```

`src/lib/seo/departements.ts`
```ts
/** Metropolitan + Corsica + DROM. 976 (Mayotte) kept: its sitemap is simply empty today. */
export const DEPARTEMENT_CODES: readonly string[] = [
  ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, '0')).filter((c) => c !== '20'),
  '2A', '2B', '971', '972', '973', '974', '976',
];
```

`src/lib/seo/indexability.ts` (utilisé **aussi** par `generateMetadata` des pages)
```ts
import type { EvStationData, GasStationData } from '@/lib/poi';

const DAY_MS = 86_400_000;
export const GAS_PRICE_MAX_AGE_DAYS = 30;

type PoiData = GasStationData | EvStationData;
const isGasData = (d: PoiData): d is GasStationData => 'fuels' in d;

const toDate = (raw: string | null | undefined): Date | null => {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t) : null;
};

/** Most recent price date among fuels that actually have a price. */
export function gasLastPriceUpdate(data: GasStationData): Date | null {
  let max = 0;
  for (const f of data.fuels) {
    if (f.price == null || !f.lastUpdate) continue;
    const t = Date.parse(f.lastUpdate);
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max ? new Date(max) : null;
}

export interface IndexVerdict {
  index: boolean;
  lastModified: Date | null;
}

/** Single source of truth for robots meta AND sitemap inclusion of /station/{id}. */
export function poiIndexVerdict(poi: { data: PoiData }, now = Date.now()): IndexVerdict {
  const { data } = poi;
  if (isGasData(data)) {
    const last = gasLastPriceUpdate(data);
    const fresh = last != null && now - last.getTime() <= GAS_PRICE_MAX_AGE_DAYS * DAY_MS;
    return { index: fresh, lastModified: last };
  }
  const hasPoints = data.chargingPointCount > 0 || data.chargingPoints.length > 0;
  return {
    index: hasPoints && data.isLonLatCorrect !== false,
    lastModified: toDate(data.lastModified) ?? toDate(data.lastUpdateDate),
  };
}

/** Commune threshold (see audit §2.3). Keep in sync with the commune page robots meta. */
export function communeIsIndexable(c: { gasPriced: number; ev: number }): boolean {
  return c.gasPriced >= 2 || c.ev >= 3 || c.gasPriced + c.ev >= 3;
}
```

`src/lib/seo/retry.ts`
```ts
import { ApiError } from '@/api/fetcher';

/** Retries on 429 (API limit: 120 req/min) with exponential backoff; rethrows anything else. */
export async function with429Retry<T>(fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 429 || i >= attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 2 ** i * 2000));
    }
  }
}
```

`src/app/station/sitemap.ts` (fonctionne **aujourd'hui** avec le client généré)
```ts
import type { MetadataRoute } from 'next';
import { findPoisByDepartment } from '@/api/generated/poi/poi';
import { nextCursor } from '@/api/fetcher';
import { DEPARTEMENT_CODES } from '@/lib/seo/departements';
import { poiIndexVerdict } from '@/lib/seo/indexability';
import { with429Retry } from '@/lib/seo/retry';
import { SITE_URL } from '@/lib/seo/site';

export const revalidate = 3600;

/** Called on every request by Next to validate the id: must stay static (no API call). */
export async function generateSitemaps() {
  return DEPARTEMENT_CODES.map((code) => ({ id: code }));
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const code = await props.id; // Next 16: id is a Promise<string>
  const entries: MetadataRoute.Sitemap = [];
  let cursor: string | undefined;

  do {
    const res = await with429Retry(() =>
      findPoisByDepartment(code, { limit: 500, cursor }, { next: { revalidate: 3600 } }),
    );
    // The fetcher throws on !ok; this guard only narrows the union type.
    if (res.status !== 200) throw new Error(`by-department ${code}: HTTP ${res.status}`);

    for (const poi of res.data) {
      const verdict = poiIndexVerdict(poi);
      if (!verdict.index) continue;
      entries.push({
        url: `${SITE_URL}/station/${poi.id}`,
        ...(verdict.lastModified && { lastModified: verdict.lastModified }),
      });
    }
    cursor = nextCursor(res);
  } while (cursor);

  return entries; // throwing above keeps the previous ISR version instead of publishing an empty file
}
```
Une fois l'endpoint `GET /api/v1/sitemap/pois` disponible (§3.4) et `yarn api:generate` lancé, remplacez `findPoisByDepartment` par `getSitemapPois(code)` : 1 appel par fichier, ~80 octets par POI au lieu de ~5,8 Ko.

`src/app/commune/sitemap.ts` (**nécessite l'endpoint** `/api/v1/sitemap/communes`, car l'API n'expose pas le code INSEE des stations essence)
```ts
import type { MetadataRoute } from 'next';
import { viaplenaFetcher } from '@/api/fetcher';
import { communeIsIndexable } from '@/lib/seo/indexability';
import { with429Retry } from '@/lib/seo/retry';
import { SITE_URL } from '@/lib/seo/site';

export const revalidate = 3600;

/** Temporary shape until `yarn api:generate` produces `getSitemapCommunes`. */
interface SitemapCommune {
  insee: string;
  slug: string; // "paris" (API-side, normalised)
  gasPriced: number;
  ev: number;
  lastModified: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await with429Retry(() =>
    viaplenaFetcher<{ data: SitemapCommune[]; status: 200; headers: Headers }>('/api/v1/sitemap/communes', {
      next: { revalidate: 3600 },
    }),
  );
  return res.data.filter(communeIsIndexable).map((c) => ({
    // Current route. Switch to `${c.slug}-${c.insee}` once the slugged route + 301 ship.
    url: `${SITE_URL}/commune/${c.insee}`,
    ...(c.lastModified && { lastModified: new Date(c.lastModified) }),
  }));
}
```

`src/app/sitemap.ts` (réécrit : hubs uniquement, sans `changeFrequency` ni `priority`)
```ts
import type { MetadataRoute } from 'next';
import { listPriceItems } from '@/api/generated/prices/prices';
import { SITE_URL } from '@/lib/seo/site';

export const revalidate = 3600;

/** Only list routes that exist and return 200 + indexable. Uncomment per rollout wave. */
const HUB_PATHS = [
  '',
  '/stats',
  // '/carburants', '/bornes-recharge', '/plan-du-site',
  // ...REGIONS.map((r) => `/region/${r.slug}`),
  // ...DEPARTEMENTS.map((d) => `/departement/${d.code.toLowerCase()}-${d.slug}`),
  // ...FUEL_SLUGS.map((f) => `/prix/${f}`),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified: Date | undefined;
  try {
    const res = await listPriceItems({ next: { revalidate: 3600 } });
    if (res.status === 200 && res.data.length) {
      lastModified = new Date(Math.max(...res.data.map((i) => Date.parse(i.lastObservedAt))));
    }
  } catch {
    // Omitting lastmod is better than a fake one.
  }
  return HUB_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, ...(lastModified && { lastModified }) }));
}
```
Vérifiez `listPriceItems200Item` : le crawl montre bien `lastObservedAt: string`.

`src/app/sitemap-index.xml/route.ts` (Next ne génère pas l'index : Route Handler)
```ts
import { DEPARTEMENT_CODES } from '@/lib/seo/departements';
import { SITE_URL } from '@/lib/seo/site';

export const revalidate = 3600;

export function GET() {
  const locs = [
    `${SITE_URL}/sitemap.xml`,
    `${SITE_URL}/commune/sitemap.xml`,
    ...DEPARTEMENT_CODES.map((code) => `${SITE_URL}/station/sitemap/${code}.xml`),
    // wave 3: `${SITE_URL}/prix/sitemap.xml`, `${SITE_URL}/bornes-recharge/sitemap.xml`,
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs.map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`).join('\n') +
    '\n</sitemapindex>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
```
L'index ne contient pas de `<lastmod>`, car il est optionnel. Si on en veut un, il faut qu'il soit exact : l'endpoint §3.4 peut renvoyer le `max(updatedAt)` par département.

`src/app/robots.ts` : changer `sitemap: \`${SITE_URL}/sitemap-index.xml\`` et ajouter `disallow: '/api/'` aux groupes des bots IA (ou les supprimer).

Côté pages (même livraison, sinon le sitemap annonce des URL non indexables) :
- `station/[id]/page.tsx` : `robots: { index: poiIndexVerdict(poi).index, follow: true }`.
- `commune/[insee]/page.tsx` : passer en Server Component avec `generateMetadata` (title « Prix carburants et bornes à {Ville} ({CP}) », canonical propre, `robots` via `communeIsIndexable`), `notFound()` si l'INSEE est inconnu, et liste SSR de `<Link href="/station/{id}">`. La pagination « Charger plus » reste possible, mais la première page doit être rendue côté serveur.
- `stats/page.tsx` : SSR, avec son propre `metadata` et son canonical.
- `layout.tsx` : **retirer `alternates.canonical`** du layout racine, ou le déplacer dans `app/page.tsx`. Chaque page déclare le sien (corrige P1).
- `.env.example` : `http://127.0.0.1:3000` (P8, artefact de dev) ; ignorer `inseeCode` `99999`/vide dans le fil d'Ariane (P10).

### 3.4 Endpoints API à ajouter (viaplena-api)

1. `GET /api/v1/sitemap/pois?department={code}` → `200 [{ id, type: 'gas_station'|'ev_station', inseeCode, lastModified, indexable }]`
   - Sans pagination (≤ 2 000 lignes par département), triés par `id`.
   - `lastModified` : gas → `max(poi_prices.observed_at)` des carburants avec prix ; EV → `last_modified`.
   - `indexable` est calculé côté SQL avec les mêmes règles que §2.3, pour garder une seule source de vérité. On peut aussi le laisser au front via `poiIndexVerdict`.
   - Exempt du rate limit si l'en-tête `X-Internal-Token` est présent, ou avec un plafond dédié.
2. `GET /api/v1/sitemap/communes` → `200 [{ insee, name, slug, departmentCode, regionCode, gasPriced, ev, lastModified }]`, uniquement pour les communes qui ont ≥ 1 POI (~11,5k lignes, ~1 Mo).
   - Il faut **calculer un `insee_code` pour les stations essence** : jointure spatiale une fois à l'ingestion, puis colonne indexée (P5).
   - Il faut aussi **normaliser les arrondissements** selon l'option choisie en §2.1 (P6).
3. `GET /api/v1/geo/departments` et `/regions` → `[{ code, name, slug, regionCode, gasCount, evCount, lastModified }]`, pour les hubs, le sitemap racine et le maillage. Cela évite un référentiel en dur dans le front et corrige les doublons de région (P7).
4. Optionnel (vague 3) : `GET /api/v1/sitemap/fuel-areas?minStations=5` → `[{ fuel, departmentCode, insee|null, stations, lastModified }]`.
5. `GET /api/v1/poi/{id}` pour une station essence : ajouter `data.inseeCode`, afin d'avoir le fil d'Ariane commune et le BreadcrumbList sur les fiches essence.

---

## 4. Maillage interne (découverte)

Constat : le seul contenu HTML crawlable aujourd'hui est la fiche station, et rien n'y mène. Le sitemap aide à la découverte, mais **sans liens internes, Google explore peu et indexe mal** ~46k fiches. Objectif : **chaque URL indexable est à ≤ 4 clics de l'accueil**, via des `<a href>` présents dans le HTML SSR.

| Page | Liens à rendre côté serveur |
|---|---|
| **Accueil** | `page.tsx` devient un Server Component qui monte `<MapClient/>` et ajoute sous la carte (ou dans un panneau repliable, **présent dans le DOM**) : les 17 régions ; les 20 plus grandes villes ; les 6 `/prix/{carburant}` ; `/bornes-recharge` ; `/stats`. |
| **Footer global** (`layout.tsx`) | `/stats`, `/carburants`, `/bornes-recharge`, `/plan-du-site`, et quelques grandes villes. |
| **Région** | tous ses départements, avec le prix moyen gazole et le nombre de bornes par département. |
| **Département** | toutes les **communes indexables** (A-Z), le top 10 des stations les moins chères par carburant (liens fiches), `/prix/{carburant}/{dep}` ×6, `/bornes-recharge/{dep}`, et les départements limitrophes. |
| **Commune** (SSR) | **chaque station** (`StationCard` enveloppée dans `<Link href="/station/{id}">`, et non `onClick`), les pages carburant × commune qui existent, `/bornes-recharge/{dep}/{commune}/rapide` si elle existe, 6 à 10 communes voisines indexables, et un fil d'Ariane Accueil › Région › Département › Commune (et le JSON-LD BreadcrumbList qui va avec). |
| **Fiche station** | le fil d'Ariane complet, y compris pour **l'essence** (nécessite `inseeCode`) ; 6 à 8 « stations à proximité » via `findPoisNearby` côté serveur ; les liens « Prix du {carburant} à {ville} » pour chaque carburant vendu ; pour une IRVE, « Bornes rapides à {ville} ». |
| **Carburant × zone** | les mêmes zones pour les autres carburants, la zone parente, les zones sœurs (villes voisines) et les fiches listées. |
| **`/plan-du-site`** | page HTML Régions › Départements › Communes indexables (~4,5k liens, paginée par région si nécessaire). |
| **Carte / popups / recherche** | ajouter de vrais `<a href="/station/{id}">` dans `station-popup` et `station-detail` (déjà le cas dans `station-detail.tsx:239`), et rendre les résultats de `search-command` en `<Link>`. C'est surtout utile pour l'utilisateur ; l'effet SEO est faible car le rendu est côté client. |

Règles :
- ancres descriptives (« Prix gazole à Lyon », pas « voir ») ;
- pas de liens vers des pages en noindex depuis l'accueil et les hubs ;
- les liens vers des communes sous le seuil ne sont autorisés que depuis leur page département, en liste complète ;
- pas de `rel=nofollow` interne.

Contrôle après déploiement : crawler le site (Screaming Frog, ou un script de parcours des liens) et vérifier trois choses :
- 0 URL du sitemap orpheline (sans lien entrant HTML) ;
- 0 URL du sitemap en non-200, noindex ou avec un canonical différent ;
- profondeur de clics ≤ 4.

---

## Récapitulatif des actions (par priorité)

1. Déployer la nouvelle API et le nouveau front **avant** tout sitemap étendu (en prod, les nouvelles routes sont en 404).
2. Corriger le canonical hérité du layout (P1), passer commune et stats en SSR avec leur propre metadata (P2), `notFound()` sur les communes inconnues (P3).
3. Faire de `StationCard` un lien, et ajouter les liens SSR sur l'accueil, le footer, les hubs région et département (P4, §4).
4. Mettre en place `sitemap-index.xml` + `/station/sitemap/{dep}.xml` (fonctionne tout de suite avec `findPoisByDepartment`), le sitemap racine sans `changefreq`/`priority` avec un `lastmod` réel, et robots vers l'index.
5. API : `sitemap/pois`, `sitemap/communes`, `geo/departments`, `inseeCode` pour l'essence, normalisation arrondissements et régions (P5 à P7).
6. Obtenir la justification explicite de l'utilisateur pour le HARD STOP (> 50 pages de lieu), puis déployer les communes et le programmatique carburant/bornes par vagues, avec les seuils du §2.3.
7. Hygiène : `.env.example` avec `127.0.0.1` (P8, artefact déjà corrigé en local) ; filtrer l'INSEE `99999` (P10).
