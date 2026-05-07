import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch { /* server-component callsite — ignore */ }
      },
    },
  });
}

export function supabaseAdmin() {
  if (!SERVICE) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function supabaseMiddleware(req: NextRequest, res: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
}
