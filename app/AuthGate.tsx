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
  const [notice, setNotice] = useState("");

  function authErrorMessage(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes("invalid login credentials")) return "邮箱或密码不正确";
    if (lower.includes("email not confirmed")) return "请先到邮箱完成验证";
    if (lower.includes("user already registered")) return "这个邮箱已经注册过了";
    if (lower.includes("password")) return "密码至少需要 6 位";
    if (lower.includes("rate limit")) return "尝试次数太多，请稍后再试";
    return "暂时没有成功，请稍后再试";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) setError(authErrorMessage(signUpError.message));
      else if (!data.session) setNotice("注册成功，请到邮箱完成验证后再登录。");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) setError(authErrorMessage(signInError.message));
    }
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
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
          />
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-success">{notice}</p>}
          <button className="primary-button wide" type="submit" disabled={busy}>
            {busy ? "处理中…" : mode === "signup" ? "注册" : "登录"}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
            setNotice("");
          }}
        >
          {mode === "signup" ? "已有账号？去登录" : "没有账号？去注册"}
        </button>
      </div>
    </main>
  );
}
