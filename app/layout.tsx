import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SplashProvider } from "@/components/providers/splash-provider";
import { AuthProvider } from "@/components/providers/auth-context";
import { PlatformGuard } from "@/components/providers/platform-guard";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { DevBanner } from "@/components/layout/dev-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0c1b" },
    { media: "(prefers-color-scheme: light)", color: "#fff5f7" },
  ],
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cha-adda-meet-swap.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform",
    template: "%s | CHA ADDA",
  },
  description:
    "CHA ADDA (cha-adda-meet-swap) — Discover real connections nearby, swipe, match, and chat in real-time. Safe, modern, and verified 18+ adult dating and matchmaking platform.",
  keywords: [
    "cha-adda-meet-swap",
    "cha adda meet swap",
    "cha adda",
    "dating platform bangladesh",
    "matchmaking",
    "adult dating 18+",
    "real time chat",
    "meet singles",
    "bangladesh dating",
    "verified relationships",
    "cha-adda-meet-swap.vercel.app",
  ],
  authors: [{ name: "CHA ADDA Team" }],
  creator: "CHA ADDA",
  publisher: "CHA ADDA",
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      "kjvXTBODzcV14Ew2YhZ4e1JPs20-lT6Ijz1Q7_SRDa4",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "CHA ADDA (cha-adda-meet-swap)",
    title: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform (cha-adda-meet-swap)",
    description: "Spark real connections over authentic dates. Swipe, match, and chat safely in real-time on cha-adda-meet-swap.",
    images: [
      {
        url: "/logo.png",
        width: 600,
        height: 550,
        alt: "CHA ADDA — Meet. Swap. Connect.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CHA ADDA — Modern 18+ Dating & Matchmaking Platform (cha-adda-meet-swap)",
    description: "Discover real connections nearby. Safe, verified, real-time dating platform on cha-adda-meet-swap.",
    images: ["/logo.png"],
  },
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="kjvXTBODzcV14Ew2YhZ4e1JPs20-lT6Ijz1Q7_SRDa4"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "CHA ADDA",
              alternateName: [
                "cha-adda-meet-swap",
                "Cha Adda Meet Swap",
                "cha-adda-meet-swap.vercel.app",
                "CHA ADDA Dating",
              ],
              url: appUrl,
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "All",
              description:
                "CHA ADDA (cha-adda-meet-swap) — Discover real connections nearby, swipe, match, and chat in real-time. Safe, modern, and verified 18+ adult dating and matchmaking platform.",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col bg-background text-foreground transition-colors`}
      >
        <ThemeProvider>
          <SplashProvider>
            <AuthProvider>
              <PlatformGuard>
                <DevBanner />
                <Suspense fallback={<header className="h-16 border-b border-border/40 bg-background/80" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
                <Suspense fallback={null}>
                  <MobileNav />
                </Suspense>
                <Footer />
              </PlatformGuard>
            </AuthProvider>
          </SplashProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
