# Audit visuel / mobile / above-the-fold SEO — ViaPlena

Date : 2026-09-24. Outil : Playwright Chromium (swiftshader WebGL, geoloc Paris), UA Googlebot smartphone pour le mobile.

## Méthodologie et environnement

- Viewports : mobile 390x844 (is_mobile, has_touch, DPR 2), desktop 1440x900. JS activé et JS désactivé.
- **Artefact d'environnement** : sur `localhost:3002`, les fiches `/station/*` renvoyaient 404 parce qu'un autre `next-server` (`~/Developer/Error Club/root/dashboard`) écoute sur `[::1]:3000` et intercepte les appels SSR vers `localhost:3000`, alors que l'API bun écoute en IPv4. Ce n'est pas un bug du site (le coordinateur a depuis relancé 3002 avec `127.0.0.1`).
- Pour ne pas dépendre de ça, toutes les mesures finales viennent d'un **build de production** d'une copie du projet dans le scratchpad (`scratchpad/clone`, `.env.local` pointé sur `127.0.0.1:3000`, `next start -p 3004`). Aucun fichier du projet n'a été modifié. Le build de prod est aussi plus représentatif de ce que voit Googlebot.
- Captures : `scratchpad/seo/screenshots/` (`<page>_<mobile|desktop>_<js|nojs>.png`, plus `_full.png` en pleine page). Les premières captures sur 3002, avec les stations en 404, sont dans `screenshots/port3002_api-shadowed/`.
- Données brutes : `scratchpad/seo/visual_audit.json`. Scripts : `visual_audit.py`, `visual_debug.py`, `visual_debug2.py`.

## Synthèse par page

| Page | HTTP | H1 visible au-dessus de la ligne de flottaison (mobile) | Rendu sans JS | Débordement horizontal (mobile) | CLS | LCP (mobile, local) |
|---|---|---|---|---|---|---|
| `/` | 200 | Non (h1 sr-only uniquement) | h1 sr-only + « Chargement de la carte... » + barre d'outils | non | 0,013 (contrôles maplibre) | 2,5 s (texte du compteur) |
| `/station/a039…` (essence) | 200 | Oui, « Total », 24px, y=139 | Complet (prix, horaires, services, fil d'Ariane) | non | 0 | 0,35 s |
| `/station/983d…` (IRVE) | 200 | Oui, 24px, y=139 | Complet (points de charge, paiement, accès) | non | 0 | 0,1 s |
| `/commune/75056` | 200 | Oui, « Paris » (une fois le JS exécuté) | **Vide** : pas de h1, pas de liste, seulement « Retour à la carte » | **oui, 523px pour 390px** | 0 | jusqu'à 9 s (liste chargée côté client) |
| `/stats` | 200 | Oui, « Couverture » | h1 seul, aucune donnée | non | 0 | faible |
| `/une-page-inexistante` | 404 | Oui, « 404 » | Complet | non | 0 | faible |

## 1. Ce que Googlebot mobile voit au-dessus de la ligne de flottaison

### Accueil `/` (le problème principal)
- Au-dessus de la ligne de flottaison il n'y a que la carte avec ses clusters numérotés, l'îlot de filtres (recherche, géoloc, thème, filtres, bascule carte/liste) et « 581 stations trouvées ». **Aucun texte visible qui dise ce que fait le site** : pas de titre visible ni de phrase de proposition de valeur. Le seul h1 (« Comparateur de prix de carburants en France ») est `sr-only`. Google tolère un h1 masqué pour l'accessibilité, mais ça ne compte pas comme contenu visible pour la pertinence, et visuellement la page ressemble à une application.
- Sans JS, le HTML ne contient que le h1 sr-only, « Chargement de la carte... », « Filtres » et « Command Palette / Search for a command to run... » (texte anglais du composant cmdk, dans une page `lang=fr`). **Une seule balise `<a href>`**, donc aucun lien crawlable vers les communes, les stations ou `/stats`. Tout le maillage interne vient du sitemap.
- **Bug critique, crash sans WebGL2** : si WebGL2 n'est pas disponible (`--disable-webgl`, certains appareils ou GPU blacklistés, et potentiellement le WRS de Googlebot), `new maplibregl.Map()` lève une exception non interceptée dans `src/components/map/map-container.tsx:65`. Il n'y a pas d'`error.tsx`, donc toute la page est remplacée par l'écran Next « This page couldn't load / Reload / Back » en anglais, **h1 SEO compris**. Captures : `screenshots/debug_home_nowebgl_390.png` et `debug_home_nowebgl_1440.png`. Pendant l'audit, c'est arrivé une fois « naturellement » en desktop (`home_desktop_js.png`). Les fiches station, elles, gèrent déjà le cas (`station-map.tsx:52`, try/catch avec « La carte ne peut pas s'afficher sur cet appareil »). À corriger en priorité : même try/catch avec un repli (liste des stations ou message) et un `app/error.tsx`.
- Recommandation au-dessus de la ligne de flottaison : un bandeau court et visible, par exemple « Prix des carburants et bornes de recharge en temps réel — 9 903 stations, 36 784 bornes » sous l'îlot, repliable ou masqué après la première interaction. Ajouter aussi, rendu côté serveur sous la carte ou dans la vue liste, un bloc texte avec des liens vers les grandes villes (`/commune/...`) et `/stats`.

### Fiches station
- Bonnes : h1 rendu côté serveur et visible, fil d'Ariane (Accueil > Paris > station), type (« Station-service » / « Borne de recharge »), adresse, statut ouvert/fermé. Tout le contenu est dans le HTML sans JS.
- Station essence en mobile : **les prix, principale raison de visiter, arrivent à la limite de la ligne de flottaison** (y ≈ 750-844px). La mini-carte (≈ 240px) et les boutons d'itinéraire passent avant. Recommandation : sur mobile, mettre la carte « Prix des carburants » avant la mini-carte, comme en desktop où les prix sont à gauche et visibles d'emblée.
- En desktop dans l'audit, la carte affichait « La carte ne peut pas s'afficher sur cet appareil » (swiftshader épuisé, repli correct, pas de crash).

### Commune `/commune/75056`
- Page entièrement cliente (`'use client'` + hooks React Query) : **sans JS il n'y a ni h1 ni aucune station**. Googlebot doit tout rendre lui-même, et la liste arrive tard (LCP jusqu'à 9 s en local).
- Title et description génériques (« ViaPlena - Trouvez les meilleurs prix de carburant ») et **canonical = `https://via-plena.zaphkiel.dev` (la page d'accueil)**. Même chose sur `/stats`. Google risque de considérer ces pages comme des doublons de l'accueil et de ne pas les indexer.
- **Les cartes de station ne sont pas des liens** : `<div onClick={() => setSelectedPoi(id)}>` (`station-card.tsx:48`). Sur `/commune`, un tap ne fait rien du tout (clic mort, URL inchangée, cf. `commune_mobile_after_tap.png`), et aucun lien crawlable ne pointe vers `/station/...`. Il faut un `<Link href="/station/{id}">`.
- **Débordement horizontal en mobile** : `scrollWidth` = 523px pour un viewport de 390px. La carte `MagicCard` (`div.group.relative.cursor-pointer.rounded-2xl`) s'étire sur des adresses longues (« 204, Avenue du Maine et Face au 203, … »). Les cartes sont coupées à droite (`commune_mobile_js.png`) et Chrome dézoome la page. C'est un échec « contenu plus large que l'écran ». Probablement un `min-w-0` / `overflow-hidden` manquant sur le wrapper BlurFade/MagicCard.
- Le sous-titre affiche « 75001 · Paris » pour l'INSEE 75056 (code postal du 1er arrondissement). Prêtable à confusion.
- Format des prix incohérent : « 2.559€ » (point, sans espace) sur la commune contre « 2,250 €/L » sur la fiche. Utiliser le format français partout.
- L'ordre de la liste (bornes IRVE d'abord, puis essence non triée par prix) n'aide pas l'intention « station la moins chère à Paris ».

### Stats `/stats`
- h1 « Couverture » visible, mais les chiffres et le tableau par région sont chargés côté client (sans JS il ne reste que le h1). Title et canonical sont ceux de l'accueil, comme sur la commune. Page peu utile en SEO dans cet état. À rendre côté serveur, ou à passer en `noindex`.

### 404
- Code HTTP 404 correct, h1 « 404 », message en français, bouton de retour. Rien à signaler, sauf la cible tactile de 36px.

## 2. Lisibilité mobile

- `meta viewport` : `width=device-width, initial-scale=1, maximum-scale=5`. Correct, le zoom reste possible.
- Police de base 16px. Mais le corps du texte est majoritairement en **12px** (`text-xs`) : 56-72 % des caractères sur l'accueil, les fiches et la commune. 14px sur les stats.
  - Texte à 10-11px : badges de carburant sur la commune (`B7`, `E5+`, `E10` à 10px), puissances et types de prise sur la fiche IRVE (« Rapide », « Type 2 », « libres », « 8 HS » à 11px), en-tête du sélecteur de thème (`text-[10px]`).
  - Recommandation : 14px minimum pour le contenu (adresses, noms de station), 12px réservé aux libellés secondaires.
- Contraste (thème sombre par défaut) : `text-muted-foreground` (lab L≈66 sur fond quasi noir) donne environ 7:1, c'est correct. En revanche `text-muted-foreground/70` (adresses des cartes de liste, `station-card.tsx:73`) et `/50` (chevrons, en-têtes du sélecteur de thème) descendent vers 3:1 à 2:1, sous le seuil WCAG AA de 4,5:1 pour du texte de 12px.
- Placeholder de recherche tronqué en mobile : « Recherc… » (champ de 124px dans l'îlot, `home_mobile_js.png`). Un placeholder plus court (« Ville, station… ») ou une icône seule serait mieux.
- Sur l'accueil mobile, l'îlot de filtres recouvre en partie les contrôles zoom/boussole de maplibre en haut à droite (le bouton blanc dépasse derrière l'îlot à x≈350, y≈10-95).

## 3. Cibles tactiles (seuil 48x48)

Aucune page n'atteint 48px partout. Détail en mobile :
- Accueil : boutons de l'îlot à 32x32 (géoloc, thème, Filtres), bascule carte/liste à 38x26, zoom maplibre à 29x29, attribution à 24x24 et liens à 14px de haut. Ce sont les contrôles principaux de l'app : il faudrait passer à 44-48px (ou garder 32px visuels avec une zone de tap étendue).
- Fiches : « Carte » (retour) 84x36, logo 84x20, fil d'Ariane à 15px de haut (« Accueil », « Paris »), Waze/Plans/Partager à 40px de haut, « Copier l'adresse » 36x36, « +2 autres » 77x26, « 30 j / 90 j » 46x32, téléphone 106x16, lien source 15px. « Itinéraire » à 44px est presque bon.
- Commune et stats : « Retour à la carte » 130x20. Les cartes de station (grandes) ne sont pas focusables : pas de lien, pas de `role=button`.
- 404 : « Retour à l'accueil » 146x36.

## 4. CLS, interstitiels, overlays

- CLS mesuré ≈ 0 partout. 0,013 sur l'accueil (le conteneur `maplibregl-ctrl-bottom-right` apparaît) et 0,013 sur la commune desktop (apparition des cartes BlurFade). Largement sous 0,1.
- Le BlurFade (opacity/blur/translate) des cartes de la commune ne génère pas de CLS mais retarde le LCP.
- **Aucun interstitiel** ni modal ou bannière cookie intrusive au chargement. Les seuls éléments fixes/sticky sont le header des fiches (57px, 7 % de l'écran) et l'`aside` sticky en desktop. Pas de popup de géolocalisation bloquante côté page (seule l'invite du navigateur apparaît).
- Un h2 sr-only « Command Palette » (cmdk) est présent dans le DOM de chaque page, en anglais. C'est du bruit pour le contenu vu par le crawler : à traduire (« Palette de recherche ») ou à monter seulement à l'ouverture.

## 5. Rendu sans JavaScript

| Page | Contenu restant |
|---|---|
| `/` | h1 sr-only, « Chargement de la carte... », îlot de boutons, texte cmdk anglais. 1 lien. Rien d'indexable au-delà du title/description. |
| `/station/essence` | Tout : h1, fil d'Ariane, adresse, horaires, 4 prix, services, sources. Excellent. |
| `/station/IRVE` | Tout : points de charge par puissance, paiement, accès, opérateur, téléphone. Excellent (HTML de 203 Ko, lourd mais complet). |
| `/commune/75056` | « Retour à la carte » seulement. **Page vide.** |
| `/stats` | h1 « Couverture » seulement. |
| 404 | Complet. |

## 6. Images, alt, favicon, image OG

- Aucune `<img>` sur les pages auditées : icônes en SVG inline (lucide), logo en SVG/texte, pas de problème d'alt. Les tuiles de carte sont en canvas WebGL, donc invisibles pour Google (normal). En l'absence de photos, Google Images n'apporte rien et les résultats ne peuvent pas afficher de vignette. L'image OG est le seul levier visuel.
- Favicon : `favicon-dark.png` / `favicon-light.png` font **32x32** et ne sont servis qu'avec `media="(prefers-color-scheme: …)"`. `/favicon.ico` renvoie 404. Google recommande un favicon **multiple de 48px (48, 96, 192)**, carré, à une URL stable, et ne sait pas toujours gérer les variantes par media query. Recommandation : ajouter `app/icon.png` en 192x192 (ou `favicon.ico` 48px) sans media query, en plus des variantes clair/sombre. `apple-touch-icon` 180x180 : OK. `manifest.json` est lié, il faut vérifier qu'il déclare des icônes 192 et 512.
- Image OG actuelle : `logo_dark.png` 480x480, `twitter:card=summary`, sur l'accueil, la commune et les stats.
  - **Les fiches station n'ont aucune `og:image` ni `twitter:image`** : `generateMetadata` redéfinit `openGraph` sans `images`, et Next ne fusionne pas en profondeur. Un partage WhatsApp ou iMessage d'une station (le bouton « Partager » est mis en avant) s'affiche donc sans visuel.
  - **Oui, une vraie image 1200x630 par page est pertinente**, surtout pour les stations, puisque le partage est une fonctionnalité centrale. Avec `app/station/[id]/opengraph-image.tsx` (`ImageResponse`, rendu edge et mis en cache) : nom et marque, ville, 3-4 prix avec leur date (ou « 195/233 bornes libres · 100 kW » pour une IRVE), logo ViaPlena, et éventuellement une mini-carte statique. Passer ensuite en `twitter:card=summary_large_image`. Pour l'accueil, la commune et les stats, une image générique 1200x630 (proposition de valeur + visuel carte) plutôt que le logo carré, qui est recadré et petit sur Facebook, LinkedIn et Slack. Impact SEO direct faible, mais impact CTR/social réel. Google Discover exige aussi des images d'au moins 1200px de large.

## Priorités

1. **P0** : crash de l'accueil sans WebGL2 (`map-container.tsx:65` sans try/catch, pas d'`error.tsx`).
2. **P0** : `/commune` et `/stats` ont une canonical vers l'accueil et un title/description génériques. La commune est vide sans JS. Passer en Server Component avec `generateMetadata`.
3. **P1** : cartes de la commune et de la liste en `<Link href="/station/…">` (clic mort aujourd'hui + aucun maillage). Liens internes rendus côté serveur depuis l'accueil.
4. **P1** : débordement horizontal de `/commune` en mobile (523px pour 390px).
5. **P1** : proposition de valeur visible au-dessus de la ligne de flottaison sur l'accueil. Prix avant la mini-carte sur les fiches essence en mobile.
6. **P2** : `og:image` absente des fiches, puis images OG 1200x630 dynamiques + `summary_large_image`. Favicon de 48px minimum sans media query.
7. **P2** : cibles tactiles de 32-40px à passer à 44-48px. Texte de 10-12px et contraste `/70` et `/50`. Format des prix « 2.559€ » à uniformiser en « 2,559 € ». Texte cmdk en anglais.

## Note sur l'environnement (arrêt de l'API)

Toutes les captures et mesures ont été faites **avant** l'arrêt de l'API :3000, sur le build de prod temporaire (:3004), avec des réponses 200/404 réelles. Aucune erreur 500 n'a été capturée ni comptée comme un défaut du site. Rien n'a manqué dans l'audit.

L'arrêt de l'API vient très probablement de moi : en voulant couper mon serveur temporaire :3004, j'ai lancé `pkill -f "next-server" -U $(id -u) --`, que le pkill BSD a mal interprété. La commande a tué, de façon trop large, les processus bun et next (:3000 et :3002). Rien n'a été relancé.
