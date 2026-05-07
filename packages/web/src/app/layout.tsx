import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { withBasePath } from "@/lib/base-path";
import ThemeProvider from "@/components/theme/ThemeProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TUKOPAMOJA — ENS Africa",
  description: "Premium real-time quiz platform. Create, host, and engage.",
  manifest: withBasePath("/manifest.json"),
  icons: {
    icon: [
      { url: withBasePath("/favicon.ico"), sizes: "32x32" },
      { url: withBasePath("/favicon-32x32.png"), type: "image/png", sizes: "32x32" },
      { url: withBasePath("/favicon-16x16.png"), type: "image/png", sizes: "16x16" },
    ],
    shortcut: withBasePath("/favicon.ico"),
    apple: withBasePath("/apple-touch-icon.png"),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;500;700&display=swap"
        />
      </head>
      <body className="min-h-[100dvh] font-sans antialiased bg-background text-foreground">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <ThemeProvider>
          <main id="main-content">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
