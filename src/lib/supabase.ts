/**
 * Supabase clients (server + browser + middleware).
 * Phase 2 — wired May 8, 2026.
 */

import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Server client tied to the request cookies — respects RLS as the logged-in user. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* called from a Server Component — ignore */
        }
      },
    },
  });
}

/** Service-role client — bypasses RLS. Use ONLY in trusted server code. */
export function supabaseAdmin() {
  if (!SERVICE) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Browser client — for client components. */
export function supabaseBrowser() {
  return createBrowserClient(URL, ANON);
}

/** Middleware client — refreshes the session cookie on every request. */
export function supabaseMiddleware(req: NextRequest, res: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
}
