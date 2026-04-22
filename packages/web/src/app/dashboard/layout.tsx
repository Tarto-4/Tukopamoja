"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/templates", label: "Templates" },
    { href: "/dashboard/sessions", label: "Sessions" },
    { href: "/dashboard/branding", label: "Branding" },
  ];

  return (
    <AuthGuard>
      <div className="min-h-[100dvh] flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="page-container flex items-center justify-between py-3">
            <Link
              href="/dashboard/templates"
              className="text-xl font-display font-black gradient-primary bg-clip-text text-transparent"
            >
              QuizArena
            </Link>

            <nav className="flex items-center gap-4 sm:gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    pathname?.startsWith(item.href)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
