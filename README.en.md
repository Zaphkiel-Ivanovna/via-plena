<div align="center">

<img src="public/logo.png" alt="ViaPlena" width="120" />

# ViaPlena

**Find the cheapest fuel near you, in real time.**

[Website](https://via-plena.zaphkiel.dev/) · [Version française](README.md)

[![GitHub Stars](https://img.shields.io/github/stars/Zaphkiel-Ivanovna/via-plena?style=flat-square)](https://github.com/Zaphkiel-Ivanovna/via-plena/stargazers)
[![License](https://img.shields.io/github/license/Zaphkiel-Ivanovna/via-plena?style=flat-square)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Zaphkiel-Ivanovna/via-plena?style=flat-square)](https://github.com/Zaphkiel-Ivanovna/via-plena/commits/main)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fvia-plena.zaphkiel.dev&style=flat-square)](https://via-plena.zaphkiel.dev/)

</div>

---

## Live Demo

**[→ See the live demo](https://via-plena.zaphkiel.dev/)**

## Features

- **Real-time price comparison** — Diesel, SP95, SP98, E10, E85, LPG
- **Interactive map** with automatic geolocation
- **Advanced filters** — search radius, fuel type, sort by price or distance
- **Detailed station page** — current prices, available services, GPS navigation
- **Customizable map themes** — 15+ visual styles
- **Mobile-first responsive design**
- **PWA with offline support**
- **Station sharing** — share a station in one click

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) / [React 19](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) |
| Mapping | [MapLibre GL](https://maplibre.org/) |
| UI | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| State & Data | [Zustand](https://zustand.docs.pmnd.rs/) + [TanStack React Query](https://tanstack.com/query) |
| Animations | [Motion](https://motion.dev/) |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) |
| API | [prix-carburants.2aaz.fr](https://prix-carburants.2aaz.fr/) |

## Quick Start

```bash
git clone https://github.com/Zaphkiel-Ivanovna/via-plena.git
cd via-plena
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|------------|
| `yarn dev` | Start the development server |
| `yarn build` | Build for production |
| `yarn start` | Start the production server |
| `yarn lint` | Lint code with ESLint |
| `yarn api:generate` | Generate the API client with Orval |

## Project Structure

```
src/
├── api/          # Generated API client (Orval)
├── app/          # Next.js routes and pages (App Router)
├── components/   # Reusable React components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and helpers
├── providers/    # React providers (Query, Theme, etc.)
├── services/     # Business logic and services
├── stores/       # Zustand stores
└── types/        # TypeScript types
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "feat: add my feature"`)
4. Push the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) © 2026 [Zaphkiel-Ivanovna](https://github.com/Zaphkiel-Ivanovna)

---

<div align="center">

Built with [Next.js](https://nextjs.org/), [MapLibre](https://maplibre.org/) and [Tailwind CSS](https://tailwindcss.com/)

[via-plena.zaphkiel.dev](https://via-plena.zaphkiel.dev/)

</div>
