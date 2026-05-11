"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magic, setMagic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const sb = supabaseBrowser();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      if (magic) {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        setInfo(`Magic link sent to ${email}. Check your inbox.`);
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <div className="login__brand-mark" style={{ background: "transparent", padding: 4 }}><img src="/mckenzie-logo.png" alt="McKenzie SewOn" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          <div>
            <div className="login__brand-name">McKenzie SewOn</div>
            <div className="login__brand-sub">LEAD TRACKER</div>
          </div>
        </div>

        <div className="login__form-wrap">
          <h1 className="login__h1">Sign in to<br />your dashboard.</h1>
          <p className="login__sub">View your pipeline, update lead status, and track revenue from every campaign in one place.</p>

          <form onSubmit={submit} className="login__form">
            <label>Work email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@modernamenities.com" />
            </label>
            {!magic && (
              <label>
                <span className="login__pw-row">
                  <span>Password</span>
                  <button type="button" onClick={() => setMagic(true)} className="login__alt">Use magic link instead</button>
                </span>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </label>
            )}
            {magic && (
              <button type="button" onClick={() => setMagic(false)} className="login__alt" style={{ alignSelf: "flex-start" }}>
                Use password instead
              </button>
            )}
            {err && <div className="login__err">{err}</div>}
            {info && <div className="login__info">{info}</div>}
            <button className="btn btn--primary login__submit" disabled={busy} type="submit">
              {busy ? "Signing in…" : magic ? "Send magic link →" : "Sign in →"}
            </button>
          </form>

          <div className="login__alt-actions">
            <a href="/signup">Create an account</a>
            <a href="/forgot-password">Forgot password?</a>
          </div>
        </div>

        <div className="login__footer">
          <img src="/ma-logo.png" alt="" className="login__footer-mark" style={{ background: "transparent", objectFit: "cover" }} />
          Powered by Modern Amenities · AOC Operator Network
        </div>
      </div>

      <aside className="login__right">
        <div className="login__right-eyebrow">PIPELINE · Q2 2026</div>
        <h2 className="login__right-h">Every qualified handoff, the order it became, and the revenue it earned — visible to both teams in real time.</h2>
        <p className="login__right-sub">A shared workspace between McKenzie SewOn and Modern Amenities.</p>
        <div className="login__right-stats">
          <div><span className="num">21</span> leads tracked this period</div>
          <div className="num right">$0 revenue</div>
        </div>
      </aside>
    </div>
  );
}


export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
