// Backward-compat shim. New imports should use the split paths:
//   "@/lib/supabase/server" — server / API routes / middleware
//   "@/lib/supabase/client" — client components
export { supabaseServer, supabaseAdmin, supabaseMiddleware } from "./supabase/server";
// NOTE: do NOT re-export supabaseBrowser here — it would pull next/headers into
// the client bundle and break the build.
