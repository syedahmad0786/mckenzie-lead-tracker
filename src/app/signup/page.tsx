"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signUp({
        email, password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setInfo(`We sent a verification email to ${email}. Confirm to finish signing up.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign up failed");
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
          <h1 className="login__h1">Create your<br />account.</h1>
          <p className="login__sub">Get access to the McKenzie pipeline. We&apos;ll send a verification email to confirm.</p>

          <form onSubmit={submit} className="login__form">
            <label>Your name
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Lauren Carter" />
            </label>
            <label>Work email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mcsewon.com" />
            </label>
            <label>Password
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </label>
            {err && <div className="login__err">{err}</div>}
            {info && <div className="login__info">{info}</div>}
            <button className="btn btn--primary login__submit" disabled={busy} type="submit">
              {busy ? "Creating…" : "Create account →"}
            </button>
          </form>

          <div className="login__alt-actions">
            <a href="/login">Already have an account?</a>
          </div>
        </div>
        <div className="login__footer">
          <img src="/ma-logo.png" alt="" className="login__footer-mark" style={{ background: "transparent", objectFit: "cover" }} />
          Powered by Modern Amenities · AOC Operator Network
        </div>
      </div>
      <aside className="login__right">
        <div className="login__right-eyebrow">JOIN THE PIPELINE</div>
        <h2 className="login__right-h">One handoff in, one order out — and you see exactly when and how much.</h2>
        <p className="login__right-sub">A shared workspace between McKenzie SewOn and Modern Amenities.</p>
      </aside>
    </div>
  );
}
