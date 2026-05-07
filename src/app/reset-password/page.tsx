"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null);
    if (password !== confirm) { setErr("Passwords don't match"); return; }
    if (password.length < 8) { setErr("At least 8 characters"); return; }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setInfo("Password updated. Redirecting…");
      setTimeout(() => router.push("/"), 1000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <div className="login__brand-mark">MS</div>
          <div>
            <div className="login__brand-name">McKenzie SewOn</div>
            <div className="login__brand-sub">LEAD TRACKER</div>
          </div>
        </div>
        <div className="login__form-wrap">
          <h1 className="login__h1">Set a new<br />password.</h1>
          <p className="login__sub">Pick something you&apos;ll remember. At least 8 characters.</p>
          <form onSubmit={submit} className="login__form">
            <label>New password
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label>Confirm
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            {err && <div className="login__err">{err}</div>}
            {info && <div className="login__info">{info}</div>}
            <button className="btn btn--primary login__submit" disabled={busy} type="submit">
              {busy ? "Updating…" : "Update password →"}
            </button>
          </form>
        </div>
        <div className="login__footer"><span className="login__footer-mark">M</span>Powered by Modern Amenities · AOC Operator Network</div>
      </div>
      <aside className="login__right">
        <div className="login__right-eyebrow">SET PASSWORD</div>
        <h2 className="login__right-h">Almost there. New password, new session.</h2>
      </aside>
    </div>
  );
}
