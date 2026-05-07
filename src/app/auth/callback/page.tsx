"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState<string>("Verifying your link…");

  useEffect(() => {
    const error = params.get("error_description") || params.get("error");
    if (error) { setState("error"); setMessage(error); return; }

    const code = params.get("code");
    const sb = supabaseBrowser();

    (async () => {
      try {
        // PKCE / OAuth code exchange (verification email + magic link both use this in newer Supabase)
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit flow lands the access_token in the URL fragment — supabase-js parses it on construction.
          // Force a session refresh so cookies sync.
          await sb.auth.getSession();
        }
        setState("ok");
        setMessage("You're signed in. Taking you to the dashboard…");
        const next = params.get("next") || "/";
        setTimeout(() => router.replace(next), 600);
      } catch (e) {
        setState("error");
        setMessage(e instanceof Error ? e.message : "Sign-in failed");
      }
    })();
  }, [params, router]);

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "var(--app-bg)", padding: 24,
    }}>
      <div style={{
        maxWidth: 420, width: "100%", textAlign: "center",
        background: "var(--app-surface)", border: "1px solid var(--app-line)",
        borderRadius: 12, padding: "36px 28px",
      }}>
        <div style={{
          width: 48, height: 48, margin: "0 auto 20px", borderRadius: 10,
          background: "var(--accent, #00a7e0)", color: "#fff",
          display: "grid", placeItems: "center",
          fontFamily: "'Archivo Black', sans-serif", fontSize: 16,
        }}>MS</div>
        <div style={{
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--app-ink-3)", fontWeight: 600, marginBottom: 8,
        }}>McKenzie Lead Tracker</div>
        <h1 style={{
          fontFamily: "'Archivo', sans-serif", fontSize: 22, fontWeight: 600,
          color: "var(--app-ink-1)", margin: "0 0 12px", letterSpacing: "-0.01em",
        }}>
          {state === "working" && "Signing you in"}
          {state === "ok" && "All set"}
          {state === "error" && "Couldn't verify your link"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--app-ink-3)", lineHeight: 1.5 }}>{message}</p>

        {state === "working" && (
          <div style={{ marginTop: 24, display: "grid", placeItems: "center" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "3px solid var(--app-line)",
              borderTopColor: "var(--accent, #00a7e0)",
              animation: "spin 0.9s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {state === "error" && (
          <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
            <a className="btn" href="/login">Back to sign in</a>
            <a className="btn btn--primary" href="/signup">Try sign up again</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return <Suspense fallback={null}><CallbackInner /></Suspense>;
}
