import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "QuizArena — ENS Africa",
  description: "Premium real-time quiz platform. Create, host, and engage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-[100dvh] font-sans antialiased bg-[#111111]">
        {children}
      </body>
    </html>
  );
}
