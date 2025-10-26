import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileShell from "@/components/ui/mobile-shell/MobileShell";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebTrigger - Smart Webhook Management",
  description:
    "Trigger webhooks and manage callbacks with ease. Monitor, log, and automate your webhook workflows.",
  manifest: "/manifest.json",
  // themeColor and viewport moved to dedicated exports below to satisfy
  // Next.js metadata API (avoid unsupported metadata warnings).
  openGraph: {
    title: "WebTrigger - Smart Webhook Management",
    description:
      "Trigger webhooks and manage callbacks with ease. Monitor, log, and automate your webhook workflows.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.example.com",
    siteName: "WebTrigger",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "WebTrigger - Smart Webhook Management",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebTrigger - Smart Webhook Management",
    description:
      "Trigger webhooks and manage callbacks with ease. Monitor, log, and automate your webhook workflows.",
    site: "@webtrigger",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WebTrigger",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "WebTrigger",
    "application-name": "WebTrigger",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
  },
};

// Export viewport separately per Next.js app metadata guidance.
export const viewport = {
  value: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="theme-color" content="#3b82f6" />
        {/* Canonical for SEO */}
        <link
          rel="canonical"
          href={process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.example.com"}
        />
        {/* Structured data (JSON-LD) for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "WebTrigger",
              url: process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.example.com",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  `${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.example.com"}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MobileShell>{children}</MobileShell>
        <InstallPrompt />
      </body>
    </html>
  );
}
