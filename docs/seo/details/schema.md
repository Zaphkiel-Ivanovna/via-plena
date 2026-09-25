# Audit des données structurées (JSON-LD Schema.org) de ViaPlena

Date : 24/09/2026 · Périmètre : `/`, `/station/[id]` (essence + borne), `/commune/[insee]`, `/stats`
Sources : code (`src/app/layout.tsx`, `src/app/station/[id]/page.tsx`, `src/app/commune/[insee]/page.tsx`, `src/app/stats/page.tsx`, `src/lib/poi*.ts`), HTML servi par `http://localhost:3002`, API `http://127.0.0.1:3000/api/v1` + `/openapi.json`.

## Score global : 52/100

| Critère | Note | Commentaire |
|---|---|---|
| Validité syntaxique et format | 18/20 | `https://schema.org`, URLs absolues, dates ISO 8601, `<` échappé dans les fiches. Aucune erreur bloquante. |
| Couverture des pages | 7/20 | Accueil minimal. Fiches OK. Commune et stats : aucun JSON-LD (et pages 100 % client). |
| Complétude des propriétés | 9/20 | Pas d'`openingHoursSpecification` hors 24/7 (la majorité des stations essence). Pas de services, pas de prix unitaire au litre, pas de téléphone opérateur. |
| Exactitude et cohérence | 8/15 | `image` = logo générique. Fil d'Ariane des bornes vers une commune inexistante (soft 404). Carburants nommés en anglais ("Diesel"). `streetAddress` en doublon. |
| Graphe d'entités (@id, liens) | 3/10 | Aucun `@id` sur WebSite/Organization, pas de WebPage, pas de `publisher`/`mainEntity`. |
| Exploitation des rich results encore actifs | 7/15 | Breadcrumb OK (desktop). LocalBusiness présent mais incomplet. Pas de Dataset, pas d'ItemList commune. |

Une fois les recommandations implémentées, le score estimé est d'environ 88/100. Le reste dépend d'avis réels (aucun `aggregateRating` honnête n'est possible) et d'images par station.

---

## 0. Note d'environnement

Lors de la première extraction, les fiches `/station/*` renvoyaient 404. C'était un artefact local, pas un bug du site : un autre process Node écoutait sur `[::1]:3000` et Next résolvait `localhost` en IPv6 au lieu de joindre l'API bun (IPv4). Le serveur 3002 a été relancé avec `NEXT_PUBLIC_API_URL=http://127.0.0.1:3000`. Les deux fiches répondent 200 et les blocs ci-dessous ont été **ré-extraits du HTML réel**. Ils sont identiques à la reproduction faite à partir du code.

---

## 1. Détection (existant)

| Page | HTTP | Blocs JSON-LD | Types | Microdata / RDFa |
|---|---|---|---|---|
| `/` | 200 | 1 (tableau) | WebSite, Organization | aucun |
| `/station/a039d174…` (essence Total, Paris 13e) | 200 | 3 (layout + 2) | WebSite, Organization, GasStation, BreadcrumbList | aucun |
| `/station/983de0e0…` (borne Bump Lobau, 233 PdC) | 200 | 3 (layout + 2) | WebSite, Organization, AutomotiveBusiness, BreadcrumbList | aucun |
| `/commune/75056` | 200 | 1 (layout) | WebSite, Organization | aucun |
| `/stats` | 200 | 1 (layout) | WebSite, Organization | aucun |

Constats annexes qui impactent directement les données structurées :
- `/commune/*` et `/stats` sont des composants `'use client'`. Le HTML initial n'a ni données, ni `<title>` propre, ni h1 (pour la commune). Leur **canonical pointe vers l'accueil** (hérité de `alternates.canonical` du layout) : Google les traite comme des doublons de `/` et ignorera tout JSON-LD qu'on y placerait. Il faut les passer en Server Components avec `generateMetadata` avant d'ajouter du balisage.
- `/commune/xxxx` (INSEE invalide) renvoie 200 avec une page vide : soft 404.
- Le sitemap ne contient que `/` : aucune fiche station ni commune n'est découvrable par ce biais.
- Dans `station/[id]/page.tsx`, `openGraph` est redéfini sans `images` et remplace celui du layout. **Vérifié : aucune balise `og:image` sur les deux fiches.** Le canonical des fiches est correct.

## 2. Validation par bloc

### 2.1 WebSite (layout) : PASS avec réserves
- OK : `@context`, `name`, `url`, `inLanguage`.
- Manque : `@id`, `publisher` vers l'Organization, `alternateName` (utile pour le "site name" dans la SERP).
- `SearchAction` : **à ne pas ajouter**. Le sitelinks search box a été retiré par Google le 21/11/2024, et le site n'a pas d'URL de recherche crawlable (la recherche passe par une palette de commandes et `router.push`). Ce ne serait pertinent qu'avec une route `/recherche?q=`.

### 2.2 Organization (layout) : PASS avec réserves
- OK : `name`, `url`, `logo` absolu (480×480, au-dessus du minimum de 112 px).
- Manque : `@id`, `logo` en `ImageObject` (width/height), `sameAs`, `description`, `founder`.

### 2.3 GasStation (fiche essence) : PASS (valide), incomplet
Sortie actuelle (HTML réel) pour Total, 114 bd de l'Hôpital :
- **`image` = `/logo.png` (logo ViaPlena)** : trompeur, car ce n'est pas une image de la station. Google attend une image représentative de l'établissement. À remplacer par une image générée par station (`opengraph-image.tsx` : marque, prix, mini-carte) ou à retirer. Un logo générique partagé par environ 46 000 fiches est pire qu'une absence d'image.
- **`openingHours` absent** : la propriété n'est émise que si les 7 jours sont en 24/7. Or ici `scheduleSummary` vaut "Lundi06.00-22.00, Mardi08.00-22.00, …", est parfaitement exploitable et déjà parsé par `parseGasSchedule`. Il faut utiliser `openingHoursSpecification`, que Google préfère à la chaîne `openingHours`.
- **`makesOffer`** :
  - Une `Offer` sans `priceValidUntil` ni `itemCondition` **n'est pas une erreur ici**. Ces propriétés ne concernent que les rich results Product et les fiches marchand, auxquels un prix de carburant en station n'est pas éligible (pas de vente en ligne ni de livraison). Il ne faut pas inventer de `priceValidUntil`, car le prix change à tout moment, et `itemCondition` n'a pas de sens pour un carburant.
  - En revanche, il manque l'**unité** (2,25 € *par litre*). Ajouter `priceSpecification` : `UnitPriceSpecification` avec `unitCode: "LTR"`, `referenceQuantity` de 1 L et `valueAddedTaxIncluded: true`.
  - Il manque `availability` : InStock, et OutOfStock pour les ruptures temporaires (`fuelOutages[type=temporaire]`).
  - `itemOffered.name` vaut "Diesel" ou "Superéthanol", en anglais, alors que la page est en français et affiche "Gazole". Utiliser le nom français et un `alternateName` (B7, E10…).
  - Risque : un `Product` imbriqué peut être signalé dans la Search Console ("Extraits de produits : offers, review ou aggregateRating requis"). Ici, le Product est l'`itemOffered` d'une Offer : il faut le valider dans le Rich Results Test. Si GSC remonte des erreurs critiques, remplacer `"@type": "Product"` par `"@type": "Thing"` avec `"additionalType": "https://schema.org/Product"` dans `fuelProduct()`.
- **Services absents** : `data.services` (8 services pour cette station) n'est pas exploité. À ajouter en `amenityFeature` (`LocationFeatureSpecification`).
- `name` = "Total" : correct pour une LocalBusiness (nom commercial), mais peu distinctif. La marque vient telle quelle du flux source.
- `streetAddress` en majuscules ("114 BD DE L HOPITAL") : valide, c'est la donnée brute du flux public. Une normalisation de la casse est optionnelle.
- Pas de `telephone` : la donnée n'existe pas dans le flux essence, il n'y a rien à faire.

### 2.4 AutomotiveBusiness (fiche borne) : PASS (valide), sémantique approximative
- **Existe-t-il un meilleur type ?** Non. Schema.org n'a toujours **aucun type dédié à la recharge VE**, ni dans le core ni dans `pending` : pas de `ChargingStation` ni d'`EVChargingStation`. Des propositions ont été discutées sur le GitHub de schema.org sans être intégrées (à revérifier sur schema.org avant l'implémentation). Il ne faut **pas** utiliser `GasStation`, qui serait faux. La meilleure option standard :
  - conserver `@type: "AutomotiveBusiness"` et ajouter `additionalType: "https://www.wikidata.org/wiki/Q2140665"` (entité Wikidata "charging station", identifiant à vérifier) ;
  - décrire les caractéristiques en `amenityFeature` : nombre de points de charge, puissance max en `KWT`, nombre de points par type de prise, réservation, type d'implantation, PMR si connu ;
  - `publicAccess` (propriété de Place) depuis `accessCondition`, et `isAccessibleForFree` si tous les points sont gratuits ;
  - `openingHoursSpecification` 24/7 à la place de la chaîne `openingHours` ;
  - `telephone` depuis `operatorPhone` (au format E.164), et `parentOrganization` pour l'opérateur (nom, email, téléphone) ;
  - `paymentAccepted` depuis `evPayment`, et `identifier` = `stationItineranceId` (identifiant national IRVE, précieux pour la désambiguïsation).
- Ne **pas** mettre la disponibilité temps réel (195/233 libres) dans le JSON-LD : c'est volatile, Google le met en cache, et la valeur serait donc fausse. Les `amenityFeature` statiques suffisent.
- `description` : OK.
- `streetAddress` = "4 Rue de Lobau 75004 Paris" : retirer le code postal et la ville, déjà portés par `postalCode` et `addressLocality`.

### 2.5 BreadcrumbList : PASS syntaxique, FAIL fonctionnel pour les bornes
- Essence : Accueil > Station (2 niveaux, car `data` ne fournit pas d'`inseeCode` pour les stations essence).
- Borne : Accueil > Paris > Station, mais l'item 2 pointe vers `/commune/75104`, un **code d'arrondissement**. `GET /communes/75104` renvoie `404 Commune not found` et la page `/commune/75104` renvoie un 200 vide (soft 404). Il faut mapper les arrondissements vers leur commune (751xx vers 75056, 6938x vers 69123, 132xx vers 13055), ce que fait `communeInsee()` au §6. Idéalement, l'API exposerait aussi `inseeCode` pour les stations essence.
- Note 2026 : depuis janvier 2025, Google n'affiche plus le fil d'Ariane dans les résultats **mobiles** (seul le domaine apparaît). Il reste affiché sur desktop et utile pour la compréhension de la structure du site.

## 3. Éligibilité réaliste aux rich results (septembre 2026)

| Balisage | Statut Google 2026 | Réalisme pour ViaPlena |
|---|---|---|
| BreadcrumbList | Actif (desktop uniquement depuis janvier 2025) | **Oui**, après correction |
| Organization (logo, knowledge panel) | Actif | **Oui** (logo, nom) |
| WebSite (site name) | Actif | **Oui** (`name` + `alternateName`) |
| Sitelinks search box (SearchAction) | **Retiré** (novembre 2024) | Non, ne pas ajouter |
| LocalBusiness / GasStation | Sert à la compréhension et au Knowledge Graph ; Google privilégie les données du propriétaire et de Google Business Profile | Faible pour un agrégateur : pas de rich result garanti, mais un bénéfice d'entité et de pertinence locale |
| Carrousel (ItemList de LocalBusiness), **bêta EEE** | Bêta lancée en 2024 pour les pages récapitulatives (lieux, produits, événements) dans l'EEE | **Opportunité** pour `/commune/[insee]` (la France est dans l'EEE). Vérifier les propriétés exigées sur la page Google "Carousels (beta)" (items avec `name`, `url`, `image`, `address`…) |
| Product snippets / fiches marchand | Actif | Non : carburant non vendu en ligne, aucun avis |
| SoftwareApplication / WebApplication | Actif, mais exige `aggregateRating` ou `review` en plus d'`offers` | Non sans avis réels. Le balisage reste utile pour l'entité |
| Dataset | Actif (Google Dataset Search) | **Oui** pour `/stats`, si la page est rendue côté serveur et indexable |
| FAQPage | **Restreint** depuis août 2023 aux sites gouvernementaux et de santé faisant autorité | **Non éligible**, déconseillé (le site n'a d'ailleurs aucune FAQ visible) |
| HowTo | **Retiré** (septembre 2023) | Ne pas utiliser |
| SpecialAnnouncement | **Déprécié** (31/07/2025) | Ne pas utiliser |
| Review / AggregateRating | Actif, mais les avis auto-attribués sur LocalBusiness/Organization sont exclus | Non : aucune donnée d'avis |

## 4. Opportunités manquantes (par priorité)

1. **P0** : `openingHoursSpecification` construit depuis `parseGasSchedule`. Cela couvre la majorité des stations essence, aujourd'hui sans horaires.
2. **P0** : corriger le fil d'Ariane des bornes (arrondissements) et supprimer `image` = logo.
3. **P0** : passer commune et stats en Server Components, avec metadata et canonical propres, avant tout balisage.
4. **P1** : un `@graph` relié par `@id` (WebSite, Organization, WebPage, entité principale).
5. **P1** : `amenityFeature` (services essence, caractéristiques des bornes), `UnitPriceSpecification` au litre, `availability`.
6. **P1** : `/commune/[insee]` en `CollectionPage` + `City` + `ItemList`, pour viser le carrousel bêta EEE.
7. **P2** : `/stats` en `Dataset` (Dataset Search) ; `WebApplication` sur l'accueil.
8. **P2** : une image par station (`app/station/[id]/opengraph-image.tsx`), réutilisée dans `image` et `og:image`.
9. **P2** : un sitemap des fiches et des communes. Sans lui, le balisage des fiches n'est découvert que via le maillage interne.

---

## 5. JSON-LD corrigés, prêts à l'emploi

Tous les blocs ci-dessous sont la **sortie réelle** du module TS du §6, exécuté sur les vraies réponses de l'API (le type-check `tsc` passe avec le `tsconfig` du projet). L'URL `image` suppose la création de `app/station/[id]/opengraph-image.tsx` ; sans ce fichier, ne pas passer `imageUrl`.

### 5.1 Layout (toutes les pages) : WebSite + Organization
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://via-plena.zaphkiel.dev/#website",
      "url": "https://via-plena.zaphkiel.dev",
      "name": "ViaPlena",
      "alternateName": [
        "Via Plena",
        "ViaPlena - Prix carburants et bornes de recharge"
      ],
      "description": "Comparez les prix des carburants en temps réel autour de vous. Trouvez la station-service la moins chère : Gazole, SP95, SP98, E10, E85, GPL.",
      "inLanguage": "fr-FR",
      "publisher": {
        "@id": "https://via-plena.zaphkiel.dev/#organization"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://via-plena.zaphkiel.dev/#organization",
      "name": "ViaPlena",
      "url": "https://via-plena.zaphkiel.dev",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://via-plena.zaphkiel.dev/#logo",
        "url": "https://via-plena.zaphkiel.dev/logo.png",
        "contentUrl": "https://via-plena.zaphkiel.dev/logo.png",
        "width": 480,
        "height": 480,
        "caption": "ViaPlena"
      },
      "image": {
        "@id": "https://via-plena.zaphkiel.dev/#logo"
      },
      "description": "Comparateur indépendant des prix des carburants et des bornes de recharge en France, à partir des données ouvertes publiques.",
      "founder": {
        "@type": "Person",
        "name": "Zaphkiel",
        "url": "https://github.com/Zaphkiel-Ivanovna"
      },
      "sameAs": [
        "https://github.com/Zaphkiel-Ivanovna"
      ],
      "areaServed": {
        "@type": "Country",
        "name": "France"
      }
    }
  ]
}
```

### 5.2 Accueil (`/`) : WebPage + WebApplication
Ni SearchAction ni aggregateRating (voir §3).
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://via-plena.zaphkiel.dev/#webpage",
      "url": "https://via-plena.zaphkiel.dev",
      "name": "ViaPlena - Trouvez les meilleurs prix de carburant",
      "description": "Comparez les prix des carburants en temps réel autour de vous. Trouvez la station-service la moins chère : Gazole, SP95, SP98, E10, E85, GPL.",
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@id": "https://via-plena.zaphkiel.dev/#website"
      },
      "about": {
        "@id": "https://via-plena.zaphkiel.dev/#webapp"
      },
      "mainEntity": {
        "@id": "https://via-plena.zaphkiel.dev/#webapp"
      }
    },
    {
      "@type": "WebApplication",
      "@id": "https://via-plena.zaphkiel.dev/#webapp",
      "name": "ViaPlena",
      "url": "https://via-plena.zaphkiel.dev",
      "description": "Carte interactive des stations-service et bornes de recharge en France : prix des carburants, horaires, services, disponibilité des points de charge et itinéraire.",
      "applicationCategory": "TravelApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript. Requires WebGL.",
      "inLanguage": "fr-FR",
      "isAccessibleForFree": true,
      "offers": {
        "@type": "Offer",
        "price": 0,
        "priceCurrency": "EUR"
      },
      "featureList": [
        "Prix des carburants en temps réel (Gazole, SP95, SP98, E10, E85, GPLc)",
        "Bornes de recharge et disponibilité des points de charge",
        "Horaires et services des stations",
        "Historique des prix",
        "Itinéraire vers la station"
      ],
      "publisher": {
        "@id": "https://via-plena.zaphkiel.dev/#organization"
      }
    }
  ]
}
```

### 5.3 Fiche station essence (Total, 114 bd de l'Hôpital)
Horaires regroupés depuis `scheduleSummary`, services en `amenityFeature`, prix au litre en `UnitPriceSpecification`.
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#webpage",
      "url": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01",
      "name": "Total",
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@id": "https://via-plena.zaphkiel.dev/#website"
      },
      "mainEntity": {
        "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#station"
      },
      "about": {
        "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#station"
      },
      "breadcrumb": {
        "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#breadcrumb"
      },
      "dateModified": "2026-09-24T14:08:40.000Z",
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01/opengraph-image"
      }
    },
    {
      "@type": "GasStation",
      "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#station",
      "name": "Total",
      "url": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01",
      "image": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01/opengraph-image",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "114 BD DE L HOPITAL",
        "addressLocality": "Paris",
        "postalCode": "75013",
        "addressRegion": "Île-de-France",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 48.835,
        "longitude": 2.358
      },
      "hasMap": "https://www.google.com/maps/search/?api=1&query=48.835,2.358",
      "brand": {
        "@type": "Brand",
        "name": "Total"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "https://schema.org/Monday",
            "https://schema.org/Wednesday",
            "https://schema.org/Thursday",
            "https://schema.org/Friday"
          ],
          "opens": "06:00",
          "closes": "22:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "https://schema.org/Tuesday",
          "opens": "08:00",
          "closes": "22:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "https://schema.org/Saturday",
            "https://schema.org/Sunday"
          ],
          "opens": "07:00",
          "closes": "22:00"
        }
      ],
      "amenityFeature": [
        {
          "@type": "LocationFeatureSpecification",
          "name": "Boutique alimentaire",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Boutique non alimentaire",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Station de gonflage",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Carburant additivé",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Lavage automatique",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Lavage manuel",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Vente de gaz domestique (Butane, Propane)",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Wifi",
          "value": true
        }
      ],
      "currenciesAccepted": "EUR",
      "makesOffer": [
        {
          "@type": "Offer",
          "name": "Gazole",
          "price": 2.25,
          "priceCurrency": "EUR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 2.25,
            "priceCurrency": "EUR",
            "unitCode": "LTR",
            "unitText": "L",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": 1,
              "unitCode": "LTR"
            },
            "valueAddedTaxIncluded": true,
            "validFrom": "2026-09-24T14:08:40+00:00"
          },
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-09-24T14:08:40+00:00",
          "itemOffered": {
            "@type": "Product",
            "name": "Gazole",
            "alternateName": "B7",
            "category": "Carburant"
          }
        },
        {
          "@type": "Offer",
          "name": "Sans Plomb 98",
          "price": 1.99,
          "priceCurrency": "EUR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 1.99,
            "priceCurrency": "EUR",
            "unitCode": "LTR",
            "unitText": "L",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": 1,
              "unitCode": "LTR"
            },
            "valueAddedTaxIncluded": true,
            "validFrom": "2026-09-24T14:08:40+00:00"
          },
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-09-24T14:08:40+00:00",
          "itemOffered": {
            "@type": "Product",
            "name": "Sans Plomb 98",
            "alternateName": "E5",
            "category": "Carburant"
          }
        },
        {
          "@type": "Offer",
          "name": "Sans Plomb 95-E10",
          "price": 1.99,
          "priceCurrency": "EUR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 1.99,
            "priceCurrency": "EUR",
            "unitCode": "LTR",
            "unitText": "L",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": 1,
              "unitCode": "LTR"
            },
            "valueAddedTaxIncluded": true,
            "validFrom": "2026-09-24T14:08:40+00:00"
          },
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-09-24T14:08:40+00:00",
          "itemOffered": {
            "@type": "Product",
            "name": "Sans Plomb 95-E10",
            "alternateName": "E10",
            "category": "Carburant"
          }
        },
        {
          "@type": "Offer",
          "name": "Superéthanol E85",
          "price": 0.919,
          "priceCurrency": "EUR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 0.919,
            "priceCurrency": "EUR",
            "unitCode": "LTR",
            "unitText": "L",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": 1,
              "unitCode": "LTR"
            },
            "valueAddedTaxIncluded": true,
            "validFrom": "2026-09-24T14:08:40+00:00"
          },
          "availability": "https://schema.org/InStock",
          "validFrom": "2026-09-24T14:08:40+00:00",
          "itemOffered": {
            "@type": "Product",
            "name": "Superéthanol E85",
            "alternateName": "E85",
            "category": "Carburant"
          }
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://via-plena.zaphkiel.dev"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Total",
          "item": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01"
        }
      ]
    }
  ]
}
```

### 5.4 Fiche borne (Bump, SAGS Paris Lobau)
`makesOffer` n'est émis que si un tarif exploitable existe (`evPricing`) ou si la recharge est gratuite. Ici, le seul tarif publié est un avertissement générique de plus de 80 caractères, donc aucune offre n'est émise. `containedInPlace` renvoie à la page commune corrigée (75056).
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#webpage",
      "url": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48",
      "name": "Bump - SAGS – Paris – Lobau",
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@id": "https://via-plena.zaphkiel.dev/#website"
      },
      "mainEntity": {
        "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#station"
      },
      "about": {
        "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#station"
      },
      "breadcrumb": {
        "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#breadcrumb"
      },
      "dateModified": "2026-04-29T16:53:28+00:00",
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "url": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48/opengraph-image"
      }
    },
    {
      "@type": "AutomotiveBusiness",
      "additionalType": "https://www.wikidata.org/wiki/Q2140665",
      "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#station",
      "name": "Bump - SAGS – Paris – Lobau",
      "url": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48",
      "image": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48/opengraph-image",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "4 Rue de Lobau",
        "addressLocality": "Paris",
        "postalCode": "75004",
        "addressRegion": "Île-de-France",
        "addressCountry": "FR"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 48.8564424,
        "longitude": 2.3538459
      },
      "hasMap": "https://www.google.com/maps/search/?api=1&query=48.8564424,2.3538459",
      "containedInPlace": {
        "@id": "https://via-plena.zaphkiel.dev/commune/75056#place"
      },
      "description": "Borne de recharge : 233 points de charge, jusqu’à 100 kW.",
      "brand": {
        "@type": "Brand",
        "name": "Bump"
      },
      "parentOrganization": {
        "@type": "Organization",
        "name": "Bump",
        "email": "help@bump-charge.com",
        "telephone": "+33176401280"
      },
      "telephone": "+33176401280",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "https://schema.org/Monday",
            "https://schema.org/Tuesday",
            "https://schema.org/Wednesday",
            "https://schema.org/Thursday",
            "https://schema.org/Friday",
            "https://schema.org/Saturday",
            "https://schema.org/Sunday"
          ],
          "opens": "00:00",
          "closes": "23:59"
        }
      ],
      "publicAccess": true,
      "paymentAccepted": "Paiement à l’acte, Badge / application",
      "amenityFeature": [
        {
          "@type": "LocationFeatureSpecification",
          "name": "Points de charge",
          "value": 233
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Puissance maximale",
          "value": 100,
          "unitCode": "KWT",
          "unitText": "kW"
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Prise Type 2",
          "value": 223,
          "unitText": "points de charge"
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Prise Autre",
          "value": 10,
          "unitText": "points de charge"
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Réservation possible",
          "value": true
        },
        {
          "@type": "LocationFeatureSpecification",
          "name": "Type d’implantation",
          "value": "Parking privé à usage public"
        }
      ],
      "identifier": {
        "@type": "PropertyValue",
        "propertyID": "id_station_itinerance",
        "value": "FRBMPP649747P"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://via-plena.zaphkiel.dev"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Paris",
          "item": "https://via-plena.zaphkiel.dev/commune/75056"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Bump - SAGS – Paris – Lobau",
          "item": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48"
        }
      ]
    }
  ]
}
```

### 5.5 Page commune (`/commune/75056`) : CollectionPage + City + ItemList + BreadcrumbList
L'exemple ne contient que 2 items. En production, lister la première page rendue côté serveur (par exemple 50 POI), avec `numberOfItems` = total si l'API le fournit. Pour viser le carrousel bêta EEE, remplacer les `ListItem` limités à `url` par un `item` complet : `{ "@type": "GasStation", "name", "url", "image", "address" }` (voir la doc Google "Carousels (beta)").
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://via-plena.zaphkiel.dev/commune/75056#webpage",
      "url": "https://via-plena.zaphkiel.dev/commune/75056",
      "name": "Stations-service et bornes de recharge à Paris",
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@id": "https://via-plena.zaphkiel.dev/#website"
      },
      "about": {
        "@id": "https://via-plena.zaphkiel.dev/commune/75056#place"
      },
      "mainEntity": {
        "@id": "https://via-plena.zaphkiel.dev/commune/75056#list"
      },
      "breadcrumb": {
        "@id": "https://via-plena.zaphkiel.dev/commune/75056#breadcrumb"
      }
    },
    {
      "@type": "City",
      "@id": "https://via-plena.zaphkiel.dev/commune/75056#place",
      "name": "Paris",
      "identifier": {
        "@type": "PropertyValue",
        "propertyID": "INSEE",
        "value": "75056"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Paris",
        "postalCode": "75001",
        "addressRegion": "Île-de-France",
        "addressCountry": "FR"
      },
      "containedInPlace": {
        "@type": "AdministrativeArea",
        "name": "Paris",
        "identifier": "75",
        "containedInPlace": {
          "@type": "AdministrativeArea",
          "name": "Île-de-France",
          "identifier": "11"
        }
      }
    },
    {
      "@type": "ItemList",
      "@id": "https://via-plena.zaphkiel.dev/commune/75056#list",
      "name": "Stations et bornes à Paris",
      "itemListOrder": "https://schema.org/ItemListUnordered",
      "numberOfItems": 2,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://via-plena.zaphkiel.dev/station/a039d174-8fe8-4343-a487-81690fd38c01",
          "name": "Total"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://via-plena.zaphkiel.dev/station/983de0e0-05d5-4c30-afc8-abdf7ea45d48",
          "name": "Bump - SAGS – Paris – Lobau"
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://via-plena.zaphkiel.dev/commune/75056#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://via-plena.zaphkiel.dev"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Paris",
          "item": "https://via-plena.zaphkiel.dev/commune/75056"
        }
      ]
    }
  ]
}
```

### 5.6 Page stats (`/stats`) : Dataset
`distribution` n'est ajoutée que si une URL publique (https) de l'API existe, jamais de placeholder. Les URL `isBasedOn` vers data.gouv.fr sont à vérifier (slugs), ou à remplacer par `https://www.data.gouv.fr/fr/datasets/<datagouvDatasetId>/`. Vérifier aussi que la Licence Ouverte Etalab 2.0 convient pour les données dérivées de ViaPlena. Note de qualité des données : `byRegion` contient "Provence-Alpes-Côte d’Azur" en double (apostrophes typographique et droite), à normaliser dans l'API.
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://via-plena.zaphkiel.dev/stats#webpage",
      "url": "https://via-plena.zaphkiel.dev/stats",
      "name": "Couverture des données ViaPlena",
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@id": "https://via-plena.zaphkiel.dev/#website"
      },
      "mainEntity": {
        "@id": "https://via-plena.zaphkiel.dev/stats#dataset"
      },
      "dateModified": "2026-09-24T19:00:00Z"
    },
    {
      "@type": "Dataset",
      "@id": "https://via-plena.zaphkiel.dev/stats#dataset",
      "name": "Stations-service, prix des carburants et bornes de recharge en France (ViaPlena)",
      "description": "Jeu de données consolidé par ViaPlena : 9 903 stations-service avec leurs prix de carburants, 36 784 stations de recharge pour véhicules électriques et 105 132 observations de prix, couvrant 34 875 communes françaises. Construit à partir des données ouvertes publiques (flux prix des carburants du ministère de l’Économie, fichier consolidé IRVE).",
      "url": "https://via-plena.zaphkiel.dev/stats",
      "inLanguage": "fr-FR",
      "keywords": [
        "prix carburant",
        "station-service",
        "borne de recharge",
        "IRVE",
        "France",
        "open data"
      ],
      "creator": {
        "@id": "https://via-plena.zaphkiel.dev/#organization"
      },
      "publisher": {
        "@id": "https://via-plena.zaphkiel.dev/#organization"
      },
      "license": "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
      "isAccessibleForFree": true,
      "isBasedOn": [
        "https://www.data.gouv.fr/fr/datasets/prix-des-carburants-en-france-flux-instantane-v2/",
        "https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/"
      ],
      "spatialCoverage": {
        "@type": "Place",
        "name": "France",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "FR"
        }
      },
      "dateModified": "2026-09-24T19:00:00Z",
      "variableMeasured": [
        {
          "@type": "PropertyValue",
          "name": "Prix du carburant",
          "unitText": "EUR/L"
        },
        {
          "@type": "PropertyValue",
          "name": "Puissance nominale du point de charge",
          "unitCode": "KWT"
        },
        {
          "@type": "PropertyValue",
          "name": "Disponibilité des points de charge"
        }
      ]
    }
  ]
}
```

### 5.7 FAQPage
Non recommandé. ViaPlena n'est ni un site gouvernemental ni un site de santé faisant autorité : aucun rich result FAQ n'est possible pour lui depuis août 2023, et le site n'a aucune FAQ visible. Si une FAQ utilisateur est ajoutée un jour, la rédiger en HTML sémantique (h2/h3 suivis des réponses). C'est ce contenu qu'exploitent la recherche et les LLM ; le balisage FAQPage n'apporte rien côté Google.

---

## 6. Code TS : `src/lib/structured-data.ts` (proposition)

Le module s'appuie sur le type `Poi` (`@/lib/poi`) et sur les helpers existants (`parseGasSchedule`, `chargingPoints`, `evPayment`, `evPricing`, `temporaryOutages`, `latestFuelUpdate`, `isAlwaysOpenEv`, `formatMinutes`). Le type-check passe.

```ts
/**
 * Proposition : src/lib/structured-data.ts
 * Builders JSON-LD Schema.org pour ViaPlena (serveur uniquement, pas de 'use client').
 */
import { FUEL_NAMES_ORDER } from '@/lib/constants'
import { isEv, isGas, type EvStationData, type GasStationData, type Poi } from '@/lib/poi'
import {
  PLUG_LABELS,
  chargingPoints,
  evPayment,
  evPricing,
  formatMinutes,
  formatPower,
  isAlwaysOpenEv,
  latestFuelUpdate,
  parseGasSchedule,
  temporaryOutages,
  type DaySchedule,
  type PlugKind,
} from '@/lib/poi-details'

export const SITE_URL = 'https://via-plena.zaphkiel.dev'
export const SITE_NAME = 'ViaPlena'
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const APP_ID = `${SITE_URL}/#webapp`

type Json = Record<string, unknown>

/** Sérialisation sûre pour <script type="application/ld+json">. */
export const jsonLdHtml = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, '\\u003c'),
})

const graph = (...nodes: (Json | null | undefined | false)[]) => ({
  '@context': 'https://schema.org',
  '@graph': nodes.filter(Boolean),
})

// ---------------------------------------------------------------------------
// Site-wide (layout.tsx)
// ---------------------------------------------------------------------------

export const SITE_DESCRIPTION =
  'Comparez les prix des carburants en temps réel autour de vous. Trouvez la station-service la moins chère : Gazole, SP95, SP98, E10, E85, GPL.'

export function siteGraph() {
  return graph(
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: ['Via Plena', 'ViaPlena - Prix carburants et bornes de recharge'],
      description: SITE_DESCRIPTION,
      inLanguage: 'fr-FR',
      publisher: { '@id': ORG_ID },
      // Pas de SearchAction : sitelinks search box retiré par Google (nov. 2024)
      // et aucune URL de recherche crawlable (/recherche?q=) n'existe.
    },
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#logo`,
        url: `${SITE_URL}/logo.png`,
        contentUrl: `${SITE_URL}/logo.png`,
        width: 480,
        height: 480,
        caption: SITE_NAME,
      },
      image: { '@id': `${SITE_URL}/#logo` },
      description:
        'Comparateur indépendant des prix des carburants et des bornes de recharge en France, à partir des données ouvertes publiques.',
      founder: { '@type': 'Person', name: 'Zaphkiel', url: 'https://github.com/Zaphkiel-Ivanovna' },
      sameAs: ['https://github.com/Zaphkiel-Ivanovna'],
      areaServed: { '@type': 'Country', name: 'France' },
    },
  )
}

/** Accueil uniquement (app/page.tsx). */
export function homeGraph() {
  return graph(
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: `${SITE_NAME} - Trouvez les meilleurs prix de carburant`,
      description: SITE_DESCRIPTION,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': APP_ID },
      mainEntity: { '@id': APP_ID },
    },
    {
      '@type': 'WebApplication',
      '@id': APP_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        'Carte interactive des stations-service et bornes de recharge en France : prix des carburants, horaires, services, disponibilité des points de charge et itinéraire.',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript. Requires WebGL.',
      inLanguage: 'fr-FR',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
      featureList: [
        'Prix des carburants en temps réel (Gazole, SP95, SP98, E10, E85, GPLc)',
        'Bornes de recharge et disponibilité des points de charge',
        'Horaires et services des stations',
        'Historique des prix',
        'Itinéraire vers la station',
      ],
      publisher: { '@id': ORG_ID },
      // PAS d'aggregateRating tant qu'il n'y a pas d'avis réels et visibles.
    },
  )
}

// ---------------------------------------------------------------------------
// Helpers POI
// ---------------------------------------------------------------------------

export const stationUrl = (p: Poi) => `${SITE_URL}/station/${p.id}`
export const cleanName = (p: Poi) => p.name.split(' | ').slice(-1)[0]

/** Retire "75004 Paris" / "France" déjà portés par postalCode/addressLocality. */
export function streetAddress(p: Poi): string {
  const escaped = p.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return p.address
    .replace(/,?\s*France$/i, '')
    .replace(new RegExp(`,?\\s*${p.postalCode}\\s*${escaped}\\s*$`, 'i'), '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Arrondissements (Paris/Lyon/Marseille) -> code de la commune, seul connu de /communes/:insee. */
export function communeInsee(insee: string | null | undefined): string | null {
  if (!insee) return null
  if (/^751(0[1-9]|1\d|20)$/.test(insee)) return '75056'
  if (/^6938[1-9]$/.test(insee)) return '69123'
  if (/^132(0[1-9]|1[0-6])$/.test(insee)) return '13055'
  return insee
}

const DAYS = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
  'https://schema.org/Sunday',
] as const

const ALWAYS_OPEN = [{ '@type': 'OpeningHoursSpecification', dayOfWeek: [...DAYS], opens: '00:00', closes: '23:59' }]

/** DaySchedule[] -> OpeningHoursSpecification[], jours aux horaires identiques regroupés. */
export function openingHoursSpecification(week: DaySchedule[]): Json[] {
  if (week.every((d) => d.allDay)) return ALWAYS_OPEN
  const groups = new Map<string, { days: string[]; opens: string; closes: string }>()
  for (const d of week) {
    const slots = d.allDay
      ? [{ opens: '00:00', closes: '23:59' }]
      : d.closed
        ? [{ opens: '00:00', closes: '00:00' }] // convention Google : fermé toute la journée
        : d.ranges.map((r) => ({ opens: formatMinutes(r.start), closes: formatMinutes(r.end) }))
    // closes < opens = passage de minuit (accepté par Google).
    for (const s of slots) {
      const key = `${s.opens}-${s.closes}`
      const g = groups.get(key) ?? { days: [], ...s }
      g.days.push(DAYS[d.index])
      groups.set(key, g)
    }
  }
  return [...groups.values()].map((g) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: g.days.length === 1 ? g.days[0] : g.days,
    opens: g.opens,
    closes: g.closes,
  }))
}

// ---------------------------------------------------------------------------
// Station essence
// ---------------------------------------------------------------------------

/** Libellés FR affichés sur la page (et non "Diesel"). */
const FUEL_LD: Record<string, { name: string; alternateName: string }> = {
  Gazole: { name: 'Gazole', alternateName: 'B7' },
  SP95: { name: 'Sans Plomb 95', alternateName: 'E5' },
  SP98: { name: 'Sans Plomb 98', alternateName: 'E5' },
  E10: { name: 'Sans Plomb 95-E10', alternateName: 'E10' },
  E85: { name: 'Superéthanol E85', alternateName: 'E85' },
  GPLc: { name: 'GPL carburant', alternateName: 'LPG' },
}

const fuelProduct = (code: string) => ({
  '@type': 'Product',
  name: FUEL_LD[code]?.name ?? code,
  alternateName: FUEL_LD[code]?.alternateName,
  category: 'Carburant',
})

function fuelOffers(data: GasStationData): Json[] {
  const order = (n: string) => FUEL_NAMES_ORDER.indexOf(n as never)
  const priced = data.fuels
    .filter((f): f is typeof f & { price: number } => f.price != null)
    .sort((a, b) => order(a.name) - order(b.name))
  const offers: Json[] = priced.map((f) => ({
    '@type': 'Offer',
    name: FUEL_LD[f.name]?.name ?? f.name,
    price: f.price,
    priceCurrency: 'EUR',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: f.price,
      priceCurrency: 'EUR',
      unitCode: 'LTR',
      unitText: 'L',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'LTR' },
      valueAddedTaxIncluded: true,
      ...(f.lastUpdate && { validFrom: f.lastUpdate }),
    },
    availability: 'https://schema.org/InStock',
    ...(f.lastUpdate && { validFrom: f.lastUpdate }),
    itemOffered: fuelProduct(f.name),
  }))
  // Ruptures temporaires : utiles et visibles sur la page. Les définitives = "non vendu" -> omises.
  for (const o of temporaryOutages(data)) {
    offers.push({
      '@type': 'Offer',
      name: FUEL_LD[o.name]?.name ?? o.name,
      availability: 'https://schema.org/OutOfStock',
      ...(o.since && { availabilityStarts: o.since }),
      itemOffered: fuelProduct(o.name),
    })
  }
  return offers
}

/** Services bruts du flux (libellés FR) -> amenityFeature. */
function serviceFeatures(services: string[]): Json[] {
  return [...new Set(services.map((s) => s.trim()).filter(Boolean))].map((s) => ({
    '@type': 'LocationFeatureSpecification',
    name: s,
    value: true,
  }))
}

const paymentFromServices = (services: string[]) =>
  services.some((s) => /automate|cb/i.test(s)) ? 'Carte bancaire, Espèces' : undefined

// ---------------------------------------------------------------------------
// Borne de recharge
// ---------------------------------------------------------------------------

const PLUG_FLAGS: [PlugKind, (cp: ReturnType<typeof chargingPoints>[number]) => boolean][] = [
  ['ccs', (cp) => cp.hasPlugTypeComboCcs],
  ['chademo', (cp) => cp.hasPlugTypeChademo],
  ['type2', (cp) => cp.hasPlugType2],
  ['ef', (cp) => cp.hasPlugTypeEf],
  ['other', (cp) => cp.hasPlugTypeOther],
]

const toE164 = (raw: string) => {
  const d = raw.replace(/^tel:/i, '').replace(/[^\d+]/g, '')
  if (/^0\d{9}$/.test(d)) return `+33${d.slice(1)}`
  return /^\+\d{8,15}$/.test(d) ? d : undefined
}

const isUnknown = (v: string | null | undefined) => !v || /^(inconnu|accessibilité inconnue|aucun)$/i.test(v.trim())

function evFeatures(data: EvStationData): Json[] {
  const points = chargingPoints(data)
  const count = data.chargingPointCount || points.length
  const maxPower = points.reduce((m, cp) => Math.max(m, cp.nominalPower), 0)
  const feat = (name: string, value: unknown, extra: Json = {}) => ({
    '@type': 'LocationFeatureSpecification',
    name,
    value,
    ...extra,
  })
  const out: Json[] = [feat('Points de charge', count)]
  if (maxPower) out.push(feat('Puissance maximale', maxPower, { unitCode: 'KWT', unitText: 'kW' }))
  for (const [kind, has] of PLUG_FLAGS) {
    const n = points.filter(has).length
    if (n) out.push(feat(`Prise ${PLUG_LABELS[kind]}`, n, { unitText: 'points de charge' }))
  }
  out.push(feat('Réservation possible', data.hasReservation))
  if (!isUnknown(data.stationType)) out.push(feat('Type d’implantation', data.stationType))
  if (!isUnknown(data.pmrAccessibility)) out.push(feat('Accessibilité PMR', data.pmrAccessibility))
  if (data.isTwoWheelerStation) out.push(feat('Réservée aux deux-roues', true))
  if (points.some((cp) => cp.hasCableT2Attached)) out.push(feat('Câble Type 2 attaché', true))
  return out
}

function evOffers(data: EvStationData): Json[] | undefined {
  const points = chargingPoints(data)
  const pay = evPayment(points)
  const pricing = evPricing(points)
  if (pay.free) return [{ '@type': 'Offer', name: 'Recharge', price: 0, priceCurrency: 'EUR' }]
  if (!pricing) return undefined
  return [
    {
      '@type': 'Offer',
      name: 'Recharge',
      ...(pricing.kind === 'link' ? { url: pricing.url } : { description: pricing.text }),
      itemOffered: { '@type': 'Service', name: 'Recharge de véhicule électrique' },
    },
  ]
}

// ---------------------------------------------------------------------------
// Fiche station (app/station/[id]/page.tsx)
// ---------------------------------------------------------------------------

export function stationGraph(p: Poi, opts: { imageUrl?: string } = {}) {
  const url = stationUrl(p)
  const name = cleanName(p)
  const stationId = `${url}#station`
  const insee = isEv(p) ? communeInsee(p.data.inseeCode) : null

  const address = {
    '@type': 'PostalAddress',
    streetAddress: streetAddress(p),
    addressLocality: p.city,
    postalCode: p.postalCode,
    addressRegion: p.region,
    addressCountry: 'FR',
  }
  const base: Json = {
    '@id': stationId,
    name,
    url,
    ...(opts.imageUrl && { image: opts.imageUrl }), // jamais le logo générique du site
    address,
    geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
    ...(insee && { containedInPlace: { '@id': `${SITE_URL}/commune/${insee}#place` } }),
  }

  let station: Json
  let dateModified: string | undefined

  if (isGas(p)) {
    const week = parseGasSchedule(p.data)
    const services = p.data.services ?? []
    const offers = fuelOffers(p.data)
    dateModified = latestFuelUpdate(p.data)?.toISOString()
    station = {
      '@type': 'GasStation',
      ...base,
      ...(p.data.brand && { brand: { '@type': 'Brand', name: p.data.brand } }),
      ...(week && { openingHoursSpecification: openingHoursSpecification(week) }),
      ...(services.length > 0 && { amenityFeature: serviceFeatures(services) }),
      ...(paymentFromServices(services) && { paymentAccepted: paymentFromServices(services) }),
      currenciesAccepted: 'EUR',
      ...(offers.length > 0 && { makesOffer: offers }),
    }
  } else if (isEv(p)) {
    const d = p.data
    const points = chargingPoints(d)
    const pay = evPayment(points)
    const maxPower = points.reduce((m, cp) => Math.max(m, cp.nominalPower), 0)
    const count = d.chargingPointCount || points.length
    const phone = toE164(d.operatorPhone ?? '')
    const payment = [pay.creditCard && 'Carte bancaire', pay.payPerUse && 'Paiement à l’acte', pay.other && 'Badge / application']
      .filter(Boolean)
      .join(', ')
    const offers = evOffers(d)
    dateModified = d.lastModified ?? undefined
    station = {
      // Aucun type EV dans schema.org (ni core ni pending) : AutomotiveBusiness + additionalType Wikidata.
      '@type': 'AutomotiveBusiness',
      additionalType: 'https://www.wikidata.org/wiki/Q2140665', // "charging station" - à vérifier
      ...base,
      description: `Borne de recharge : ${count} point${count > 1 ? 's' : ''} de charge${maxPower ? `, jusqu’à ${formatPower(maxPower)}` : ''}.`,
      ...((d.brandName || d.operatorName) && { brand: { '@type': 'Brand', name: d.brandName || d.operatorName } }),
      ...(d.operatorName && {
        parentOrganization: {
          '@type': 'Organization',
          name: d.operatorName,
          ...(d.operatorContact?.includes('@') && { email: d.operatorContact }),
          ...(phone && { telephone: phone }),
        },
      }),
      ...(phone && { telephone: phone }),
      ...(isAlwaysOpenEv(d) && { openingHoursSpecification: ALWAYS_OPEN }),
      publicAccess: /libre/i.test(d.accessCondition ?? ''),
      ...(pay.free && { isAccessibleForFree: true }),
      ...(payment && { paymentAccepted: payment }),
      amenityFeature: evFeatures(d),
      ...(offers && { makesOffer: offers }),
      ...(d.stationItineranceId && {
        identifier: { '@type': 'PropertyValue', propertyID: 'id_station_itinerance', value: d.stationItineranceId },
      }),
    }
  } else {
    station = { '@type': 'Place', ...base }
  }

  const crumbs = [
    { name: 'Accueil', item: SITE_URL },
    ...(insee ? [{ name: p.city, item: `${SITE_URL}/commune/${insee}` }] : []),
    { name, item: url },
  ]

  return graph(
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': WEBSITE_ID },
      mainEntity: { '@id': stationId },
      about: { '@id': stationId },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      ...(dateModified && { dateModified }),
      ...(opts.imageUrl && { primaryImageOfPage: { '@type': 'ImageObject', url: opts.imageUrl } }),
    },
    station,
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
    },
  )
}

// ---------------------------------------------------------------------------
// Page commune (app/commune/[insee]/page.tsx, à rendre côté serveur)
// ---------------------------------------------------------------------------

export interface CommuneLd {
  insee: string
  name: string
  postalCode: string
  departmentCode: string
  departmentName: string
  regionCode: string
  regionName: string
}

export function communeGraph(c: CommuneLd, pois: Poi[], opts: { total?: number } = {}) {
  const url = `${SITE_URL}/commune/${c.insee}`
  return graph(
    {
      '@type': 'CollectionPage',
      '@id': `${url}#webpage`,
      url,
      name: `Stations-service et bornes de recharge à ${c.name}`,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': `${url}#place` },
      mainEntity: { '@id': `${url}#list` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'City',
      '@id': `${url}#place`,
      name: c.name,
      identifier: { '@type': 'PropertyValue', propertyID: 'INSEE', value: c.insee },
      address: { '@type': 'PostalAddress', addressLocality: c.name, postalCode: c.postalCode, addressRegion: c.regionName, addressCountry: 'FR' },
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: c.departmentName,
        identifier: c.departmentCode,
        containedInPlace: { '@type': 'AdministrativeArea', name: c.regionName, identifier: c.regionCode },
      },
    },
    {
      '@type': 'ItemList',
      '@id': `${url}#list`,
      name: `Stations et bornes à ${c.name}`,
      itemListOrder: 'https://schema.org/ItemListUnordered',
      numberOfItems: opts.total ?? pois.length,
      itemListElement: pois.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        // Forme "summary page" : l'URL suffit, la fiche porte le détail (évite les doublons).
        url: stationUrl(p),
        name: cleanName(p),
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: c.name, item: url },
      ],
    },
  )
}

// ---------------------------------------------------------------------------
// Page stats (app/stats/page.tsx, à rendre côté serveur)
// ---------------------------------------------------------------------------

export interface CoverageLd {
  totals: { evStations: number; gasStations: number; poiPrices: number; communes: number }
}

export function statsGraph(stats: CoverageLd, opts: { dateModified: string; apiDocUrl?: string }) {
  const url = `${SITE_URL}/stats`
  return graph(
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Couverture des données ViaPlena',
      inLanguage: 'fr-FR',
      isPartOf: { '@id': WEBSITE_ID },
      mainEntity: { '@id': `${url}#dataset` },
      dateModified: opts.dateModified,
    },
    {
      '@type': 'Dataset',
      '@id': `${url}#dataset`,
      name: 'Stations-service, prix des carburants et bornes de recharge en France (ViaPlena)',
      description: `Jeu de données consolidé par ViaPlena : ${stats.totals.gasStations.toLocaleString('fr-FR')} stations-service avec leurs prix de carburants, ${stats.totals.evStations.toLocaleString('fr-FR')} stations de recharge pour véhicules électriques et ${stats.totals.poiPrices.toLocaleString('fr-FR')} observations de prix, couvrant ${stats.totals.communes.toLocaleString('fr-FR')} communes françaises. Construit à partir des données ouvertes publiques (flux prix des carburants du ministère de l’Économie, fichier consolidé IRVE).`,
      url,
      inLanguage: 'fr-FR',
      keywords: ['prix carburant', 'station-service', 'borne de recharge', 'IRVE', 'France', 'open data'],
      creator: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      license: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
      isAccessibleForFree: true,
      isBasedOn: [
        'https://www.data.gouv.fr/fr/datasets/prix-des-carburants-en-france-flux-instantane-v2/',
        'https://www.data.gouv.fr/fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/',
      ],
      spatialCoverage: { '@type': 'Place', name: 'France', address: { '@type': 'PostalAddress', addressCountry: 'FR' } },
      dateModified: opts.dateModified,
      variableMeasured: [
        { '@type': 'PropertyValue', name: 'Prix du carburant', unitText: 'EUR/L' },
        { '@type': 'PropertyValue', name: 'Puissance nominale du point de charge', unitCode: 'KWT' },
        { '@type': 'PropertyValue', name: 'Disponibilité des points de charge' },
      ],
      ...(opts.apiDocUrl && {
        distribution: {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: opts.apiDocUrl,
        },
      }),
    },
  )
}
```

### 6.1 Intégration

**`src/app/layout.tsx`** : remplacer le tableau inline par un seul bloc.
```tsx
import { jsonLdHtml, siteGraph } from '@/lib/structured-data'
// ...
<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(siteGraph())} />
```

**`src/app/page.tsx`** (accueil) :
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(homeGraph())} />
```

**`src/app/station/[id]/page.tsx`** : supprimer `buildPoiJsonLd`, `buildBreadcrumbJsonLd` et `openingHoursLd`, puis :
```tsx
import { jsonLdHtml, stationGraph } from '@/lib/structured-data'
// ...
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={jsonLdHtml(
    stationGraph(loaded.poi /*, { imageUrl: `${SITE_URL}/station/${loaded.poi.id}/opengraph-image` } */),
  )}
/>
```
Ajouter aussi `images` dans `openGraph` de `generateMetadata`, sinon `og:image` disparaît.

**`src/app/commune/[insee]/page.tsx`** : scinder en Server Component (fetch de `getCommuneByInsee` et de la 1re page de `findPoisByCommune`, `generateMetadata` avec un canonical `/commune/${insee}`, `notFound()` si la commune est inconnue) et un composant client pour le « Charger plus ». Initialiser la requête infinie avec `initialData`.
```tsx
export default async function CommunePage({ params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params
  const commune = await loadCommune(insee) // null -> notFound()
  if (!commune) notFound()
  const first = await loadFirstPois(insee) // Poi[]
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(communeGraph(commune, first))} />
      <CommunePageView commune={commune} initialPois={first} />
    </>
  )
}
```

**`src/app/stats/page.tsx`** : même logique (fetch serveur de `getCoverageStats`, `revalidate` d'une heure, canonical `/stats`) :
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={jsonLdHtml(statsGraph(stats, { dateModified: new Date().toISOString() }))}
/>
```

### 6.2 Validation après déploiement
1. Rich Results Test sur une fiche essence, une fiche borne, une commune et `/stats` : 0 erreur critique attendue (surveiller "Extraits de produits", voir §2.3).
2. Validateur schema.org (validator.schema.org) pour les types sans rich result (WebApplication, City, amenityFeature).
3. Search Console, rapports "Fil d'Ariane" et "Établissements locaux" à J+14.
