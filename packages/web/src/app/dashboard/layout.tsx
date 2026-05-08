"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import BrandedBackground from "@/components/ui/BrandedBackground";
import { createClient } from "@/lib/supabase/client";
import { clearSessionQueryCache } from "@/lib/query-cache";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { GameLogoInline } from "@/components/ui/GameLogo";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const backgroundImagePath = "/designs/backgrounds/dt-wallpaper.png";

  const navItems = [
    { href: "/dashboard/templates", label: "Templates" },
    { href: "/dashboard/sessions", label: "Sessions" },
    { href: "/dashboard/branding", label: "Branding" },
  ];

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      clearSessionQueryCache();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/auth/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen min-h-[100dvh] flex flex-col gradient-dark relative overflow-hidden">
        <BrandedBackground
          imagePath={backgroundImagePath}
          overlayClassName="bg-black/55 dark:bg-black/55"
          className="z-0"
          absolute
        />

        <header className="border-b glass-header sticky top-0 z-40 relative">
          <div className="absolute top-0 left-0 right-0 accent-bar" />
          <div className="page-container flex items-center justify-between py-3">
            <Link
              href="/dashboard/templates"
              className="inline-flex"
            >
              <GameLogoInline />
            </Link>

            <nav className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm" aria-label="Dashboard navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
                  className={`px-3 py-2 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    pathname?.startsWith(item.href)
                      ? "text-primary font-medium bg-primary/10"
                      : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle className="h-10 w-10 min-h-[44px] min-w-[44px] border-primary/30 text-foreground hover:bg-primary/10" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="h-10 px-3 min-h-[44px] border-primary/30 text-foreground hover:bg-primary/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                {signingOut ? "Signing out..." : "Sign out"}
              </Button>
            </nav>
          </div>
        </header>

        <main className="flex-1 relative z-10">{children}</main>
      </div>
    </AuthGuard>
  );
}
