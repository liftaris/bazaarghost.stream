import type React from "react";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell";
import { GlobalStats, GlobalStatsFallback } from "@/components/global-stats";
import { AuthProvider } from "@/components/auth/auth-provider";
import { BookmarksProvider } from "@/components/social/bookmarks-provider";
import { getServerSession } from "@/lib/session-server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const averiaLibre = localFont({
  src: [
    {
      path: "../public/Averia_Libre/AveriaLibre-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Averia_Libre/AveriaLibre-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-averia-libre",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bazaarghost.stream"),
  title: {
    default: "BazaarGhost - Bazaar Matchup Search",
    template: "%s | BazaarGhost",
  },
  description:
    "Search and discover Bazaar ghost matchups from thousands of Twitch VODs. Find when streamers played against specific opponents.",
  keywords: [
    "Bazaar",
    "ghost matchups",
    "Twitch VODs",
    "streamers",
    "gaming",
    "matchup search",
    "BazaarGhost",
  ],
  authors: [{ name: "BazaarGhost" }],
  creator: "BazaarGhost",
  publisher: "BazaarGhost",

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BazaarGhost",
    title: "BazaarGhost - Bazaar Matchup Search",
    description:
      "Search and discover Bazaar ghost matchups from thousands of Twitch VODs",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "BazaarGhost Logo",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary",
    title: "BazaarGhost - Bazaar Matchup Search",
    description:
      "Search and discover Bazaar ghost matchups from thousands of Twitch VODs",
    images: ["/logo.png"],
  },

  // Icons - Next.js will auto-generate link tags from files in /app
  icons: {
    icon: [
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },

  // Manifest
  manifest: "/manifest.json",

  // Robots
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-user: pages under this layout must not export `revalidate` (ISR would cache one user's session for everyone).
  const session = await getServerSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased font-sans ${inter.variable} ${jetbrainsMono.variable} ${averiaLibre.variable}`}
      >
        <ThemeProvider>
          <AuthProvider initialState={session.status === "unknown" ? null : session}>
            <BookmarksProvider>
              <div className="min-h-screen bg-background">
                <AppShell
                  stats={
                    <Suspense fallback={<GlobalStatsFallback />}>
                      <GlobalStats />
                    </Suspense>
                  }
                >
                  {children}
                </AppShell>
              </div>
            </BookmarksProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
