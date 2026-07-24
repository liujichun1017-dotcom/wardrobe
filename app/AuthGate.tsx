"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function AuthGate() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="profile-orbit">衣</div>
        <p className="eyebrow">WARDROBE ARCHIVE</p>
        <h1>衣橱档案</h1>
        <p>{mode === "signup" ? "注册一个账号，把衣橱带在身边" : "登录后进入你的私人衣橱"}</p>
        <form onSubmit={submit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            required
            minLength={6}
          />
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button wide" type="submit" disabled={busy}>
            {busy ? "处理中…" : mode === "signup" ? "注册" : "登录"}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "已有账号？去登录" : "没有账号？去注册"}
        </button>
      </div>
    </main>
  );
}
