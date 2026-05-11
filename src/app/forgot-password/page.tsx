"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfo(`Reset link sent to ${email}.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="login theme-mckenzie">
      <div className="login__left">
        <div className="login__brand">
          <div className="login__brand-mark" style={{ background: "transparent", padding: 4 }}><img src="/mckenzie-logo.png" alt="McKenzie SewOn" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
          <div>
            <div className="login__brand-name">McKenzie SewOn</div>
            <div className="login__brand-sub">LEAD TRACKER</div>
          </div>
        </div>
        <div className="login__form-wrap">
          <h1 className="login__h1">Reset your<br />password.</h1>
          <p className="login__sub">Enter your work email — we&apos;ll send a link to set a new password.</p>
          <form onSubmit={submit} className="login__form">
            <label>Work email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@modern-amenities.com" />
            </label>
            {err && <div className="login__err">{err}</div>}
            {info && <div className="login__info">{info}</div>}
            <button className="btn btn--primary login__submit" disabled={busy} type="submit">
              {busy ? "Sending…" : "Send reset link →"}
            </button>
          </form>
          <div className="login__alt-actions"><a href="/login">Back to sign in</a></div>
        </div>
        <div className="login__footer"><img src="/ma-logo.png" alt="" className="login__footer-mark" style={{ background: "transparent", objectFit: "cover" }} />Powered by Modern Amenities · AOC Operator Network</div>
      </div>
      <aside className="login__right">
        <div className="login__right-eyebrow">RESET</div>
        <h2 className="login__right-h">Locked out? One link gets you back in.</h2>
        <p className="login__right-sub">Reset emails come from Supabase Auth and expire after 1 hour.</p>
      </aside>
    </div>
  );
}
