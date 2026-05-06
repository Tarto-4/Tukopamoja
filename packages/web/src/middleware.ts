// ─────────────────────────────────────────────────────────────
// Next.js Middleware — Server-side auth gate for /dashboard/*
//
// This middleware only executes in server mode (BUILD_MODE=server).
// In static export mode, it is excluded from the build entirely.
// ─────────────────────────────────────────────────────────────

import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // Validate the user session server-side using the auth cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no authenticated user, redirect to login — never expose dashboard HTML
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add security headers to prevent indexing of protected pages
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
