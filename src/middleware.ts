import { NextResponse, type NextRequest } from "next/server";
import { supabaseMiddleware } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback", "/api/instantly", "/api/typeform"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseMiddleware(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (user && (path === "/login" || path === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
