"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
        <header className="border-b glass-header sticky top-0 z-40 relative">
          <div className="absolute top-0 left-0 right-0 accent-bar" />
          <div className="page-container flex items-center justify-between py-3">
            <Link
              href="/dashboard/templates"
              className="text-xl font-serif font-black gradient-ens bg-clip-text text-transparent"
            >
              QuizArena
            </Link>

            <nav className="flex items-center gap-3 sm:gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    pathname?.startsWith(item.href)
                      ? "text-[#EEDC00] font-medium"
                      : "text-muted-foreground hover:text-[#EEDC00]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeToggle className="h-8 px-2 border-[#EEDC00]/30 text-white hover:bg-white/10" />
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
