import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://via-plena.zaphkiel.dev";
const SITE_NAME = "ViaPlena";
const SITE_DESCRIPTION =
  "Comparez les prix des carburants en temps réel autour de vous. Trouvez la station-service la moins chère : Gazole, SP95, SP98, E10, E85, GPL.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Trouvez les meilleurs prix de carburant`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "prix carburant",
    "station-service",
    "essence",
    "gazole",
    "diesel",
    "SP95",
    "SP98",
    "E10",
    "E85",
    "GPL",
    "comparateur carburant",
    "carburant pas cher",
    "prix essence",
    "station essence",
    "France",
  ],
  authors: [{ name: "Zaphkiel", url: "https://github.com/Zaphkiel-Ivanovna" }],
  creator: "Zaphkiel",
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Trouvez les meilleurs prix de carburant`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo_dark.png",
        width: 480,
        height: 480,
        alt: `${SITE_NAME} - Comparateur de prix de carburant`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} - Trouvez les meilleurs prix de carburant`,
    description: SITE_DESCRIPTION,
    images: ["/logo_dark.png"],
  },
  icons: {
    icon: [
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/apple-touch-icon-light.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE_NAME,
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                inLanguage: "fr",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL,
                logo: `${SITE_URL}/logo.png`,
              },
            ]),
          }}
        />
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
