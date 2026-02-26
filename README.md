<div align="center">

<img src="public/logo.png" alt="ViaPlena" width="120" />

# ViaPlena

**Trouvez le carburant le moins cher près de chez vous, en temps réel.**

[Site web](https://via-plena.zaphkiel.dev/) · [English version](README.en.md)

[![GitHub Stars](https://img.shields.io/github/stars/Zaphkiel-Ivanovna/via-plena?style=flat-square)](https://github.com/Zaphkiel-Ivanovna/via-plena/stargazers)
[![License](https://img.shields.io/github/license/Zaphkiel-Ivanovna/via-plena?style=flat-square)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Zaphkiel-Ivanovna/via-plena?style=flat-square)](https://github.com/Zaphkiel-Ivanovna/via-plena/commits/main)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fvia-plena.zaphkiel.dev&style=flat-square)](https://via-plena.zaphkiel.dev/)

</div>

---

## Démo live

**[→ Voir la démo live](https://via-plena.zaphkiel.dev/)**

## Fonctionnalités

- **Comparaison de prix en temps réel** — Gazole, SP95, SP98, E10, E85, GPL
- **Carte interactive** avec géolocalisation automatique
- **Filtres avancés** — rayon de recherche, type de carburant, tri par prix ou distance
- **Fiche station détaillée** — prix actuels, services disponibles, navigation GPS
- **Thèmes de carte personnalisables** — 15+ styles visuels
- **Design responsive mobile-first**
- **PWA avec support offline**
- **Partage de station** — partagez une station en un clic

## Stack technique

| Catégorie | Technologie |
|-----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) / [React 19](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) |
| Cartographie | [MapLibre GL](https://maplibre.org/) |
| UI | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| État & données | [Zustand](https://zustand.docs.pmnd.rs/) + [TanStack React Query](https://tanstack.com/query) |
| Animations | [Motion](https://motion.dev/) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| API | [prix-carburants.2aaz.fr](https://prix-carburants.2aaz.fr/) |

## Démarrage rapide

```bash
git clone https://github.com/Zaphkiel-Ivanovna/via-plena.git
cd via-plena
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Scripts disponibles

| Commande | Description |
|----------|------------|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Compiler pour la production |
| `npm run start` | Lancer le serveur de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run api:generate` | Générer le client API avec Orval |

## Structure du projet

```
src/
├── api/          # Client API généré (Orval)
├── app/          # Routes et pages Next.js (App Router)
├── components/   # Composants React réutilisables
├── hooks/        # Hooks React personnalisés
├── lib/          # Utilitaires et helpers
├── providers/    # Providers React (Query, Theme, etc.)
├── services/     # Logique métier et services
├── stores/       # Stores Zustand
└── types/        # Types TypeScript
```

## Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le dépôt
2. Créez une branche (`git checkout -b feature/ma-feature`)
3. Commitez vos changements (`git commit -m "feat: ajouter ma feature"`)
4. Poussez la branche (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request

## Licence

[MIT](LICENSE) © 2025 [Zaphkiel-Ivanovna](https://github.com/Zaphkiel-Ivanovna)

---

<div align="center">

Fait avec [Next.js](https://nextjs.org/), [MapLibre](https://maplibre.org/) et [Tailwind CSS](https://tailwindcss.com/)

[via-plena.zaphkiel.dev](https://via-plena.zaphkiel.dev/)

</div>
