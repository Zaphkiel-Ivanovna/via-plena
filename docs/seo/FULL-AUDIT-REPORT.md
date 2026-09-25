# Audit SEO complet : ViaPlena

Date : 24 septembre 2026. Périmètre : code local à jour (non déployé), serveur de dev, production https://via-plena.zaphkiel.dev, API viaplena-api.
Méthode : 7 audits spécialisés (technique, contenu, données structurées, sitemap, performance, visuel, mots-clés). Les rapports détaillés, avec preuves et code proposé, sont dans [`details/`](./details). Les captures sont dans [`screenshots/`](./screenshots).

---

## Résumé

### Score SEO global : 43 / 100

| Catégorie | Poids | Score | Contribution |
|---|---|---|---|
| SEO technique | 25 % | 52 | 13,0 |
| Qualité du contenu | 25 % | 27 | 6,8 |
| On-page (titles, headings, maillage) | 20 % | 40 | 8,0 |
| Données structurées | 10 % | 52 | 5,2 |
| Performance (Core Web Vitals) | 10 % | 68 | 6,8 |
| Images | 5 % | 55 | 2,8 |
| Préparation à la recherche IA | 5 % | 16 | 0,8 |

**Type d'activité :** outil comparateur et service local de données (prix des carburants et bornes de recharge), sans monétisation directe, audience grand public en France.

**Verdict :** la donnée est excellente : environ 9 800 stations essence synchronisées toutes les heures, environ 36 800 bornes IRVE avec leur disponibilité en temps réel, et l'historique des prix. En revanche, **Google n'en voit presque rien**. Une seule URL est déclarée, l'accueil est une carte sans liens, et les pages commune et stats sont invisibles sans JavaScript et renvoient leur canonical vers l'accueil. Seules les fiches `/station/[id]`, refaites récemment, sont correctes. Le potentiel est d'environ **50 000 pages indexables de qualité**, soit 5 000 fois la surface actuelle.

### 5 problèmes critiques

1. **Aucun chemin de crawl vers les pages.** `sitemap.ts` ne liste que `/`. L'accueil ne contient aucun `<a>` interne dans le HTML serveur, et les cartes de station sont des `div onClick`, pas des liens. Environ 46 700 fiches et 35 000 communes ne peuvent pas être découvertes.
2. **Canonical vers l'accueil sur toutes les pages sans override.** `alternates.canonical` est défini dans `layout.tsx` et hérité par `/commune/*`, `/stats` et même les 404. Google les traite comme des doublons de l'accueil.
3. **`/commune/*` et `/stats` sont rendues uniquement côté client** (`'use client'`, sans `generateMetadata`). Il reste 15 à 20 mots dans le HTML serveur, pas de H1 sur la page commune, et le title de l'accueil. `/commune/99999` et `/commune/abc` renvoient 200 (soft 404).
4. **Aucune page de confiance** : ni mentions légales (obligation LCEN), ni confidentialité (Vercel Analytics et Sentry Replay tournent), ni contact, ni méthodologie, ni à propos. L'E-E-A-T est très faible sur une niche de données « argent du quotidien ».
5. **L'accueil plante sans WebGL2.** `map-container.tsx` crée la carte sans try/catch et il n'y a pas d'`error.tsx`. Toute la page devient l'écran anglais « This page couldn't load », H1 compris. Les fiches station gèrent déjà ce cas.

### 5 quick wins

1. Supprimer `alternates.canonical` du layout et le définir page par page (30 minutes, effet immédiat sur l'indexabilité).
2. Transformer `StationCard` en `<Link href="/station/{id}">` (le clic garde l'ouverture du drawer) : des milliers de liens internes d'un coup.
3. Réécrire le title et la description de l'accueil autour de **carburant + bornes en temps réel**. Aujourd'hui, 79 % des POI (les bornes) sont absents du positionnement.
4. Ajouter `revalidate = 300` sur les fiches : aujourd'hui `no-store`, donc SSR et appel API à chaque visite de bot.
5. Dédupliquer les titles des fiches : 8 stations sur 53 dans le 75 s'appellent « Total : prix des carburants à Paris ». Ajouter la rue et un prix.

---

## 1. SEO technique (52/100)

Détail : [`details/technical.md`](./details/technical.md)

**Crawlabilité**
- Critique. Voir les problèmes critiques 1 à 3.
- Haute. Les fiches essence sont des culs-de-sac : un seul lien, vers `/`. L'API ne fournit pas d'`inseeCode` pour les stations essence, donc aucun lien vers la commune.
- Haute. Le fil d'Ariane des bornes pointe vers `/commune/75104` (codes d'arrondissement de Paris, Lyon et Marseille), qui n'existent pas dans l'API communes. 37 bornes ont un INSEE factice `99999`, qui renvoie des bornes de Saint-Brieuc.

**Indexabilité**
- Soft 404 sur les communes (voir critique 3). Les fiches station renvoient bien de vrais 404 (corrigé pendant la refonte).
- Titles dupliqués sur les fiches (voir quick win 5).

**URL et migration**
- Haute. En production, les anciennes URL `/station/{id numérique}` (source prix-carburants) vont tomber en 404 avec les nouvelles UUID. Il faut des redirections 308 au déploiement.
- Moyenne. Les UUID et les codes INSEE n'ont aucun mot-clé dans l'URL. Voir l'architecture cible en §4.
- Conforme : HTTPS et trailing slash en 308, `lang="fr"` (pas besoin de hreflang), viewport correct, `?station=` a le canonical de l'accueil (une 308 via `proxy.ts` reste conseillée).

**robots.txt et sécurité**
- Moyenne. Les groupes `GPTBot`, `ClaudeBot` et `PerplexityBot` annulent le `Disallow: /api/`. `OAI-SearchBot`, `Claude-SearchBot` et `Google-Extended` manquent.
- Basse. Pas de CSP, HSTS sans `includeSubDomains`/`preload`, `X-Powered-By` exposé.

**Production en retard**
- La prod appelle encore l'ancienne API (`api.prix-carburants.2aaz.fr`) et renvoie 404 sur `/commune/*` et `/stats`. Le nouveau sitemap doit partir **dans le même déploiement** que la nouvelle API.

## 2. Qualité du contenu et E-E-A-T (27/100, E-E-A-T 25/100)

Détail et gabarits de texte générés à partir des données : [`details/content.md`](./details/content.md)

- Critique. Pages de confiance absentes (voir critique 4).
- Haute. L'accueil fait 90 mots, avec un H1 en `sr-only`, aucun texte visible qui dise ce que fait le site, et rien sur les bornes.
- Haute. Les fiches sont du thin content : données brutes sans texte comparatif (prix face à la moyenne de la ville et du département, rang local). Le graphique d'historique n'est rendu que côté client.
- Haute. Une station de test (« Adresse fictive de test ») est en base. Elle passerait pour la moins chère de Paris : il faut la filtrer côté API.
- Moyenne. Dates uniquement relatives (« il y a 3 h ») : ajouter la date absolue et `dateModified`.
- Points positifs : les sources officielles sont citées sur les fiches, la fraîcheur est affichée, et la synchronisation horaire est fiable (dernière : 9 808 stations, 0 erreur).

## 3. On-page (40/100)

- Titles et metas propres aux fiches station seulement. Commune, stats et 404 héritent de ceux de l'accueil.
- H1 : correct sur les fiches, absent sur la page commune, `sr-only` sur l'accueil.
- Maillage : quasi inexistant (voir critique 1). Profondeur de crawl infinie pour 99,9 % des pages.
- Mots-clés globaux (`layout.tsx`) limités aux carburants. La balise `keywords` est ignorée par Google, mais elle montre que le positionnement éditorial oublie les bornes.
- Formats incohérents : « 2.559€ » sur la page commune, « 2,250 €/L » sur les fiches.

## 4. Stratégie de mots-clés et architecture

Détail (9 clusters, intentions, volumes estimés, difficulté, concurrence, sources) : [`details/keywords.md`](./details/keywords.md)

> Les volumes sont des estimations d'ordre de grandeur, faites sans Semrush, Ahrefs ni Keyword Planner. Il faut les valider dans Search Console dès les premières impressions. Le contexte « crise des carburants de septembre 2026 » (record du gazole, ruptures dans environ 16 % des stations) vient de sources presse relevées par l'agent : à vérifier avant d'en faire un axe éditorial.

**Concurrence**
- Côté carburant, le marché est saturé de sites programmatiques récents (supercarbu, prix-carburant.eu, mon-essence, carburants.org…) plus les historiques (zagaz, carbu.com). Le site gouvernemental n'a aucune page locale indexable.
- Côté bornes, Chargemap et meilleurecharge dominent, mais **aucun site n'expose la disponibilité temps réel sur des pages ville indexables**.

**Angles différenciants de ViaPlena**
1. Disponibilité des bornes en temps réel (« borne libre maintenant {ville} »), avec une difficulté très faible.
2. Carburant et bornes sur la même page commune : des pages plus riches, moins exposées au reproche de thin content.
3. Historique des prix par station, qui permet des études propriétaires sources de backlinks (« quel jour faire le plein »).
4. La donnée « gratuit » de l'IRVE, pour « borne de recharge gratuite {ville} ».
5. Les ruptures de stock du flux officiel, pour une page « pénurie / disponibilité carburant ».

**À ne pas attaquer de front** : « prix carburant » et « station essence près de moi », tenus par le pack local Google et le site gouvernemental. L'autorité viendra de la longue traîne.

**Architecture cible** (volume estimé : environ 50 700 URL indexables)

| Type de page | URL proposée | Volume | Mot-clé type |
|---|---|---|---|
| Fiche station essence | `/station/{marque-ville}-{shortid}` | ~9 200 (prix de moins de 30 j) | {marque} {ville} prix |
| Fiche borne | `/borne/{operateur-ville}-{shortid}` | ~35 300 | borne {opérateur} {ville} |
| Commune (carburant + bornes) | `/prix-carburant/{ville}-{insee}` | ~4 400 (seuil de qualité) | station essence {ville} |
| Carburant × commune | `/prix-carburant/{ville}-{insee}/{carburant}` | ~560 (≥ 5 stations) | prix gazole {ville} |
| Département / région | `/prix-carburant/departement/{code}-{slug}` | ~100 + 17 | prix carburant {département} |
| Bornes × ville | `/bornes-recharge/{ville}-{insee}/{rapide\|gratuites\|disponibles}` | ~540 | borne recharge rapide {ville} |
| Nationales | `/stats`, `/penurie-carburant`, `/carburant/{type}` | ~10 | prix gazole aujourd'hui |

Règle d'indexation (identique pour la balise robots et le sitemap) : commune indexée si elle a au moins 2 stations essence avec prix, ou au moins 3 bornes, ou au moins 3 stations au total. Sinon `noindex, follow`. Détail et code : [`details/sitemap.md`](./details/sitemap.md).

**Titles cibles** (≤ 60 caractères, mot-clé en tête, prix ou compteur dynamique)
- Accueil : `Prix carburant & bornes de recharge en temps réel | ViaPlena`
- Fiche station : `{Marque} {Ville} : gazole {2,25} €, SP95-E10 {2,17} €`
- Fiche borne : `Borne {Opérateur} {Ville} : {3}/{4} libres, {150} kW`
- Commune : `Carburant et bornes {Ville} : gazole dès {2,21} €`
- Carburant × ville : `Prix {gazole} {Ville} : dès {2,21} €/L ({mois} {année})`

## 5. Données structurées (52/100, environ 88 visé)

Détail, blocs JSON-LD prêts à l'emploi et module générateur : [`details/schema.md`](./details/schema.md) et [`details/structured-data.proposal.ts.txt`](./details/structured-data.proposal.ts.txt)

- **Existant :** WebSite et Organization (sans `@id`, `publisher` ni `sameAs`), `GasStation` avec `Offer` ou `AutomotiveBusiness`, plus `BreadcrumbList` sur les fiches. Tout est valide.
- **À corriger :**
  - l'image est le logo générique ;
  - les horaires ne sont renseignés que pour les stations 24/7, via `openingHoursSpecification` ;
  - les services ne sont pas exploités (`amenityFeature`) ;
  - les prix n'ont pas d'unité (litre) ;
  - les carburants sont en anglais (« Diesel ») ;
  - le fil d'Ariane des bornes pointe vers une commune qui n'existe pas.
- **À ajouter :** `Dataset` sur `/stats` ; `ItemList` et `CollectionPage` sur les communes (une fois rendues côté serveur).
- **À éviter :** SearchAction (retiré de Google en 2024) ; FAQPage (rich result réservé aux sites officiels et de santé) ; notes de type `WebApplication` sans vrais avis.

## 6. Performance (68/100)

Détail : [`details/performance.md`](./details/performance.md). PageSpeed et CrUX n'ont pas été mesurés (quota de l'API atteint) : à refaire après déploiement.

- **`/commune` :** LCP mobile de 4,9 à 7 s. Rendu entièrement client, puis 100 cartes animées (2 768 nœuds DOM). Passer en Server Component, paginer par 30 et retirer les animations au-dessus de la ligne de flottaison.
- **Accueil :** une boucle `fetchNextPage` (`page.tsx`) charge 581 POI, soit 5,1 Mo de JSON, avant que la carte n'apparaisse (environ 5 à 6 s en 4G). Il faut une réponse « légère » côté API pour la carte.
  - Le `Content-Type` envoyé sur les GET (`fetcher.ts`) déclenche un preflight CORS par URL.
  - Le `Vary: *` renvoyé par l'API empêche tout cache navigateur.
- **Fiches :** LCP correct (1,1 à 1,25 s en mobile) grâce au SSR, mais environ 900 Ko de JS compressé. maplibre et recharts sont à charger avec `next/dynamic`.
- **Divers :**
  - le worker maplibre est chargé en double et servi sans cache : lui donner un cache immutable versionné ;
  - `setStyle` s'exécute au montage et charge `style.json` deux fois ;
  - un socle de 349 Ko se charge sur chaque page : charger `SearchCommand` et `Toaster` à la demande.
- Le CLS est bon partout (0 à 0,044).

## 7. Visuel, mobile et images (55/100)

Détail : [`details/visual.md`](./details/visual.md) et captures dans [`screenshots/`](./screenshots)

- L'accueil ne montre au-dessus de la ligne de flottaison qu'une carte, des filtres et « 581 stations ». Il n'y a aucune proposition de valeur visible.
- Sur mobile, `/commune` déborde horizontalement (523 px pour 390 px), et ses cartes ne sont pas cliquables sur mobile.
- Fiches station : très bonnes sans JavaScript. Sur mobile, les prix sont repoussés sous la mini-carte ; mieux vaut les remonter.
- Pas d'`og:image` : une image 1200×630 générée par fiche (`opengraph-image.tsx`, en `summary_large_image`) améliorerait fortement le partage, qui est central dans l'app.
- Favicons en 32×32 seulement, servis selon le thème, et `/favicon.ico` en 404. Google demande un multiple de 48 px à une URL stable.
- Cibles tactiles souvent entre 24 et 40 px. Beaucoup de texte en 10-12 px, et les classes `/50` et `/70` donnent un contraste trop faible.

## 8. Préparation à la recherche IA (16/100)

- Pas de `llms.txt` ; un modèle est fourni dans `details/content.md`.
- Aucun passage autonome et citable, du type « Au {date}, le gazole coûte en moyenne {x} €/L à {ville}, {y} € de moins que la moyenne nationale. »
- Les bots IA sont autorisés dans robots.txt (bien), mais il manque les user-agents « search » (OAI-SearchBot, Claude-SearchBot).
- La future page `/stats` et des études propriétaires sont les meilleurs leviers de citation.

---

## Limites de l'audit

- Pendant l'audit, un agent a arrêté par erreur l'API locale, Docker (Postgres et Redis) et d'autres serveurs de dev. Les mesures valides ont été faites avant l'incident. Les agents concernés ont retiré de leurs constats les erreurs qu'il a provoquées.
- Pas de données Search Console, Keyword Planner, PageSpeed ni CrUX : volumes et Core Web Vitals de terrain sont à confirmer après déploiement.
- La production est en retard sur le code local. Les constats portent sur le code local, sauf mention contraire.
