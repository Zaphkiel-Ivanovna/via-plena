# ViaPlena : étude de mots-clés et de concurrence SEO

Site : https://via-plena.zaphkiel.dev · Date de l'étude : 24/09/2026 · Marché : Google.fr, francophone

> **Avertissement sur les volumes.** Je n'avais accès ni à Semrush/Ahrefs ni à Google Keyword Planner. Les volumes sont des **estimations en ordre de grandeur** (Fort ≈ >50 k/mois, Moyen ≈ 5–50 k, Faible ≈ <5 k, Très faible ≈ <500). Je les ai déduits de la densité des SERP (nombre de sites programmatiques qui se battent sur la requête), des suggestions et questions associées, de la couverture presse et du contexte d'actualité. **À valider** dans Google Search Console (dès que le site a des impressions), Keyword Planner ou Semrush avant d'arbitrer.

---

## 0. Contexte à connaître (septembre 2026)

- **Crise des carburants en cours.** La guerre États-Unis/Israël contre l'Iran (depuis le 28/02/2026) et les tensions sur le détroit d'Ormuz ont fait monter le gazole à un record d'environ 2,41 €/L le 20/09/2026 ; le SP95-E10 dépasse son pic de 2022 ([buzzwebzine](https://www.buzzwebzine.fr/carburant-2026-hausse-rentree-detroit-ormuz/), [vie-publique](https://www.vie-publique.fr/questions-reponses/302722-hausse-2026-des-prix-de-lessence-quels-sont-les-effets), [franceinfo](https://www.franceinfo.fr/economie/transports/penurie-de-carburants/tableau-de-bord-prix-de-l-essence-et-du-gazole-ruptures-de-stock-cours-du-brent-suivez-en-temps-reel-la-situation-dans-les-stations-service-en-france_7997111.html)).
- **Pénuries.** Au 21/09/2026, 16 % des stations ont au moins un carburant en rupture, et environ 9 159 stations signalent une rupture le 22/09 ([CNews](https://www.cnews.fr/france/2026-09-21/crise-des-carburants-voici-la-carte-des-stations-service-en-rupture-totale-ou), [voituremalin](https://www.voituremalin.com/articles/penurie-de-carburant-les-cartes-a-consulter-pour-trouver-une-station-qui-a-encore-du-stock)). Les requêtes « pénurie carburant carte », « station rupture » et « prix gazole aujourd'hui » sont donc **exceptionnellement hautes** en ce moment. C'est une fenêtre à exploiter vite, mais ce pic retombera.
- **Conséquence.** Le marché « prix carburant » est **saturé de sites programmatiques récents** (supercarbu, prix-carburant.eu, alertfuel, iautos, essencemoinscher, prix-du-carburant.com, mon-carburant, carbuprix, indicepompe, monpleinpascher…), tous construits sur le même flux gouvernemental. Ce qui fera la différence, ce n'est pas la donnée brute mais **la qualité des pages, la fraîcheur, l'autorité et l'angle** (EV temps réel, rupture, historique).

### État actuel de ViaPlena (lu dans le code, sans rien modifier)
| Élément | Constat | Impact SEO |
|---|---|---|
| `src/app/sitemap.ts` | Ne contient que l'accueil | ~10 k fiches station et les pages commune ne sont pas découvertes |
| `src/app/commune/[insee]/page.tsx` | `'use client'`, données chargées côté client, pas de `generateMetadata` | Page vide pour Googlebot au premier rendu, sans title dédié : **non rankable en l'état** |
| `src/app/stats/page.tsx` | `'use client'`, pas de metadata | Même problème |
| `src/app/station/[id]/page.tsx` | SSR + `generateMetadata` + JSON-LD `GasStation`/`AutomotiveBusiness` : bonne base | L'URL est un UUID. Le title « {nom} : prix des carburants à {ville} » n'inclut ni prix ni marque en tête |
| Accueil | Title « ViaPlena - Trouvez les meilleurs prix de carburant ». La description ne parle pas des bornes | L'univers EV, pourtant différenciant, est absent du positionnement |
| URL commune | `/commune/{insee}` (code INSEE, illisible) | Pas de mot-clé dans l'URL |

---

## 1. Concurrence sur Google.fr

### 1.1 Carburant : acteurs historiques et « autorités »
| Site | Structure d'URLs | Pattern de title | Forces |
|---|---|---|---|
| **prix-carburants.gouv.fr** (officiel) | Formulaire, pas de pages ville/station indexables ; `/disponibilites-carburants`, `/rubrique/faq/` | « Prix des carburants en France, site gouvernemental » | Autorité maximale, source de la donnée, carte des ruptures. **Aucune page locale**, ce qui laisse la longue traîne aux tiers ([source](https://www.prix-carburants.gouv.fr/)) |
| **carbu.com** | `/france/prixmoyens`, `/index.php/autoroutes?highway=8_A` | « CARBU.COM - Evolution des prix moyens… » | Ancienneté, domaine fort, pages autoroute, historique des prix moyens ([source](https://carbu.com/france/prixmoyens)) |
| **zagaz.com** | `/prix-carburant.php?id_div=1076` (département), `/autoroute.php?id_a=23` (autoroute par sens) | « Prix du carburant : département Paris » | Communauté historique, pages autoroute **par sens de circulation** ([source](https://www.zagaz.com/autoroute.php?id_a=23)) |
| **mon-essence.fr / mon-essence.com** | `/villes/{ville}/{carburant}`, `/departements/{dept}`, `/marques`, `/stations-essence/{nom}` ; `/ville/36614-lyon?gtf=e85` | « Prix du E85 moins cher à Lyon (69) - Mon Essence » | Matrice ville × carburant complète, fil d'Ariane, avis, signalements de rupture, app ([source](https://www.mon-essence.com/villes/lyon/e85)) |
| **carburants.org** | `/prix-carburants/gironde.33/`, `/prix-carburants/alpes-maritimes.06/nice.kwPwgg/leclerc_…` | « CARBURANTS - Où trouver le carburant le moins cher dans la Gironde (33) ? » | Hiérarchie département › ville › station, slugs lisibles ([source](https://www.carburants.org/prix-carburants/gironde.33/)) |
| **essence-pas-cher.fr / essencepascher.fr** | `/e85/69/Lyon.php`, `/e85/lyon-5eme-arrondissement-69005` | « Station éthanol E85 à Lyon moins cher » | Carburant en premier dans l'URL, pages par arrondissement |

### 1.2 Carburant : programmatiques récents (2025-2026) qui dominent la longue traîne
| Site | URLs | Title | Ce qui les fait ranker |
|---|---|---|---|
| **supercarbu.fr** | `/prix-carburant/{ville}/`, `/prix-carburant/departement/33-gironde/`, `/guide/prix-carburant-septembre-2026/` | « Prix du carburant à Paris — Stations les moins chères — Septembre 2026 » | **Mois et année dans le title** (fraîcheur), villes proches, FAQ, guides d'actualité mensuels ([source](https://supercarbu.fr/prix-carburant/paris/)) |
| **prix-carburant.eu** | `/departement/gironde/33`, `/ville/{ville}/{code}`, `/carburant-gazole`, `/station/{ID}`, `/stations/e-leclerc`, `/evolution-prix-carburants-gironde-33`, `/prix-coutant`, `/bornes-electriques` | « Prix carburant Gironde (33) — Gazole 2,355 €/L \| Stations les moins chères » | **Prix dynamique dans le title** (CTR), classement du département parmi les 95, tendance sur 7 jours, part des enseignes, « Indice de tension », pages marque et prix coûtant ([source](https://prix-carburant.eu/departement/gironde/33)) |
| **iautos.fr / alertfuel.io / essencemoinscher.fr** | `/station-essence/{ville}`, `/station-essence/departement/33-gironde` | « Prix carburant Paris : Gazole dès 2,250 €/L » | Formule « Gazole dès X €/L » dans le title, blog de questions ([iautos](https://iautos.fr/station-essence/paris), [alertfuel](https://alertfuel.io/station-essence/paris), [essencemoinscher](https://essencemoinscher.fr/essence/paris)) |
| **prix-du-carburant.com** | `/departements/rhone/lyon/`, `/enseignes/e-leclerc/`, `/actualites/…` | « Prix carburant E.Leclerc aujourd'hui » | Pages enseigne et actualité ([source](https://prix-du-carburant.com/enseignes/e-leclerc/)) |
| **mon-carburant.com** | `/prix-carburants/enseigne/leclerc/`, `/prix-carburants/autoroute/a7/`, `/blog/prix-carburant-2026/` | « Prix carburant Autoroute A7 - Comparateur Mon Carburant » | Silos enseigne et autoroute ([source](https://mon-carburant.com/prix-carburants/autoroute/a7/)) |
| **indicepompe.fr / monpleinpascher.com / essence-moins-cher.fr** | `/autoroute/A7`, `/prix-essence/autoroute/a7`, `/stations-essence/service/automate-cb-24-24` | « Prix carburant Autoroute A7 — Diesel moy. 2,496 €/L » | Autoroute « aires vs sorties », pages **par service** (automate CB 24/24) ([indicepompe](https://indicepompe.fr/autoroute/A7), [essence-moins-cher](https://www.essence-moins-cher.fr/stations-essence/service/automate-cb-24-24)) |
| **stations-carburant.com** | `/e85-moins-cher-departement/rhone`, `/departement/gironde`, `/geolocaliser-stations` | « Trouver le e85 le moins cher dans le Rhône » | Matrice carburant × département ([source](https://www.stations-carburant.com/e85-moins-cher-departement/rhone)) |
| **fuel-compare.com / penurie-carburant.fr** | `/penuries`, `/carte-stations-fermees-temps-reel.php` | « Pénurie carburant France aujourd'hui — 2936 stations en rupture » | Profitent de la crise avec un compteur dynamique dans le title ([fuel-compare](https://fuel-compare.com/penuries)) |

Autres acteurs visibles : marques et médias (TotalEnergies, [France 3](https://france3-regions.franceinfo.fr/hauts-de-france/nord-0/lille/carte-prix-des-carburants-voici-ou-trouver-les-stations-service-les-moins-cheres-pres-de-chez-vous-3420560.html), Mappy, Coyote) et [cartecarburant.leclerc](https://www.cartecarburant.leclerc/stations-service), qui ranke sur « station Leclerc ».

### 1.3 Bornes de recharge (IRVE)
| Site | URLs | Forces |
|---|---|---|
| **Chargemap** | `/cities/lyon-FR`, `/map`, blog `/fr-fr/blog/articles/…` | Leader : communauté, avis, disponibilité, blog « bornes gratuites » qui ranke #1 ([source](https://chargemap.com/fr-fr/blog/articles/ou-trouver-des-bornes-de-recharge-gratuites-pres-de-chez-moi)). Pages ville légères, en partie derrière un paywall (HTTP 402 lors de ma lecture) |
| **Electromaps (Wallbox)** | `/en/…` | Couverture mondiale, filtres connecteur et puissance ([source](https://www.electromaps.com/en)) |
| **meilleurecharge.fr** | `/proche-de-moi`, `/ville/paris-75001`, `/departement/75`, `/operateur/ionity`, `/operateur/tesla-supercharger` | **Concurrent EV le plus proche en SEO** : titles « Recharge Ionity : prix 2026 dès 0,54 €/kWh », longues FAQ, silo opérateur. Mise sur le **prix réel au kWh**, peu sur la disponibilité ([source](https://www.meilleurecharge.fr/proche-de-moi)) |
| **Charge+ TotalEnergies, IZIVIA, Belib' (belib.paris), Bison Futé** | Cartes propriétaires | Marques et opérateurs, disponibilité propre à leur réseau ([Charge+](https://chargeplus.totalenergies.com/fr/map/), [Belib](https://belib.paris/en/find-a-charger), [Bison Futé](https://www.bison-fute.gouv.fr/recharge-electrique.html)) |
| **reseaurecharge.fr, voltwork.fr, guidebornederechargement.eu, bornes-recharge.net** | Pages « autour de moi » | Sites d'affiliation et d'installateurs, contenu faible ([voltwork](https://www.voltwork.fr/irve/carte-emplacement-bornes-de-recharge/)) |
| **Médias et énergéticiens** (Engie, La Centrale, L'argus, Automobile Propre, fiches-auto) | Articles | Dominent l'informationnel (prises, Tesla ouvert à tous, gratuité) ([L'argus](https://www.largus.fr/actualite-automobile/superchargeurs-tesla-ouverts-a-tous-carte-de-france-et-tarifs-10837398.html), [Automobile Propre](https://www.automobile-propre.com/dossiers/voiture-electrique-les-differents-types-de-prises/)) |

### 1.4 Concurrent hybride carburant + EV
- **stationsetrecharge.com** : carburant et 221 k points IRVE, pénuries (`/penuries`), prévision à 4 jours, pays frontaliers. C'est le **concurrent direct de positionnement**, mais sans matrice locale forte visible ([source](https://stationsetrecharge.com/)).
- **prix-carburant.eu** a une rubrique `/bornes-electriques`.
- **Aucun acteur** ne combine clairement **prix carburant officiels + disponibilité temps réel des bornes + historique par station** sur des pages locales indexables. C'est le créneau à prendre pour ViaPlena.

### 1.5 Ce qui fait ranker dans cette niche (synthèse)
1. **Matrice programmatique** ville × carburant, département, enseigne, autoroute et service, avec des URLs lisibles et un maillage dense (villes proches, communes du département).
2. **Title dynamique** avec le prix du jour (« Gazole dès 2,25 €/L ») et le mois/l'année, qui porte le CTR.
3. **Contenu data unique par page** : moyenne, min/max, écart en € sur un plein de 50 L, rang du département, tendance à 7 jours, part des enseignes.
4. **Fraîcheur** : « Mis à jour le … », pages rendues côté serveur avec revalidation courte.
5. **FAQ** par page pour les PAA, et **guides d'actualité** mensuels.

---

## 2. Mots-clés priorisés par cluster

Légende. Intention : **T** = transactionnelle/outil, **L** = locale, **I** = informationnelle. Volume (estimé) : Fort / Moyen / Faible / Très faible. Difficulté (estimée) : Élevée / Moyenne / Faible. Priorité : P1 (tout de suite) › P3.

### 2.1 Prix carburant générique
| Mot-clé | Int. | Vol. | Diff. | Page cible ViaPlena | Prio |
|---|---|---|---|---|---|
| prix carburant | T | Fort | Élevée | `/` | P2 (le gouv et les autorités tiennent le top 3) |
| prix essence | T | Fort | Élevée | `/` | P2 |
| prix gazole / prix gasoil | T | Fort | Élevée | `/carburant/gazole` | P1 |
| prix carburant aujourd'hui | T | Fort (pic crise) | Élevée | `/` + `/stats` | P1 |
| comparateur prix carburant | T | Moyen | Élevée | `/` | P2 |
| prix SP95-E10 / prix E10 | T | Moyen | Moyenne | `/carburant/sp95-e10` | P1 |
| prix SP98 | T | Moyen | Moyenne | `/carburant/sp98` | P1 |
| prix E85 / prix superéthanol | T | Moyen | Moyenne | `/carburant/e85` | P1 |
| prix GPL / GPLc | T | Faible | Faible | `/carburant/gplc` | P1 |
| carburant prix coûtant | T | Moyen | Moyenne | `/prix-coutant` (optionnel) | P3 |

### 2.2 « Station essence moins chère » et « près de moi »
| Mot-clé | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| station essence moins chère | T/L | Fort | Élevée | `/` (géolocalisation) | P1 |
| station essence près de moi / autour de moi | L | Fort | Élevée (pack local Google Maps) | `/` | P2 |
| essence moins chère près de moi | L | Moyen | Élevée | `/` | P1 |
| gazole moins cher près de moi | L | Moyen | Moyenne | `/carburant/gazole` (géoloc) | P1 |
| station essence ouverte 24h/24 près de moi | L | Moyen | Moyenne | `/stations/automate-24-24` | P1 |
| station essence ouverte dimanche / maintenant | L | Moyen | Moyenne | `/stations/ouvertes-maintenant` (horaires) | P2 |
| station essence avec lavage / gonflage / boutique | L | Faible | Faible | `/stations/service/{service}` | P3 |
| station essence rupture / pénurie carburant carte | T/L | **Fort (crise)** | Moyenne | `/penurie-carburant` | **P1 (urgent)** |

### 2.3 Carburant × ville (≈ 36 k communes, dont ~5 k avec station)
Modèle : `{carburant} {ville}`, `prix {carburant} {ville}`, `{carburant} moins cher {ville}`, `station essence {ville}`.
| Exemples | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| prix carburant Paris / station essence Paris | L | Moyen | Élevée | `/prix-carburant/paris-75056` | P1 |
| gazole Paris, gazole moins cher Paris | L | Faible-Moyen | Moyenne | `/prix-carburant/paris-75056/gazole` | P1 |
| E85 Lyon, prix E85 Lyon | L | Faible | Moyenne | `/prix-carburant/lyon-69123/e85` | P1 |
| station essence Marseille / Toulouse / Bordeaux / Nantes / Lille | L | Faible-Moyen | Moyenne | page commune | P1 (top 50 villes) |
| prix gazole {ville moyenne} (Angers, Brest, Nîmes…) | L | Faible | **Faible** | page commune × carburant | P1 (volume cumulé de longue traîne) |
| GPL {ville}, E85 {petite ville} | L | Très faible | **Faible** | page commune × carburant | P2 |
| prix carburant Lyon 3e / Paris 15e (arrondissements) | L | Faible | Faible | page arrondissement (code INSEE dédié) | P2 |

### 2.4 Carburant × département / région
| Exemples | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| prix carburant Gironde / prix carburant 33 | L | Faible-Moyen | Moyenne | `/prix-carburant/departement/33-gironde` | P1 |
| gazole moins cher Rhône, E85 moins cher Nord | L | Faible | Faible-Moyenne | `/prix-carburant/departement/69-rhone/gazole` | P2 |
| département le moins cher carburant / classement | I | Faible | Faible | `/stats/departements` | P1 (angle data) |
| prix carburant Corse / Bretagne (région) | L | Faible | Faible | `/prix-carburant/region/{slug}` | P3 |

### 2.5 Marques et enseignes
| Mot-clé | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| prix carburant Leclerc (aujourd'hui) | T | Fort | Élevée (leclerc.fr, cartecarburant.leclerc) | `/enseigne/e-leclerc` | P1 |
| prix carburant Carrefour / Carrefour Market | T | Moyen | Moyenne | `/enseigne/carrefour` | P1 |
| prix carburant Intermarché | T | Moyen | Moyenne | `/enseigne/intermarche` | P1 |
| prix carburant Auchan / Super U / Système U | T | Moyen | Moyenne | `/enseigne/auchan`, `/enseigne/super-u` | P1 |
| prix carburant Total / TotalEnergies (prix plafonné) | T | Moyen-Fort | Élevée (totalenergies.fr) | `/enseigne/totalenergies` | P2 |
| station Leclerc {ville} / Intermarché {ville} | L | Faible (×milliers) | Faible | `/enseigne/e-leclerc/{ville}` ou filtre de page commune | P2 |
| Leclerc ou Total moins cher / comparatif enseignes | I | Faible | Faible | `/stats/enseignes` + article | P2 |

### 2.6 Autoroute
| Mot-clé | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| prix carburant autoroute | T/I | Moyen | Moyenne | `/autoroute` | P2 |
| prix carburant A7 / A6 / A10 / A9 / A1 | L | Faible (saisonnier, pics de départs) | Moyenne | `/autoroute/a7` | P2 |
| station essence aire {nom} (ex. aire de Lançon) | L | Très faible | Faible | fiche station | P3 |
| borne de recharge autoroute A7 | L | Faible | Faible | `/autoroute/a7/bornes` | P2 (angle mixte) |

Note : l'appartenance à une autoroute se déduit de l'attribut `pop="A"` du flux officiel et de l'adresse (« Aire de… », « A7 »).

### 2.7 Bornes de recharge
| Mot-clé | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| borne de recharge près de moi / autour de moi | L | Fort | Élevée (Chargemap, Google Maps) | `/bornes-recharge` (carte EV) | P1 |
| borne de recharge gratuite (près de moi) | L/I | Moyen-Fort | Moyenne | `/bornes-recharge/gratuites` + `/{ville}` | **P1** (la donnée IRVE `gratuit` est rare dans les SERP) |
| borne de recharge {ville} | L | Moyen (cumulé) | Moyenne | `/bornes-recharge/lyon-69123` | P1 |
| borne recharge rapide {ville} | L | Faible-Moyen | **Faible** | `/bornes-recharge/lyon-69123/rapide` (≥ 50 kW) | P1 |
| superchargeur / borne ultra rapide {ville} | L | Faible | Faible | idem, filtre ≥ 150 kW | P2 |
| borne recharge disponible maintenant / borne libre | T/L | Faible (en croissance) | **Faible** | `/bornes-recharge/disponibles` | **P1 (différenciant)** |
| borne CCS / Combo {ville}, borne Type 2 {ville} | L | Faible | Faible | `/bornes-recharge/{ville}/ccs` | P2 |
| borne recharge CHAdeMO (Nissan Leaf) | L/I | Faible | Faible | `/bornes-recharge/chademo` | P3 |
| Ionity {ville} / borne Ionity | L | Faible-Moyen | Moyenne | `/bornes-recharge/operateur/ionity` | P2 |
| superchargeur Tesla ouvert à tous | I | Moyen | Moyenne | article + `/operateur/tesla` | P2 |
| Belib Paris / borne Belib disponible | L | Moyen (Paris) | Moyenne (belib.paris) | `/bornes-recharge/paris-75056/belib` | P2 |
| borne recharge supermarché gratuite (Carrefour, Lidl, Leclerc) | I/L | Moyen | Faible-Moyenne | article + filtre | P2 |
| borne recharge hors service (signaler) | I | Très faible | Faible | fiche borne | P3 |

### 2.8 Questions informationnelles (PAA et articles)
| Mot-clé / question | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| prix moyen gazole aujourd'hui | I | Fort (crise) | Moyenne | `/stats` (moyenne nationale du jour) | **P1** |
| pourquoi le prix du carburant augmente / baisse | I | Moyen-Fort | Élevée (médias) | article d'actualité + graphique maison | P1 |
| évolution prix carburant 2026 / historique | I | Moyen | Moyenne | `/stats/historique` | P1 |
| E10 ou SP95 / différence E10 SP95 | I | Moyen | Moyenne | guide | P1 |
| ma voiture est-elle compatible E10 / E85 | I | Moyen | Moyenne | guide | P2 |
| boîtier E85 prix / rentable | I | Moyen | Moyenne | guide + calculateur | P2 |
| quel jour le carburant est le moins cher | I | Faible-Moyen | Faible | article appuyé sur l'historique ViaPlena (data propriétaire) | **P1** |
| à quelle heure les prix changent en station | I | Faible | Faible | idem | P2 |
| différence prise Type 2 / CCS | I | Moyen | Moyenne | guide | P2 |
| combien coûte une recharge sur borne publique / prix kWh | I | Moyen | Moyenne | guide | P2 |
| combien de temps pour recharger une voiture électrique | I | Moyen | Élevée | guide | P3 |
| que faire en cas de pénurie de carburant | I | Moyen (crise) | Faible | article + `/penurie-carburant` | P1 |

### 2.9 Longue traîne « temps réel »
| Mot-clé | Int. | Vol. | Diff. | Page cible | Prio |
|---|---|---|---|---|---|
| borne libre maintenant {ville} | T/L | Très faible × N | **Très faible** | `/bornes-recharge/{ville}/disponibles` | P1 |
| borne recharge disponible en temps réel {ville} | L | Faible | Faible | idem | P1 |
| station essence avec du gazole maintenant / station non en rupture {ville} | L | Moyen (crise) | Faible | `/penurie-carburant/{dept}` | P1 |
| prix gazole en temps réel {ville} | L | Faible | Faible-Moyenne | page commune | P2 |
| borne rapide libre autoroute | L | Très faible | Très faible | `/autoroute/{a}/bornes` | P3 |

---

## 3. Angles différenciants et opportunités de faible concurrence

### 3.1 Angles propres à ViaPlena
1. **Disponibilité temps réel des bornes (libre / occupée / hors service).** Chargemap et Electromaps l'affichent dans leurs apps, mais **presque aucune page web indexable** ne l'expose par ville (meilleurecharge mise sur le prix, stationsetrecharge ne met pas la disponibilité en avant). Intégrer le compteur au title, par exemple « 12 bornes libres », et à la page permet de capter « borne disponible maintenant {ville} » avec une difficulté très faible.
2. **Carburant et électrique réunis sur la même page commune.** « Faire le plein ou recharger à {ville} » répond à la même intention locale pour tous les conducteurs et donne des pages plus riches, moins exposées au reproche de contenu mince que les pages carburant seules.
3. **Historique des prix par station et par zone.** Les concurrents montrent des moyennes départementales. Un historique **par station** et des analyses propriétaires (« quel jour est le moins cher à Lyon », « la station X a baissé de 8 cts en 7 jours ») constituent du contenu original, que les Google Discover et les IA génératives citent volontiers.
4. **Donnée « gratuit » de l'IRVE.** La requête « borne gratuite » est servie aujourd'hui par des articles génériques, alors que ViaPlena peut lister **les bornes gratuites réelles par ville**.
5. **Ruptures de stock.** Le flux officiel contient les ruptures. Une page `/penurie-carburant` avec une carte des stations **encore approvisionnées** vaut du P1 immédiat pendant la crise, puis restera une page evergreen « disponibilité carburant ».

### 3.2 Opportunités de faible concurrence (quick wins)
- `borne recharge rapide {ville moyenne}` (Angers, Tours, Dijon…) et `borne gratuite {ville}`.
- `borne libre / disponible maintenant {ville}`.
- `E85 {ville moyenne}` et `GPL {ville}` : faible volume, mais peu de pages de qualité.
- `station essence 24h/24 {ville}` et `automate CB {ville}` (services du flux).
- Classements data : « département le moins cher », « enseigne la moins chère ce mois-ci », « villes où le gazole est le moins cher ».
- `borne recharge autoroute A{n}` couplé aux stations carburant de la même autoroute.

### 3.3 À éviter ou à reporter
- Attaquer frontalement « prix carburant » ou « station essence près de moi » (pack local Google Maps et site gouvernemental) : l'autorité y viendra par la longue traîne.
- Générer ~36 k pages communes vides. Il vaut mieux **indexer seulement les communes qui ont au moins une station ou une borne** et mettre les autres en `noindex` (voir §4.3).

---

## 4. Recommandations on-page

### 4.1 Titles et meta descriptions (≤ 60 et ≤ 155 caractères, longueurs vérifiées avec des valeurs d'exemple)
Les éléments `{…}` sont dynamiques. Le title global a le template `%s | ViaPlena` : les titles ci-dessous sont **complets**, marque comprise. Il faut donc désactiver le template sur ces pages (`title.absolute`) ou retirer « | ViaPlena ».

| Page | Title | Meta description |
|---|---|---|
| **Accueil** | `Prix carburant & bornes de recharge en temps réel \| ViaPlena` (60) | `Comparez les prix des carburants de 10 000 stations et trouvez une borne de recharge libre près de vous. Données officielles, historique des prix, gratuit.` (155) |
| **Fiche station essence** | `{Marque} {Ville} : gazole {2,25} €, SP95-E10 {2,17} € \| ViaPlena` (ex. « Leclerc Vénissieux : gazole 2,25 €, E10 2,17 € », 47) | `Prix du jour chez {Marque} {adresse}, {Ville} : gazole {x} €, SP95-E10 {y} €. Historique des prix, horaires, services et itinéraire.` (~140) |
| **Fiche borne** | `Borne {Opérateur} {Ville} : {3}/{4} libres, {150} kW \| ViaPlena` (ex. « Borne Ionity Lyon : 3/4 libres, 350 kW », 43) | `Borne de recharge {Opérateur} à {Ville}, {adresse} : {4} points jusqu'à {150} kW ({CCS, Type 2}). Disponibilité en temps réel, tarif, horaires.` (~145) |
| **Page commune** | `Carburant et bornes {Ville} : gazole dès {2,21} € \| ViaPlena` (ex. Bordeaux, 59 ; retirer « \| ViaPlena » si le nom est long) | `{N} stations et {M} bornes à {Ville} ({CP}). Gazole dès {x} €, E10 dès {y} €, {K} bornes libres maintenant. Prix officiels mis à jour en continu.` (~150) |
| **Carburant × ville** | `Prix {gazole} {Ville} : dès {2,21} €/L ({mois} {année})` (ex. « Prix gazole Bordeaux : dès 2,21 €/L (sept. 2026) », 50) | `Station {gazole} la moins chère à {Ville} : {Marque} à {x} €/L. Prix moyen {y} €, écart de {z} € sur un plein de 50 L. {N} stations comparées.` (~145) |
| **Département** | `Prix carburant {Gironde} ({33}) : gazole dès {2,21} € \| ViaPlena` (58) | `Stations les moins chères en {Gironde} : gazole {x} €, E10 {y} €. Rang national {n}/95, tendance sur 7 jours, meilleures communes et bornes de recharge.` (~150) |
| **Stats nationales** | `Prix moyen du gazole aujourd'hui en France : {2,40} €/L` (54) | `Prix moyens nationaux du jour : gazole, SP95-E10, SP98, E85, GPLc. Évolution sur 30 jours et 1 an, classement des départements et des enseignes.` (~147) |
| **Pénurie (bonus)** | `Pénurie carburant : {N} stations en rupture aujourd'hui` (~52) | `Carte en temps réel des stations en rupture de gazole ou d'essence et de celles encore approvisionnées près de vous. Données officielles.` (~140) |
| **Bornes × ville (bonus)** | `Bornes de recharge {Ville} : {K} libres maintenant \| ViaPlena` (~55) | `{M} bornes à {Ville} dont {R} rapides et {G} gratuites. Disponibilité en temps réel (libre, occupée, hors service), puissance, prises CCS et Type 2.` (~150) |

Règles :
- Placer le mot-clé en tête, suivi d'un prix ou d'un compteur dynamique, qui fait monter le CTR.
- Tronquer proprement : si le nom de la station est long, retirer d'abord « | ViaPlena », puis les carburants secondaires.
- Prévoir un repli sans prix (« Prix gazole Bordeaux : stations les moins chères ») quand aucune donnée n'est disponible.
- Ajouter une ligne « Mis à jour le {date heure} » visible, avec `dateModified` en JSON-LD.

### 4.2 Structure d'URLs (slugs lisibles au lieu des UUID)
Principe : une hiérarchie courte, en minuscules, sans accents, avec le code INSEE ou postal en suffixe pour lever les homonymies (il existe plus de 30 « Saint-Martin »).

```
/                                             accueil (carte)
/prix-carburant/{ville}-{insee}               commune (carburant + lien bornes)  ex. /prix-carburant/lyon-69123
/prix-carburant/{ville}-{insee}/{carburant}   carburant × ville                   ex. /prix-carburant/lyon-69123/e85
/prix-carburant/departement/{code}-{slug}     département                         ex. /prix-carburant/departement/33-gironde
/prix-carburant/departement/{code}-{slug}/{carburant}
/prix-carburant/region/{slug}
/carburant/{gazole|sp95-e10|sp95|sp98|e85|gplc}   page nationale par carburant
/enseigne/{e-leclerc|carrefour|intermarche|auchan|super-u|totalenergies}
/autoroute/{a7}
/bornes-recharge/{ville}-{insee}              bornes × ville
/bornes-recharge/{ville}-{insee}/{rapide|gratuites|disponibles|ccs|type-2}
/bornes-recharge/operateur/{ionity|tesla|belib|izivia|electra}
/station/{slug-marque-ville}-{shortid}        ex. /station/leclerc-venissieux-rue-baudelaire-a1b2c3
/borne/{slug-operateur-ville}-{shortid}       ex. /borne/ionity-lyon-a9f3e1
/penurie-carburant  ·  /penurie-carburant/{departement}
/stats  ·  /stats/historique  ·  /stats/departements  ·  /stats/enseignes
/guides/{slug}
```

- **Fiches** : le slug descriptif et un identifiant court stable (6 à 8 caractères dérivés de l'UUID ou de l'id officiel prix-carburants/IRVE `id_pdc`) évitent les collisions et survivent aux changements de nom. Si le slug demandé ne correspond plus au slug canonique, répondre par une **301** vers l'URL canonique. Garder `/station/{uuid}` en 301 vers la nouvelle URL.
- **Séparer `/station` (essence) et `/borne` (EV)** : l'intention diffère et chaque type de page reçoit son propre schéma (`GasStation` / `ElectricVehicleChargingStation`, un type schema.org en attente, avec repli `AutomotiveBusiness`).
- **Commune** : remplacer `/commune/{insee}` par `/prix-carburant/{slug}-{insee}` avec une 301. Le code INSEE en suffixe garde la résolution API directe.
- Paramètres de filtre (`?rayon=`, `?tri=`) : `canonical` vers l'URL propre. Ne pas indexer les combinaisons de filtres.

### 4.3 Prérequis techniques (sans eux, les mots-clés ci-dessus ne rankeront pas)
1. **SSR/ISR pour les pages commune et stats** : les passer en Server Components avec `generateMetadata`, les données dans le HTML initial et un `revalidate` de 10 à 30 min. C'est la priorité n°1.
2. **Sitemaps segmentés** : `sitemap-stations.xml` (~10 k), `sitemap-bornes.xml`, `sitemap-communes.xml` (uniquement les communes ayant au moins une station ou une borne), `sitemap-departements.xml`, avec des `lastmod` réels.
3. **Contenu unique par page locale**, pour éviter le contenu mince : moyenne, min/max, écart sur un plein de 50 L, tendance à 7 jours tirée de l'historique, part des enseignes, villes voisines, nombre de bornes rapides, gratuites et libres, FAQ générée à partir des données.
4. **Maillage** : fil d'Ariane (France › Région › Département › Commune › Station) avec JSON-LD `BreadcrumbList` ; liens « villes proches », « autres carburants dans cette ville », « bornes à proximité » ; liens depuis les stats vers les départements.
5. **Schema** : `GasStation` avec `makesOffer`/`Offer` pour les prix, `openingHoursSpecification`, `FAQPage` sur les pages locales (les rich results FAQ sont limités, mais le balisage aide les IA), `Dataset` sur `/stats`.
6. **Indexation** : `noindex` pour les communes sans point, les stations fermées depuis plus de 90 jours et les combinaisons carburant × ville sans aucune station qui propose ce carburant.

---

## 5. Plan éditorial (15 contenus priorisés)

| # | Titre proposé | Mot-clé principal | Int. | Angle ViaPlena / données | Prio |
|---|---|---|---|---|---|
| 1 | Pénurie de carburant : carte des stations en rupture et approvisionnées (mise à jour en continu) | pénurie carburant carte | I/T | Flux des ruptures, compteur par département | **P1 immédiat** |
| 2 | Prix du carburant en {mois} 2026 : bilan, hausse et prévisions (série mensuelle) | prix carburant septembre 2026 | I | Graphiques issus de l'historique ViaPlena, classements du mois | P1 (récurrent) |
| 3 | Pourquoi le prix du carburant augmente (ou baisse) ? Brent, taxes, marges et délai de répercussion | pourquoi prix carburant augmente | I | Décomposition du prix et délai observé dans l'historique | P1 |
| 4 | Quel jour et à quelle heure faire le plein pour payer moins cher ? L'analyse de nos données | quel jour carburant moins cher | I | **Étude propriétaire** sur l'historique des stations (backlinks presse possibles) | P1 |
| 5 | Bornes de recharge gratuites : où les trouver ? Carte et liste par ville | borne de recharge gratuite | I/L | Donnée IRVE `gratuit`, liens vers les pages ville | P1 |
| 6 | E10 ou SP95 : quelle différence, quel est le moins cher et ma voiture est-elle compatible ? | E10 ou SP95 | I | Écart de prix moyen réel mesuré sur ViaPlena | P1 |
| 7 | Classement 2026 des départements où le carburant est le moins cher | département carburant moins cher | I | Classement live, page data à partager | P1 |
| 8 | Leclerc, Intermarché, Carrefour, Total : quelle enseigne est la moins chère ? | enseigne carburant moins chère | I | Moyennes par enseigne sur 30 jours | P2 |
| 9 | Prises de recharge : Type 2, CCS Combo, CHAdeMO, quelles différences ? | prise type 2 ccs différence | I | Liens vers les filtres de prise et les pages `/ccs` | P2 |
| 10 | Superchargeurs Tesla ouverts à toutes les voitures : carte, prix et mode d'emploi | superchargeur tesla ouvert à tous | I | Filtre opérateur Tesla, disponibilité | P2 |
| 11 | Trouver une borne de recharge libre maintenant : comment lire la disponibilité en temps réel | borne disponible temps réel | I/T | Explication des statuts libre/occupée/hors service et de la fiabilité | P2 |
| 12 | E85 : voitures compatibles, boîtier homologué, prix et rentabilité (calculateur) | boîtier E85 rentable | I | Calculateur fondé sur les prix E85/SP95 locaux | P2 |
| 13 | Carburant sur autoroute : combien plus cher ? Faire le plein aux sorties plutôt qu'aux aires | prix carburant autoroute | I | Écart autoroute / hors autoroute mesuré, pages A7, A6, A10 | P2 (avant les vacances) |
| 14 | Station essence ouverte 24h/24 : trouver un automate CB et éviter la pré-autorisation de 150 € | station essence 24h/24 | I/L | Service « automate 24/24 » du flux | P2 |
| 15 | Recharge publique : combien coûte un plein électrique en 2026 (Ionity, Tesla, Belib, supermarchés) ? | prix recharge borne publique kWh | I | Comparaison avec le coût d'un plein de gazole du jour (angle carburant + EV) | P3 |

Format : 1 200 à 2 000 mots, une réponse directe en 40 à 60 mots en tête (pour les PAA et les AI Overviews), des graphiques maison, une FAQ, une date de mise à jour et des liens vers les pages locales et les stats.

---

## 6. Feuille de route résumée
1. **Semaine 1 (fenêtre de crise)** : SSR des pages commune et stats, sitemaps segmentés, nouveaux titles et metas, page `/penurie-carburant`, article 1.
2. **Semaines 2 à 4** : nouvelles URLs slug + 301 depuis UUID et INSEE, pages département et carburant × ville (top 300 villes d'abord), pages bornes × ville (`/rapide`, `/gratuites`, `/disponibles`), articles 2 à 7.
3. **Mois 2 et 3** : pages enseigne, autoroute et opérateur EV, étude propriétaire « quel jour », relations presse sur les données, articles 8 à 15.
4. **Suivi** : Search Console (impressions par cluster), puis recalibrer les volumes estimés ici avec les données réelles.

---

## Sources
- https://www.prix-carburants.gouv.fr/
- https://carbu.com/france/prixmoyens · https://carbu.com/index.php/autoroutes?highway=8_A
- https://www.zagaz.com/prix-carburant.php?id_div=1076 · https://www.zagaz.com/autoroute.php?id_a=23
- https://www.mon-essence.com/villes/lyon/e85 · https://mon-essence.fr/ville/36614-lyon?q=&gtf=e85&sort_by=price
- https://supercarbu.fr/prix-carburant/paris/ · https://supercarbu.fr/prix-carburant/departement/33-gironde/ · https://supercarbu.fr/guide/prix-carburant-septembre-2026/
- https://prix-carburant.eu/departement/gironde/33 · https://prix-carburant.eu/stations/e-leclerc · https://prix-carburant.eu/statistiques-prix-carburants-france/ · https://prix-carburant.eu/article/sp95-vs-e10
- https://www.carburants.org/prix-carburants/gironde.33/
- https://iautos.fr/station-essence/paris · https://alertfuel.io/station-essence/paris · https://essencemoinscher.fr/essence/paris · https://essencemoinscher.fr/blog/quel-jour-faire-le-plein
- https://www.comparateur-prix-carburants.fr/prix-carburant/Paris · https://prix-carburants-info.fr/villes/69001/lyon-01/e85.html
- https://prix-du-carburant.com/enseignes/e-leclerc/ · https://prix-du-carburant.com/departements/rhone/lyon/
- https://mon-carburant.com/prix-carburants/enseigne/leclerc/ · https://mon-carburant.com/prix-carburants/autoroute/a7/
- https://indicepompe.fr/autoroute/A7 · https://www.monpleinpascher.com/autoroute/a7 · https://www.essence-moins-cher.fr/prix-essence/autoroute/a7
- https://www.stations-carburant.com/e85-moins-cher-departement/rhone · https://www.essence-pas-cher.fr/e85/69/Lyon.php
- https://www.essence-moins-cher.fr/stations-essence/service/automate-cb-24-24
- https://fuel-compare.com/penuries · https://stationsetrecharge.com/ · https://www.penurie-carburant.fr/carte-stations-fermees-temps-reel.php
- https://www.cnews.fr/france/2026-09-21/crise-des-carburants-voici-la-carte-des-stations-service-en-rupture-totale-ou
- https://www.voituremalin.com/articles/penurie-de-carburant-les-cartes-a-consulter-pour-trouver-une-station-qui-a-encore-du-stock
- https://www.franceinfo.fr/economie/transports/penurie-de-carburants/tableau-de-bord-prix-de-l-essence-et-du-gazole-ruptures-de-stock-cours-du-brent-suivez-en-temps-reel-la-situation-dans-les-stations-service-en-france_7997111.html
- https://www.buzzwebzine.fr/carburant-2026-hausse-rentree-detroit-ormuz/ · https://www.vie-publique.fr/questions-reponses/302722-hausse-2026-des-prix-de-lessence-quels-sont-les-effets
- https://chargemap.com/fr-fr/blog/articles/ou-trouver-des-bornes-de-recharge-gratuites-pres-de-chez-moi · https://chargemap.com/en-us/cities/lyon-FR
- https://www.electromaps.com/en · https://www.meilleurecharge.fr/proche-de-moi · https://www.meilleurecharge.fr/operateur/ionity · https://www.meilleurecharge.fr/operateur/tesla-supercharger
- https://chargeplus.totalenergies.com/fr/map/ · https://belib.paris/en/find-a-charger · https://opendata.paris.fr/explore/dataset/belib-points-de-recharge-pour-vehicules-electriques-disponibilite-temps-reel/
- https://www.bison-fute.gouv.fr/recharge-electrique.html · https://www.voltwork.fr/irve/carte-emplacement-bornes-de-recharge/
- https://www.largus.fr/actualite-automobile/superchargeurs-tesla-ouverts-a-tous-carte-de-france-et-tarifs-10837398.html
- https://www.macarel.fr/ionity-releve-ses-tarifs-au-1er-juillet-mais-la-france-echappe-presque-a-la-hausse/
- https://www.automobile-propre.com/dossiers/voiture-electrique-les-differents-types-de-prises/ · https://www.fiches-auto.fr/articles-auto/voiture-electrique/s-2210-les-differentes-prises-connecteurs-de-voiture-electrique-combo-ccs-type-2-etc.php
- https://www.moncoyote.com/blog/actualites-automobile/liste-voitures-compatibles-sp95-e10/ · https://services.totalenergies.fr/faq/q/difference-e10-sp95
- https://groupe-grim.com/ford/voitures-compatibles-e85/ · https://www.biomotors.fr/compatibilite-e85-voiture/
- https://www.cartecarburant.leclerc/stations-service
- https://france3-regions.franceinfo.fr/hauts-de-france/nord-0/lille/carte-prix-des-carburants-voici-ou-trouver-les-stations-service-les-moins-cheres-pres-de-chez-vous-3420560.html
