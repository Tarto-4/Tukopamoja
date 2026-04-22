import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Top nav bar */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="page-container flex items-center justify-between py-3">
          <Link
            href="/dashboard"
            className="text-xl font-display font-black gradient-primary bg-clip-text text-transparent"
          >
            QuizArena
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/dashboard/templates"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/sessions"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sessions
            </Link>
            <Link
              href="/dashboard/branding"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Branding
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
