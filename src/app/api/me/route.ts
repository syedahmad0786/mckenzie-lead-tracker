import { NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

/** Returns the logged-in user's profile (email, name, role, client_id). */
export async function GET() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  // Profile read may be blocked by RLS for some scopes — use admin client to read self
  const sba = supabaseAdmin();
  const { data: profile } = await sba.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

  const display = profile?.display_name || (user.email?.split("@")[0] ?? "user");
  const initials = display
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s[0])
    .join("")
    .toUpperCase();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: display,
      initials,
      role: profile?.role ?? "client_member",
      clientId: profile?.client_id ?? null,
    },
  });
}
