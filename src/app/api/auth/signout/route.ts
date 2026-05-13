import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * Sign out the current Supabase session.
 *
 * Accepts BOTH:
 *  - fetch("/api/auth/signout", { method: "POST" }) → returns 200 JSON {ok:true}
 *    (browser handles the redirect to /login client-side)
 *  - <form action="/api/auth/signout" method="post"> → returns 303 redirect to /login
 *
 * IMPORTANT: derive the redirect target from the request URL, not env.
 * NEXT_PUBLIC_APP_URL is not guaranteed to be set in every Vercel environment,
 * and an unset value used to redirect signed-out users to http://localhost:3000.
 */
export async function POST(req: NextRequest) {
  // Log BEFORE signOut so we still have the user context.
  await logActivity(req, { action: "auth.signout" });

  const sb = await supabaseServer();
  await sb.auth.signOut();

  const accept = req.headers.get("accept") || "";
  const isJson = accept.includes("application/json");

  if (isJson) {
    return NextResponse.json({ ok: true });
  }
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl, { status: 303 });
}
