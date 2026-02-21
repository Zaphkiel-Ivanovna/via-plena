import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "ViaPlena - Trouvez les meilleurs prix de carburant",
  description:
    "Comparez les prix des stations-service autour de vous et trouvez le carburant le moins cher.",
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
