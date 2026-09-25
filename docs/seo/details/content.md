# Audit Contenu / E-E-A-T / AI-readiness : ViaPlena

Date : 24/09/2026. Périmètre : code local (`main` + modifications non commitées), serveur dev `http://localhost:3002`, API `http://127.0.0.1:3000/api/v1`, prod `https://via-plena.zaphkiel.dev` (ancienne version).
Référentiel : Google Search Quality Rater Guidelines (sept. 2025), Helpful Content intégré au core algorithm (mars 2024).

---

## 0. Scores

| Indicateur | Score |
|---|---|
| **Qualité du contenu (global)** | **27 / 100** |
| **AI-readiness (citabilité IA)** | **16 / 100** |
| E-E-A-T pondéré | 25 / 100 |

### Détail E-E-A-T

| Facteur | Poids | Score | Justification |
|---|---|---|---|
| Experience | 20 % | 30 | Donnée réelle et propre (historique de prix collecté toutes les heures, dispo temps réel des bornes) = vraie valeur « first-hand ». Mais aucun texte ne l'exploite (pas d'analyse, pas de tendance écrite, pas d'observatoire). |
| Expertise | 25 % | 30 | Données techniques justes (puissance, prises, ruptures, horaires). Aucun contenu explicatif (types de prises, E10/E85, vitesses de charge). Auteur = pseudo « Zaphkiel » sans rôle ni compétence affichés. |
| Authoritativeness | 25 % | 15 | Aucune page à propos, aucune mention presse, aucun lien entrant organisé. `Organization` JSON-LD sans `sameAs`, sans `founder`, sans contact. |
| Trustworthiness | 30 % | 25 | Point positif : source officielle citée sur les fiches (prix-carburants.gouv.fr / IRVE data.gouv.fr) avec date. Négatifs : pas de mentions légales (obligation LCEN), pas de politique de confidentialité alors que Vercel Analytics + Sentry Replay tournent, pas de contact, **données de test en base** (« Adresse fictive de test »), README qui cite encore une autre source de données. |

Pondéré : 0,2×30 + 0,25×30 + 0,25×15 + 0,3×25 = **24,75**, arrondi à 25.

### Score AI-readiness (16/100)

| Critère | /20 | Note |
|---|---|---|
| Contenu textuel autonome et citable (passages de 40 à 150 mots) | 1 | Aucun paragraphe rédigé nulle part. |
| Chiffres + dates absolues visibles | 3 | Prix visibles sur les fiches, mais dates uniquement relatives (« il y a 3 h »). |
| Données structurées | 6 | GasStation + Offer + BreadcrumbList sur les fiches : bien. Absentes sur commune/stats. |
| Hiérarchie claire (H1 > H2 > H3) | 3 | Fiches : H1 puis directement des H3, pas de H2. Commune : pas de H1 côté serveur. |
| llms.txt / accessibilité aux crawlers IA | 3 | robots.txt autorise GPTBot/ClaudeBot/PerplexityBot. llms.txt : 404. La plupart des crawlers IA n'exécutent pas le JS, or commune/stats/accueil n'ont aucun contenu sans JS. |

---

## 1. Avertissement sur l'environnement de test (à corriger avant de refaire les tests)

- **Constat** : `/station/a039d174-…` et `/station/983de0e0-…` renvoient **404** sur `localhost:3002`.
- **Preuve** : `lsof` montre deux processus sur le port 3000 : `bun` (API ViaPlena, **IPv4 uniquement**) et `node` PID 65233 (**IPv6**, une autre app : `<title>Error Club - Dashboard</title>`). `.env.local` définit `NEXT_PUBLIC_API_URL=http://localhost:3000` ; côté serveur Node, `localhost` résout d'abord vers `::1`, donc vers l'autre app. Du coup `getPoiById` reçoit un 404 et `notFound()` est appelé. `curl http://127.0.0.1:3000/api/v1/poi/a039d174-…` renvoie bien la station.
- **Impact** : aucun en production, mais les tests SSR en local sont faussés.
- **Correctif** : `NEXT_PUBLIC_API_URL=http://127.0.0.1:3000` dans `.env.local`, ou libérer le port 3000 IPv6.
- Du coup, l'analyse des fiches station ci-dessous est **déduite du code** (`station-page-view.tsx`, `poi-sections.tsx`, `page.tsx`) croisé avec les JSON réels de l'API. La prod actuelle est une ancienne version (les UUID y renvoient 404) et ne permet pas de vérifier.

---

## 2. Contenu indexable réel (HTML serveur, sans JS)

Mesuré avec `curl` puis extraction du texte hors `<script>/<style>`.

| Page | HTTP | Mots visibles | H1 serveur | Title | Canonical | Contenu utile sans JS |
|---|---|---|---|---|---|---|
| `/` | 200 | **90** | « Comparateur de prix de carburants en France » (sr-only) | défaut | home | Libellés de filtres uniquement (« B7 Diesel », « 1 km 2 km 5 km »…), « Chargement de la carte... », « Command Palette / Search for a command to run... » (en anglais) |
| `/commune/75056` | 200 | **20** | **aucun** | défaut (identique à l'accueil) | **home** | « Retour à la carte » uniquement |
| `/stats` | 200 | **21** | « Couverture » | défaut (identique à l'accueil) | **home** | aucun chiffre |
| `/station/{gas}` | (200 attendu) | ~130 à 180 (estimé) | nom de la station (« Total ») | `Total : prix des carburants à Paris \| ViaPlena` | propre URL | prix, ruptures, horaires, services, adresse, note de source |
| `/station/{ev}` | (200 attendu) | ~120 à 200 (estimé) | nom de la station | `… : borne de recharge à Paris` | propre URL | points de charge groupés par puissance, paiement, infos, opérateur |
| `/llms.txt`, `/a-propos`, `/mentions-legales` | 404 | | | | | |

### C-01 : Pages commune et stats 100 % client-side, sans contenu ni metadata — CRITIQUE
- **Preuve** : `src/app/commune/[insee]/page.tsx` et `src/app/stats/page.tsx` commencent par `'use client'` et récupèrent les données avec des hooks React Query. Pas de `generateMetadata`. HTML serveur : 20 et 21 mots, `<title>` = celui de l'accueil.
- **Impact** : Google les indexe comme des pages vides en attendant le rendu JS (file de rendu différée). Les crawlers IA (GPTBot, ClaudeBot, PerplexityBot), qui n'exécutent pas le JS, ne voient rien. Soft-404 probable. Ce sont pourtant les pages qui correspondent aux requêtes à fort volume (« prix gazole Paris »).
- **Correctif** : Server Components + `generateMetadata` + ISR (`export const revalidate = 3600`). Récupérer les données côté serveur (`findPoisByCommune`, `getCommuneByInsee`, `getCoverageStats`) et ne garder en client que le bouton « Charger plus » et les filtres.

### C-02 : Canonical hérité de l'accueil sur commune et stats — CRITIQUE
- **Preuve** : `layout.tsx` déclare `alternates: { canonical: SITE_URL }`. Next hérite de cette valeur dans les segments enfants qui ne la redéfinissent pas. HTML : `/commune/75056` et `/stats` contiennent `<link rel="canonical" href="https://via-plena.zaphkiel.dev">`.
- **Impact** : on dit explicitement à Google que ces pages sont des doublons de l'accueil, donc elles ne seront pas indexées. Toute future page (département, carburant, guides) aura le même problème si elle n'override pas.
- **Correctif** : retirer `alternates.canonical` du layout racine et le mettre dans `app/page.tsx` (via un layout ou un `metadata` serveur, puisque la page est client). Chaque route définit ensuite son canonical dans `generateMetadata`.

### C-03 : Accueil = carte sans contenu éditorial, sans lien interne crawlable — HAUTE
- **Preuve** : 90 mots, un seul `<a href>` (GitHub). Le H1 est `sr-only`. Aucun lien vers une commune, une station, `/stats` ou un département. Les fiches ne sont accessibles qu'en JS (`station-detail.tsx:239`, depuis le panneau de détail). `/stats` n'est lié depuis nulle part (page orpheline).
- **Impact** : Googlebot ne découvre aucune des ~46 700 fiches ni des pages commune par crawl. Le sitemap ne contient que l'accueil (voir C-05). L'accueil ne cible que « carburant » (title, description, H1), alors que 79 % des POI sont des bornes (36 784 bornes EV contre 9 903 stations, source `/stats/coverage`).
- **Correctif** : sous la carte (ou dans un `<footer>` SSR), un bloc de contenu serveur d'environ 400 à 600 mots :
  1. un H2 « Prix moyens du jour en France » avec un tableau (Gazole, SP95, SP98, E10, E85, GPLc), la date absolue et le nombre de stations ;
  2. un H2 « Bornes de recharge » avec les chiffres de couverture et le top opérateurs ;
  3. les liens vers les 20 plus grandes villes et les 101 départements ;
  4. les liens vers les guides et la méthodologie.
  Mettre à jour title et description pour couvrir aussi les bornes, par exemple « ViaPlena : prix des carburants et bornes de recharge en temps réel ».

### C-04 : « Command Palette / Search for a command to run... » en anglais dans le HTML — BASSE
- **Preuve** : `src/components/ui/command.tsx:33-34`, valeurs par défaut shadcn, rendues dans le DOM de toutes les pages.
- **Correctif** : passer `title="Rechercher"` et `description="Rechercher une ville, une station…"` dans `search-command.tsx`.

### C-05 : Sitemap limité à l'accueil, avec un lastmod factice — HAUTE
- **Preuve** : `src/app/sitemap.ts` renvoie une seule URL, avec `lastModified: new Date()` recalculé à chaque requête.
- **Impact** : aucune découverte des fiches ni des communes. Un lastmod qui change en permanence n'est plus pris en compte par Google.
- **Correctif** : utiliser `generateSitemaps()` pour découper en `/sitemap/stations-gas.xml` (9 903), `/sitemap/stations-ev-{n}.xml` (morceaux de 45 000 max), `/sitemap/communes.xml` (uniquement celles au-dessus du seuil, voir §4), `departements.xml`, `carburants.xml` et `guides.xml`. Pour lastmod, prendre le `lastUpdate` réel du prix le plus récent ou le `lastModified` IRVE.

---

## 3. Fiches station : thin content et duplication

### C-06 : Titles et H1 dupliqués entre stations de même enseigne — HAUTE
- **Preuve** : dans Paris, sur 51 stations essence renvoyées par `/poi/by-commune/75056?type=gas_station` : 8 s'appellent « Total », 7 « Avia », 7 « TotalEnergies », 3 « Station Paris ». La logique `title = ${name}${brand} : prix des carburants à ${city}` retire la marque quand elle est déjà dans le nom, ce qui donne **8 pages titrées exactement « Total : prix des carburants à Paris | ViaPlena »** et un H1 « Total ». À l'échelle de la France (≈ 9 900 stations, quelques enseignes dominantes), des milliers de titles seront en collision.
- **Impact** : cannibalisation, snippets indistinguables, Google choisit une seule URL par cluster de doublons.
- **Correctif** : title = `{Enseigne} {voie normalisée}, {CP} {Ville}{arrondissement} : prix gazole, SP98… aujourd'hui`. Exemple : « Total 114 bd de l'Hôpital, Paris 13e : prix des carburants ». H1 = « Station Total, 114 boulevard de l'Hôpital (Paris 13e) ». Même logique pour les bornes : « Borne Bump rue de Lobau, Paris 4e : 233 points de charge ».

### C-07 : Fiches = données brutes sans texte contextualisé (thin content) — HAUTE
- **Preuve** : `GasSections` et `EvSections` n'affichent que des tuiles et des listes : prix, « Rupture », horaires, services. Aucune phrase. Environ 130 à 180 mots, dont la majorité est un gabarit identique (« Itinéraire Waze Plans Partager », « Prix des carburants », « Services », note de source). Le graphique d'historique (`PriceHistoryChart`) est rendu uniquement en client, donc absent du HTML. 8 stations parisiennes sur 51 n'ont **aucun service**.
- **Impact** : le ratio contenu unique / gabarit est faible, c'est le profil type de page « scaled content » dans les QRG 2025 (Lowest/Low si aucune valeur ajoutée par rapport à la source officielle). La valeur ajoutée réelle de ViaPlena (comparaison locale, historique, temps réel) existe dans les données mais n'apparaît pas dans le texte.
- **Correctif** : ajouter un bloc « En résumé » **généré à partir de comparaisons** (voir gabarit §6.1). Chaque phrase porte un chiffre propre à la station : rang dans la commune, écart à la médiane départementale, tendance sur 30 jours, station moins chère à moins de 2 km. Ajouter aussi un tableau HTML SSR de l'historique (7 derniers jours) sous le graphique, en fallback texte.

### C-08 : Dates uniquement relatives dans le texte visible — MOYENNE
- **Preuve** : `formatRelativeTime` (« Mis à jour il y a 3 h ») ; la date absolue n'est présente que dans `title=` et `dateTime=`.
- **Impact** : le HTML mis en cache par Google ou par une IA reste figé : « il y a 3 h » devient faux quelques heures après. Une IA ne peut pas citer une date. Le signal de fraîcheur est faible.
- **Correctif** : afficher les deux, par exemple « Prix relevés le 24/09/2026 à 16 h 08 (il y a 3 h) ». Ajouter `dateModified` au JSON-LD.

### C-09 : Adresses en MAJUSCULES abrégées (lisibilité) — BASSE
- **Preuve** : `"address":"114 BD DE L HOPITAL"` (flux gouv brut), affiché tel quel.
- **Correctif** : normaliser à l'ingestion ou au rendu (casse titre, BD → boulevard, AV → avenue, apostrophes : « 114 boulevard de l'Hôpital »). Cela améliore aussi le matching des requêtes locales.

### C-10 : Maillage des fiches : lien commune absent (essence) ou cassé (arrondissements) — HAUTE
- **Preuve** :
  - Stations essence : `inseeCode` est absent (0/51 à Paris), donc le fil d'Ariane affiche « Paris » en texte, sans lien, et le JSON-LD BreadcrumbList saute la commune.
  - Bornes : `inseeCode` = code **d'arrondissement** (`75104` pour Lobau). Or `/communes/75104` renvoie `NOT_FOUND`, donc `/commune/75104` affiche une page sans H1. Même chose pour Lyon (`69381` à `69389`) et Marseille.
  - Lyon : `/poi/by-commune/69123` ne remonte que 23 bornes (7 ≥ 50 kW), alors que l'arrondissement `69383` à lui seul en compte 5 ≥ 50 kW. La page « Lyon » est donc fortement incomplète.
- **Impact** : liens internes vers des pages quasi vides, données de ville fausses, précisément pour les requêtes les plus recherchées (Paris, Lyon, Marseille).
- **Correctif** : côté API, rattacher chaque POI à sa commune « parente » (arrondissement → 75056 / 69123 / 13055), en gardant l'arrondissement comme sous-niveau. Pour l'essence, déduire l'INSEE à partir du CP et des coordonnées. Le fil d'Ariane devient Accueil > Département > Commune (> Arrondissement) > Station, identique en HTML et en JSON-LD.

### C-11 : Données de test en production — HAUTE (Trust)
- **Preuve** : `/poi/by-commune/75056` contient « Station Paris Opera », `address: "Adresse fictive de test"`, CP `75000`, prix non arrondis (`1.8723660567149214`), `lastUpdate 2026-05-09`. Avec un Gazole à 1,718 €, elle serait **la station la moins chère de Paris** dans n'importe quel classement généré.
- **Impact** : une IA ou un utilisateur qui cite « la station la moins chère de Paris » tomberait sur une fausse station, ce qui ruine la confiance (le T de E-E-A-T pèse 30 %).
- **Correctif** : purger ces données. Ajouter une validation à l'ingestion (prix à 3 décimales max, CP valide, adresse non vide) et exclure des classements les prix dont `lastUpdate` a plus de 7 jours.

### C-12 : Hiérarchie de titres : H1 puis H3 directement — BASSE
- **Preuve** : `Section` rend un `<h3>` (`poi-sections.tsx:642`) ; il n'y a pas de H2 sur la fiche.
- **Correctif** : passer les sections en H2 (« Prix des carburants à la station Total… », « Horaires », « Services », « Historique des prix »). Avoir des titres descriptifs aide aussi l'extraction de passages par les IA.

---

## 4. Duplication à l'échelle et seuils d'indexation

Volumes (API `/stats/coverage`) : 9 903 stations essence, 36 784 bornes, 34 875 communes. La grande majorité des communes compte 0 ou 1 POI.

### C-13 : Absence de politique d'indexation pour les pages générées — HAUTE
- **Impact** : si l'on génère 34 875 pages commune ou 46 700 fiches sans seuil, on s'expose directement au motif « scaled content abuse » (spam policies de mars 2024). Pour les pages programmatiques, voir aussi le sous-skill `seo-programmatic`.
- **Correctif** : règles proposées.

| Page | Indexable si | Sinon |
|---|---|---|
| Fiche station essence | au moins 1 prix de moins de 7 jours ET adresse valide | `noindex, follow` + bandeau « prix non communiqués » |
| Fiche borne | `chargingPointCount ≥ 1` ET coordonnées valides (`isLonLatCorrect`) | `noindex, follow` |
| Commune | ≥ 3 POI (essence + bornes) OU ≥ 1 station essence avec prix | `noindex, follow` + lien vers le département ; ou canonical vers la page département |
| Commune × carburant | ≥ 3 stations avec ce carburant | ne pas générer |
| Bornes rapides × ville | ≥ 3 bornes ≥ 50 kW | ne pas générer |
| Département, carburant national | toujours | |

Il faut aussi éviter les regroupements quasi identiques. Exemple : les 233 points de charge de Bump Lobau sont une seule fiche (bien), mais il faut s'assurer que les stations IRVE en doublon (même adresse, même opérateur, `stationItineranceId` différents) sont fusionnées ou canonicalisées.

---

## 5. E-E-A-T : pages manquantes et signaux de confiance

### C-14 : Pas de mentions légales, confidentialité, contact ni à propos — CRITIQUE (légal + Trust)
- **Preuve** : `/mentions-legales`, `/a-propos` : 404. Aucun lien de pied de page. Seul signal : « Made with ❤️ by Zaphkiel » avec un lien GitHub.
- **Impact** : les mentions légales sont **obligatoires** en France (LCEN art. 6-III : éditeur, directeur de publication, hébergeur Vercel). La politique de confidentialité est obligatoire au titre du RGPD : Vercel Analytics tourne, **Sentry Replay** enregistre des sessions (bundle `@sentry-internal/replay` présent dans le HTML), et la géolocalisation est demandée dès l'arrivée sur la page. Côté QRG, un site YMYL-adjacent (dépenses du foyer) sans éditeur identifiable est classé au mieux « Low » en Trust.
- **Correctif** : créer ces pages, liées depuis un footer SSR présent partout.
  - `/a-propos` : qui (nom réel ou société, localisation, parcours de développeur), pourquoi, indépendance (pas d'affiliation avec les enseignes), modèle économique, liens (GitHub, LinkedIn).
  - `/methodologie` : sources (prix-carburants.gouv.fr, flux instantané v2 ; IRVE consolidé data.gouv.fr ; flux temps réel des opérateurs), fréquences réelles (le job `sync.gas` tourne à l'heure : 9 808 stations, 31 322 prix ajoutés au dernier passage ; statut IRVE toutes les N minutes), traitement des ruptures, calcul des moyennes et médianes, limites (prix déclaratifs, délais), licence Etalab 2.0 avec attribution.
  - `/mentions-legales`, `/confidentialite` (analytics, Sentry, géolocalisation non stockée ?), `/contact` (formulaire ou e-mail, plus un bouton « signaler un prix erroné » sur chaque fiche).
- JSON-LD `Organization` : ajouter `founder` (Person), `sameAs` (GitHub, LinkedIn), `contactPoint`, `email`. Ajouter un `Dataset` sur `/methodologie` ou `/stats`.

### C-15 : Attribution des sources incomplète hors fiches — MOYENNE
- **Preuve** : la note de source n'existe que sur la fiche station (`SourceNote`). Rien sur l'accueil, commune ou stats. `README.md` indique comme API « prix-carburants.2aaz.fr », ce qui est obsolète et incohérent avec l'API interne actuelle.
- **Impact** : la Licence Ouverte Etalab impose de mentionner la source et la date de dernière mise à jour. Pour la confiance, afficher la source est un signal fort pour un comparateur.
- **Correctif** : ajouter une ligne dans le footer SSR : « Données : prix-carburants.gouv.fr (Ministère de l'Économie) et fichier IRVE consolidé (data.gouv.fr), Licence Ouverte 2.0. Dernière synchronisation : 24/09/2026 16:00. » Mettre à jour le README.

### C-16 : Signaux Experience non exploités — MOYENNE
- La base contient un historique horaire (105 132 observations), ce qu'aucun concurrent grand public n'expose clairement. Un « Observatoire ViaPlena » (page mensuelle datée : « En septembre 2026, le gazole a coûté en moyenne X € en France, +Y % sur un mois ; le département le moins cher est… ») constitue du contenu original, citable et linkable (presse régionale), et donc un levier d'autorité.

---

## 6. Gabarits de contenu (texte généré à partir des données)

Principes anti-thin et anti-duplicate :
1. Chaque phrase contient au moins une donnée propre à l'entité (chiffre, rang, écart, nom voisin).
2. Plusieurs variantes de formulation sont choisies de façon **déterministe** (hash de l'id), pour que la page reste stable d'un crawl à l'autre.
3. Les phrases conditionnelles ne s'affichent que si la donnée existe : jamais de « Aucune information disponible » répété sur des milliers de pages.
4. Dates absolues partout.
5. Les comparaisons (rang, écart à la médiane, voisins) apportent la valeur ajoutée par rapport à la source officielle.

### 6.1 Fiche station essence : `/station/{slug}-{id}`

**Title** : `{Enseigne} {adresse courte}, {Ville} {arr.} : prix gazole {x,xxx} €, SP98…`
**Meta description** : `Prix relevés le {date} : Gazole {p1} €, E10 {p2} €… {Rang} station la moins chère de {Ville} pour le {carburant principal}. Horaires, services, itinéraire.`
**H1** : `Station {Enseigne} : {adresse normalisée}, {CP} {Ville}`

**Bloc « En résumé » (H2), 60 à 120 mots, SSR** :
> Le **{24 septembre 2026 à 16 h 08}**, la station {Total} du {114 boulevard de l'Hôpital (Paris 13e)} affichait le **gazole à {2,250} €/L**, soit **{0,15} € de moins** que la médiane des {39} stations de Paris ({2,398} €). Elle se classe **{8e} sur {39}** pour le gazole et **{1re ex aequo} pour le SP98** ({1,990} €). {Sur 30 jours, son prix du gazole a {baissé de 4 centimes}.} {Le SP95 et le GPLc n'y sont plus distribués (rupture définitive depuis le 28/10/2025).} {Station moins chère à proximité : Esso Express, 1,2 km, gazole à 2,199 €.}

**Sections H2** : Prix du jour (tableau HTML `<table>` : carburant, prix, date de relevé, écart à la médiane de la ville) · Évolution des prix sur 30 jours (graphique + tableau de 7 lignes en fallback) · Horaires (avec une phrase : « Ouverte 7 j/7, de 6 h à 22 h en semaine, 7 h à 22 h le week-end ») · Services ({n} services, liste) · Stations à proximité (5 liens internes avec leurs prix = maillage) · Source et fiabilité (date absolue, lien gouv, bouton « signaler une erreur »).

**Mini FAQ** (2 ou 3 questions, uniquement si les données existent ; pas de FAQPage rich result depuis 2023, mais utile pour les IA) :
- « La station Total du 114 bd de l'Hôpital est-elle ouverte le dimanche ? » : « Oui, de 7 h à 22 h. »
- « Quel est le prix du gazole à la station Total bd de l'Hôpital ? » : « 2,250 €/L au 24/09/2026 à 16 h 08. »

### 6.2 Fiche borne de recharge : `/borne/{slug}-{id}`

**Title** : `Borne {Opérateur} {rue}, {Ville} {arr.} : {n} points jusqu'à {P} kW ({prises})`
**H1** : `Borne de recharge {Opérateur} : {adresse}, {Ville}`

**Résumé** :
> La station de recharge **{Bump} du {4 rue de Lobau (Paris 4e)}** compte **{233} points de charge** dans un {parking privé à usage public}, accessible {24 h/24, 7 j/7}. Puissance maximale : **{22} kW** en {Type 2}, soit une **recharge {normale/accélérée}** : environ {x} h pour récupérer 100 km d'autonomie sur une citadine. {Réservation possible.} {Au {24/09/2026 à 21 h 30}, {187} points étaient disponibles.} {Pour une recharge rapide (≥ 50 kW), la borne la plus proche est {Ionity …} à {1,8 km}.} Données : fichier IRVE consolidé, mis à jour le {29/04/2026}.

**Sections H2** : Points de charge par puissance (tableau) · Prises compatibles (Type 2, CCS, CHAdeMO, liens vers les guides) · Tarifs et paiement · Accès et horaires · Disponibilité en temps réel (avec l'horodatage absolu) · Bornes à proximité (liens, filtrées par puissance supérieure).
Ajouter une phrase explicative variable selon la classe de puissance (≤ 7 kW, 7 à 22 kW, 50 à 150 kW, > 150 kW), en 4 variantes, pour éviter la répétition mot pour mot.

### 6.3 Page commune : `/prix-carburants/{ville}-{cp}` (plus `/bornes-recharge/{ville}-{cp}`)

Exemple avec les données réelles de Paris (hors station de test) :

**Title** : `Prix de l'essence et du gazole à Paris aujourd'hui : {51} stations comparées`
**H1** : `Prix des carburants à Paris ({date})`

> Au **24 septembre 2026**, ViaPlena compare **51 stations-service à Paris**, dont 39 publient un prix du gazole. Le **gazole** y coûte en moyenne **2,39 €/L** (médiane 2,398 €), de {1,99} € à 2,90 € : un plein de 50 L peut varier de **{45} €** d'une station à l'autre. Le **SP98** est à 2,32 € en moyenne (29 stations), l'**E10** à 2,16 € (31 stations). La station la moins chère pour l'E10 est {Station Paris, 3-5 avenue de la Porte d'Asnières (17e)} à 1,88 €. {8} stations proposent un automate 24 h/24. Paris est {x} % plus cher que la moyenne nationale du gazole (2,40 €).

**Sections H2** : Les 10 stations les moins chères par carburant (onglets SSR ou un tableau par carburant, avec liens vers les fiches) · Prix par arrondissement (tableau) · Évolution sur 30 jours (moyenne commune vs département vs France) · Stations ouvertes 24 h/24 · Bornes de recharge à Paris ({n} stations, {m} rapides ≥ 50 kW, top opérateurs, avec lien vers la page bornes) · Communes voisines (liens) · FAQ locale (« Où trouver le gazole le moins cher à Paris ? », « Quelle station est ouverte la nuit à Paris ? ») · Source et date.

Variante « petite commune » (3 à 5 POI) : texte réduit mais comparatif (« La seule station de {Commune}, {Intermarché}, affiche le gazole à {x} €, soit {y} centimes de plus que la moyenne du {département}. La station la moins chère à moins de 10 km est… »).

### 6.4 Page département : `/departement/{code}-{slug}` (ex. `/departement/69-rhone`)

> Dans le **Rhône (69)**, {n} stations publient leurs prix au {date}. Le gazole y est en moyenne à **{x} €/L**, {au-dessus/en dessous} de la moyenne nationale ({2,40} €) et se classe **{k}e département le moins cher sur 96**. La commune la moins chère est {…}, la plus chère {…}. Le département compte {n} stations de recharge, dont {m} rapides ; premier opérateur : {…}.

Sections : tableau des communes (prix moyen par carburant, nombre de stations, liens) · top 10 stations les moins chères · évolution sur 90 jours (API `/prices/department/{code}?item=`) · bornes par commune · départements voisins.

### 6.5 Page carburant : `/carburant/{gazole|sp95-e10|sp98|e85|gpl}` (+ `/carburant/gazole/{departement}`)

> **Prix moyen du gazole en France le {24/09/2026}** : **2,398 €/L**, calculé sur {9 062} stations. Prix le plus bas relevé : {x} € ({ville}), le plus élevé : {y} €. Sur 30 jours : {+/-z} %. Le département le moins cher est {…}, le plus cher {…}.

Ensuite : un bloc éditorial permanent (300 à 500 mots, rédigé une seule fois et revu par une personne) : qu'est-ce que le B7, compatibilité des véhicules, pourquoi le prix varie (TICPE, cotation, marge), conseils d'achat. Puis le classement des départements (tableau des 96 départements, liens), l'historique sur 12 mois et une FAQ. C'est la page la plus citable par les IA (« prix moyen gazole aujourd'hui »).

### 6.6 Pages bornes : `/bornes-recharge/{ville}` et `/bornes-recharge-rapide/{ville}`
Intention « borne recharge rapide Lyon » : liste SSR des bornes ≥ 50 kW (**en incluant les arrondissements** 69381 à 69389, voir C-10), avec puissance, prises, opérateur, tarif, accès 24/7 et disponibilité temps réel horodatée ; un résumé chiffré (« Lyon compte {n} bornes rapides, dont {m} ≥ 150 kW ; opérateurs : … ») ; une carte ; les villes voisines.

### 6.7 Guides éditoriaux (rédigés par une personne, avec auteur signé)
- Comment payer moins cher son carburant (données ViaPlena à l'appui : écart moyen entre stations d'une même ville, jour de la semaine le moins cher calculé sur l'historique : **contenu original**).
- E10, E85, SP98 : quel carburant pour ma voiture ? / Boîtier E85 : est-ce rentable ? (calculateur).
- Types de prises (Type 2, CCS, CHAdeMO) et puissances : combien de temps pour recharger ?
- Coût d'une recharge publique vs à domicile.
- Stations ouvertes 24 h/24 : comment ça marche (automates, CB).
- Page FAQ générale et glossaire.

---

## 7. Couverture des intentions de recherche

| Requête | Page actuelle | Couverture | Page à créer |
|---|---|---|---|
| prix gazole Paris | `/commune/75056` (vide en SSR, canonical vers l'accueil) | 0 | `/prix-carburants/paris` + `/carburant/gazole/paris` |
| station essence la moins chère près de moi | accueil (carte JS, 90 mots) | 2/10 | Accueil avec bloc SSR + pages ville (Google localise la requête « près de moi » vers les pages locales) |
| borne recharge rapide Lyon | aucune (données Lyon incomplètes) | 0 | `/bornes-recharge-rapide/lyon` |
| prix moyen gazole aujourd'hui | aucune | 0 | `/carburant/gazole` |
| station Total bd de l'Hôpital | fiche station | 5/10 | title et H1 à désambiguïser (C-06) |
| E85 station Paris / GPL près de moi | aucune | 0 | pages commune × carburant (avec seuil) |
| borne Tesla/Ionity/Izivia {ville} | aucune | 0 | pages opérateur × ville (optionnel, avec seuil) |
| type de prise voiture électrique | aucune | 0 | guide |

---

## 8. AI-readiness : correctifs

### C-17 : llms.txt absent — MOYENNE
- **Preuve** : `/llms.txt` : 404 (local et prod).
- **Correctif** : route `app/llms.txt/route.ts` générée dynamiquement, par exemple :
```
# ViaPlena
> Comparateur indépendant des prix des carburants (9 900 stations) et des bornes de recharge (36 800 stations) en France, mis à jour toutes les heures à partir de prix-carburants.gouv.fr et du fichier IRVE consolidé (data.gouv.fr).

## Données du jour
- [Prix moyens nationaux par carburant](https://…/carburant): moyenne, min, max, date
- [Prix par département](https://…/departement)
- [Statistiques de couverture](https://…/stats)

## Méthodologie et éditeur
- [Méthodologie et sources](https://…/methodologie)
- [À propos](https://…/a-propos)

## Guides
- …
```
  Optionnel : `/llms-full.txt` avec le tableau des prix moyens du jour par carburant et par département, horodaté.

### C-18 : Aucun passage autonome citable — HAUTE
- Les gabarits §6 corrigent ce point. Chaque page doit avoir, juste sous le H1, **une phrase-réponse de 40 à 60 mots** avec entité + chiffre + unité + date absolue + source (« Le 24/09/2026, le gazole coûte en moyenne 2,398 €/L en France (9 062 stations, source prix-carburants.gouv.fr). »). C'est ce format que reprennent AI Overviews, ChatGPT Search et Perplexity.

### C-19 : Contenu invisible pour les crawlers IA (JS) — HAUTE
- GPTBot, ClaudeBot et PerplexityBot sont autorisés dans robots.txt, mais ils ne voient que 20 à 90 mots sur l'accueil, commune et stats. Correctif C-01 (SSR/ISR).
- robots.txt : les groupes `GPTBot`/`ClaudeBot`/`PerplexityBot` n'ont que `Allow: /`. Un groupe spécifique **remplace** le groupe `*`, donc `Disallow: /api/` ne s'applique plus à ces bots (mineur ici, l'API étant sur un autre hôte). Ajouter aussi `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Google-Extended` selon la politique souhaitée.

### C-20 : Données structurées à étendre — MOYENNE
- Fiches : ajouter `dateModified`, `telephone` (opérateur IRVE), `openingHoursSpecification` complet (actuellement seulement si 24/7), `amenityFeature` (services), `aggregateRating` non (pas d'avis). Pour les bornes, `AutomotiveBusiness` + `additionalProperty` (puissance, prises).
- Pages commune/département/carburant : `ItemList` des stations, `Dataset` (avec `temporalCoverage`, `license` Etalab, `isBasedOn` source gouv), `BreadcrumbList`.
- `Organization` : `sameAs`, `founder`, `contactPoint`.

---

## 9. Lisibilité

- Il n'y a quasiment pas de prose, donc un indice de Flesch n'a pas de sens aujourd'hui. Les libellés sont clairs et en français, sauf : « Command Palette » (anglais), « B7 Diesel », « E5+ Sans Plomb 98 », « LPG GPL carburant » (libellés techniques mélangés, doublon LPG/GPL), « Bornes EV » (préférer « bornes de recharge »), « Observations », « POI » (« Aucun POI dans cette commune » : jargon technique visible par l'utilisateur).
- Adresses en majuscules abrégées (C-09).
- Pour les futurs textes générés : phrases de 15 à 20 mots, un chiffre par phrase au maximum, unités explicites (€/L, kW), dates au format « 24 septembre 2026 ».

---

## 10. Fraîcheur

| Signal | État |
|---|---|
| Fréquence réelle de synchronisation | Bonne : `sync.gas` horaire (dernier passage le 24/09/2026 16:00, 9 808 stations, 0 erreur), statut IRVE fréquent |
| Date visible sur la fiche | Relative uniquement (C-08) |
| Date visible sur accueil/commune/stats | Aucune |
| `validFrom` sur les Offer JSON-LD | Oui (bien) |
| Sitemap lastmod | Factice (`new Date()`) |
| Agrégats historiques API | `/prices/national?item=Gazole` ne renvoie qu'un bucket au 09/05/2026 (et rien avec `from=2026-09-01`) : à vérifier avant de s'en servir pour les tendances affichées |
| Données obsolètes | Station de test avec `lastUpdate` au 09/05/2026 (C-11) : prévoir l'exclusion des prix de plus de 7 jours |

---

## 11. Signaux de contenu IA de faible qualité (QRG sept. 2025)

Aujourd'hui, pas de texte IA sur le site, donc pas de risque direct. **Le risque vient avec les gabarits** : 46 000 fiches et des milliers de pages ville avec un texte au même moule relèvent du « scaled content abuse » si :
- le texte paraphrase seulement les données déjà visibles (« Cette station propose du gazole à 2,25 € ») ;
- les phrases sont identiques d'une page à l'autre, hors variables ;
- des pages sont générées pour des entités sans données (communes à 0 POI).
Garde-fous : comparaisons chiffrées (rang, écarts, tendance, voisins), phrases conditionnelles, seuils d'indexation (§4), blocs éditoriaux permanents rédigés et signés par une personne sur les pages carburant et guides, audit périodique d'un échantillon de pages générées.

---

## 12. Plan d'action priorisé

| Priorité | Action | Constats |
|---|---|---|
| P0 | Canonical par page (retirer celui du layout) | C-02 |
| P0 | Commune/stats en SSR/ISR + generateMetadata | C-01 |
| P0 | Purger les données de test + validation à l'ingestion | C-11 |
| P0 | Mentions légales, confidentialité, contact, à propos, méthodologie + footer SSR avec sources | C-14, C-15 |
| P1 | Sitemaps segmentés + maillage interne depuis l'accueil (villes, départements) | C-03, C-05 |
| P1 | Rattachement arrondissements → commune ; INSEE pour l'essence ; fil d'Ariane complet | C-10 |
| P1 | Titles et H1 désambiguïsés + bloc résumé comparatif sur les fiches | C-06, C-07 |
| P1 | Seuils d'indexation | C-13 |
| P2 | Pages département, carburant, bornes rapides × ville | §6.4 à 6.6 |
| P2 | Dates absolues, H2, adresses normalisées, libellés FR | C-08, C-09, C-12, C-04 |
| P2 | llms.txt, JSON-LD étendu (Dataset, ItemList) | C-17, C-20 |
| P3 | Guides éditoriaux signés + Observatoire mensuel | §6.7, C-16 |

Fichiers concernés : `src/app/layout.tsx` (canonical, Organization), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/commune/[insee]/page.tsx`, `src/app/stats/page.tsx`, `src/app/station/[id]/page.tsx` (title, JSON-LD), `src/components/station/station-page-view.tsx` (résumé, H2, fil d'Ariane), `src/components/station/poi-sections.tsx` (`Section` en h2, dates absolues), `src/components/ui/command.tsx` / `src/components/shared/search-command.tsx` (libellés), `README.md` (source obsolète).
