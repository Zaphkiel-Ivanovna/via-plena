# Plan d'action SEO : ViaPlena

Score actuel : **43/100**. Score visé après les phases Critique et Haute : environ 75-80/100.
Constats et preuves : [FULL-AUDIT-REPORT.md](./FULL-AUDIT-REPORT.md). Code proposé : [`details/`](./details).

Légende : **[F]** front (ce repo), **[API]** viaplena-api, **[Ops]** déploiement ou config. Effort : S (moins d'une demi-journée), M (1 à 2 jours), L (3 jours et plus).

---

## Critique : bloque l'indexation (à faire avant ou avec le prochain déploiement)

| # | Action | Où | Effort |
|---|---|---|---|
| C1 | Retirer `alternates.canonical` de `src/app/layout.tsx` et définir le canonical dans chaque page (`/`, fiches, communes, stats). | [F] | S |
| C2 | Passer `/commune/[insee]` en Server Component : `generateMetadata`, H1, texte de synthèse, liste des stations en `<Link>`, `notFound()` pour un INSEE inconnu, `noindex` sous le seuil de qualité. | [F] | M |
| C3 | Passer `/stats` en Server Component : metadata, H1, chiffres clés et date dans le HTML serveur. | [F] | M |
| C4 | Transformer `StationCard` (liste et commune) en `<Link href="/station/{id}">`. Sur l'accueil, `onClick` + `preventDefault` garde l'ouverture du drawer. | [F] | S |
| C5 | Sitemaps segmentés : `src/app/station/sitemap.ts` avec `generateSitemaps()` par département, sitemap des communes au-dessus du seuil, index via un Route Handler, `lastmod` réel (date du prix ou `lastModified` IRVE). Code complet dans `details/sitemap.md`. | [F] + [API] | M |
| C6 | Garder l'accueil debout sans WebGL2 : try/catch autour de `new Map()` dans `map-container.tsx` (repli vers la liste) et ajout d'un `src/app/error.tsx` en français. | [F] | S |
| C7 | Redirections 308 des anciennes URL de prod `/station/{id numérique}` vers les nouvelles, via une table de correspondance id prix-carburants → UUID côté API et `proxy.ts`. | [F] + [API] | M |
| C8 | Déployer le front et la nouvelle API **ensemble**, sinon le nouveau sitemap annonce des URL en 404. | [Ops] | S |

## Haute : impact fort sur le classement (sous 1 à 2 semaines)

| # | Action | Où | Effort |
|---|---|---|---|
| H1 | Pages de confiance : `/mentions-legales` (obligation LCEN), `/confidentialite` (Vercel Analytics, Sentry Replay), `/a-propos`, `/methodologie` (sources, fréquence de mise à jour, fiabilité du temps réel), `/contact`. Lien vers chacune dans un footer global. | [F] | M |
| H2 | Accueil : title et description orientés carburant + bornes (voir le rapport §4), H1 visible, courte section serveur sous la carte (prix moyens du jour, liens vers les grandes villes, les départements et les carburants). Pas de refonte de la carte. | [F] | M |
| H3 | Titles et metas des fiches : mot-clé en tête, prix ou compteur dynamique, rue ou code postal pour dédupliquer, `title.absolute` quand c'est trop long. | [F] | S |
| H4 | Fiches : `export const revalidate = 300` au lieu de `no-store`. | [F] | S |
| H5 | `inseeCode` sur les stations essence ; codes d'arrondissement rattachés à la commune (75056, 69123, 13055) ; exclusion de l'INSEE `99999` et de la station « Adresse fictive de test ». | [API] | M |
| H6 | Fiches : texte comparatif généré (prix face à la moyenne commune et département, rang local, tendance sur 7 jours), date absolue + `dateModified`, liens vers les stations voisines et la page commune. Gabarits dans `details/content.md`. | [F] + [API] | M |
| H7 | JSON-LD enrichi : `@graph` avec `@id`, `openingHoursSpecification` depuis les horaires, `amenityFeature` (services, points de charge), carburants en français, `Dataset` sur `/stats`. Module dans `details/structured-data.proposal.ts.txt`. | [F] | M |
| H8 | `/commune` : Server Component paginé par 30, sans animations au-dessus de la ligne de flottaison (LCP mobile de 5 à 7 s aujourd'hui), et correction du débordement horizontal en mobile. | [F] | S (avec C2) |
| H9 | Accueil : supprimer la boucle `fetchNextPage` et exposer côté API une réponse carte légère (`fields=map`). Aujourd'hui, 5,1 Mo de JSON. | [F] + [API] | M |

## Moyenne : optimisation (sous 1 mois)

| # | Action | Où | Effort |
|---|---|---|---|
| M1 | URLs à slug : `/station/{marque-ville}-{shortid}`, `/borne/{operateur-ville}-{shortid}`, `/prix-carburant/{ville}-{insee}`, avec 308 depuis les UUID et les INSEE. | [F] + [API] | L |
| M2 | Pages programmatiques, en 3 vagues (top 300 villes d'abord) et avec les mêmes seuils de qualité : département et région, carburant × commune, bornes × ville (`/rapide`, `/gratuites`, `/disponibles`), `/carburant/{type}`. | [F] + [API] | L |
| M3 | Page `/penurie-carburant` (ruptures du flux officiel, stations encore approvisionnées). Seulement après avoir vérifié le contexte d'actualité. | [F] | M |
| M4 | `opengraph-image.tsx` par fiche (1200×630 : nom, prix ou bornes libres) et image générique 1200×630 pour le reste. | [F] | M |
| M5 | Favicons : `/favicon.ico` et PNG en 48, 96 et 192 px à une URL stable. | [F] | S |
| M6 | robots.txt : reprendre `Disallow: /api/` dans les groupes des bots IA et ajouter OAI-SearchBot, Claude-SearchBot et Google-Extended. `llms.txt` (modèle dans `details/content.md`). | [F] | S |
| M7 | Charger maplibre et recharts avec `next/dynamic` sur les fiches ; cache immutable versionné pour le worker maplibre ; `setStyle` seulement si le thème change ; `SearchCommand` et `Toaster` à la demande. | [F] | M |
| M8 | Réseau : retirer `Content-Type` des GET dans `fetcher.ts` (preflight CORS) et remplacer `Vary: *` par des en-têtes de cache corrects dans l'API. | [F] + [API] | S |
| M9 | Accessibilité et lisibilité mobile : cibles tactiles d'au moins 44 px, texte d'au moins 12-14 px, contraste des classes `/50` et `/70`, prix des fiches avant la mini-carte en mobile, formats de prix unifiés (« 2,250 €/L »). | [F] | M |
| M10 | Articles P1 du plan éditorial (voir `details/keywords.md` §5) : bornes gratuites, E10 ou SP95, classement des départements, « quel jour faire le plein » (étude propriétaire). | Contenu | L |

## Basse : backlog

- En-têtes de sécurité : CSP, HSTS avec `includeSubDomains`/`preload`, `poweredByHeader: false`.
- 308 de `/?station=` vers `/station/{id}` via `proxy.ts`.
- Pages enseigne, autoroute et opérateur EV ; articles P2 et P3 ; relations presse autour des études de données.

---

## Suivi

1. Déclarer le site et les sitemaps dans Google Search Console et Bing Webmaster Tools dès le déploiement.
2. Au bout de 2 à 4 semaines, suivre les pages indexées par type et les impressions par cluster de mots-clés, puis recalibrer les volumes estimés dans `details/keywords.md`.
3. Mesurer les Core Web Vitals réels (PageSpeed, puis CrUX) une fois le trafic suffisant.

---

## Avancement (25 septembre 2026)

**Fait côté front** (vérifié sur un build de production servi par une API de test rejouant des réponses réelles) :
- C1 : canonical retirée du layout, déclarée par page.
- C2 : `/commune/[insee]` en Server Component : metadata, H1, texte de synthèse, tableau des prix, liens vers toutes les fiches, JSON-LD `CollectionPage`, vrai 404, `noindex` sous le seuil, ISR.
- C3 : `/stats` en Server Component : title dynamique, H1, texte, JSON-LD `Dataset`.
- C4 : `StationCard` devient un `<Link>` (le clic ouvre toujours le drawer).
- C5 : `/sitemap-index.xml`, `/sitemap.xml` (hubs et grandes villes) et `/station/sitemap/{département}.xml` (fiches indexables, `lastmod` réel).
- C6 : repli de l'accueil sans WebGL2 et `error.tsx` en français.
- H1 : `/mentions-legales`, `/confidentialite`, `/a-propos`, `/methodologie` et pied de page commun.
- H2 : accueil (title, description, H1 visible, prix moyens rendus côté serveur, liens vers les villes).
- H3 : titles des fiches (noms de carburant recherchés, rue pour dédupliquer, prix).
- H4 : ISR des fiches et des communes (`revalidate = 300` + `generateStaticParams`).
- H6 : fiches avec comparaison chiffrée aux stations voisines (prix de moins de 30 jours) et liens vers elles.
- H7 : JSON-LD enrichi (`@graph`, `openingHoursSpecification`, `amenityFeature`, prix au litre, logo lisible).
- M5 : `favicon.ico` et icônes de 48, 96, 192 et 512 px ; manifest mis à jour.
- M6 : robots.txt (bots IA, `/api/`) et `llms.txt`.
- M7 : maplibre et recharts chargés avec `next/dynamic` sur les fiches.
- M8 (front) : plus de `Content-Type` sur les GET.
- Fil d'Ariane : les arrondissements (751xx, 6938x, 132xx) pointent vers la commune entière, et l'INSEE `99999` est ignoré.

**Reste à faire :**
- API :
  - C7 : table de correspondance ancien id → UUID.
  - H5 : `inseeCode` des stations essence ; supprimer les stations de test « Adresse fictive de test ».
  - H9 : réponse carte légère.
  - M8 : remplacer `Vary: *`.
  - Endpoints `sitemap/pois` et `sitemap/communes`.
- Front : M1 (slugs), M2 (pages programmatiques), M3, M4 (images OG), M9, M10.
- Déploiement : C8 (front et API ensemble), Search Console.

## Avancement : pages par ville (25 septembre 2026)

**API (`viaplena-api`)**
- Colonne `fr_communes.slug` (migration `0005`). Les slugs sont calculés après chaque synchro des communes (`refreshCommuneSlugs`) ou à la main (`bun run db:slugs`) : `le-mans`, `saint-etienne`, et un suffixe département pour les 3 769 homonymes (`saint-denis-93`, `saint-denis-974`). Tests dans `tests/slug.unit.test.ts`.
- `GET /communes/by-slug/:slug` et `GET /communes/index` (11 178 communes qui ont au moins une station, avec leurs comptes et la date de dernière mise à jour ; 0,6 s, cache HTTP d'une heure).
- `GET /poi/:id` renvoie `commune { insee, slug, name }`, rattachée par contour : les stations essence ont enfin une ville.
- `GET /poi/by-commune` rattache aussi les bornes par contour : arrondissements de Paris, Lyon et Marseille, et INSEE `99999` (Lyon passe de 23 à 126 bornes).

**Front**
- `/prix-carburant/{ville}` : la page ville complète (rendue côté serveur, ISR de 5 minutes), avec les contractions françaises (« au Mans », « aux Sables-d'Olonne »).
- `/commune/{insee}` redirige en 308 vers `/prix-carburant/{ville}`.
- `/prix-carburant/sitemap.xml` liste 4 368 villes indexables (même règle que la balise robots) et figure dans `/sitemap-index.xml`.
- Liens internes mis à jour : pied de page, recherche, fil d'Ariane et JSON-LD des fiches.

**Suite logique :** `/prix-carburant/{ville}/{carburant}` (« prix gazole Le Mans ») et `/bornes-recharge/{ville}` (`/rapides`, `/gratuites`, `/disponibles`), sur la même base de données et le même seuil d'indexation.
