"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Lock, LogIn, Mail, Smartphone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "phone" | "email-signin" | "email-signup";

export function AuthShell() {
  const [mode, setMode] = useState<AuthMode>("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getClient = () => {
    const client = getSupabaseBrowserClient();
    if (!client) setError("请先在 .env.local 中配置 Supabase 环境变量。");
    return client;
  };

  const handleSendCode = () => {
    setError(null);
    const client = getClient();
    if (!client) return;

    const clean = phone.replace(/\s+/g, "");
    if (!clean || clean.length < 11) {
      setError("请输入正确的手机号码。");
      return;
    }

    startTransition(() => {
      void (async () => {
        const { error: sendError } = await client.auth.signInWithOtp({
          phone: clean.startsWith("+") ? clean : `+86${clean}`,
        });
        if (sendError) {
          setError(sendError.message);
        } else {
          setCodeSent(true);
          setFeedback("验证码已发送，请查收短信。");
        }
      })();
    });
  };

  const handleVerifyCode = () => {
    setError(null);
    setFeedback(null);
    const client = getClient();
    if (!client) return;

    const clean = phone.replace(/\s+/g, "");
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("请输入验证码。");
      return;
    }
    if (!clean || clean.length < 11) {
      setError("手机号格式不正确。");
      return;
    }

    startTransition(() => {
      void (async () => {
        const { error: verifyError } = await client.auth.verifyOtp({
          phone: clean.startsWith("+") ? clean : `+86${clean}`,
          token: trimmedCode,
          type: "sms",
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
        window.location.href = "/dashboard";
      })();
    });
  };

  const handleEmailAuth = () => {
    setError(null);
    setFeedback(null);
    const client = getClient();
    if (!client) return;

    startTransition(() => {
      void (async () => {
        if (mode === "email-signin") {
          const { error: signInError } = await client.auth.signInWithPassword({ email, password });
          if (signInError) { setError(signInError.message); return; }
          window.location.href = "/dashboard";
          return;
        }

        const { error: signUpError } = await client.auth.signUp({ email, password });
        if (signUpError) { setError(signUpError.message); return; }
        setFeedback("注册成功，请去邮箱确认后再登录。");
        setMode("email-signin");
      })();
    });
  };

  return (
    <main className="app-shell grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[1.1fr_480px]">
      <section>
        <div className="section-kicker">Auth</div>
        <h1 className="max-w-3xl font-[family-name:var(--font-fraunces)] text-5xl leading-[0.98] tracking-tight text-slate-950 sm:text-6xl">
          登录后继续打磨你的
          <span className="text-orange-500"> AI 网页简历</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
          手机号一键登录，或用邮箱密码注册。登录后简历数据安全存于云端。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">
              进入控制台
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/p/demo-resume">
            <Button variant="ghost">先看示例主页</Button>
          </Link>
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        {!isSupabaseConfigured ? (
          <div className="space-y-4">
            <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">需要先连接 Supabase</h2>
            <p className="text-sm leading-7 text-slate-600">
              目前项目代码已经接好了认证逻辑，但需要把 Supabase URL 和 Key 写进 `.env.local`
            </p>
            <Link href="/dashboard">
              <Button>先进入演示工作台</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Mode tabs */}
            <div className="mb-6 flex gap-2 rounded-full bg-black/5 p-1">
              {([
                { id: "phone" as const, label: "手机登录", icon: Smartphone },
                { id: "email-signin" as const, label: "邮箱登录", icon: Mail },
                { id: "email-signup" as const, label: "注册", icon: UserPlus },
              ]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setMode(id); setError(null); setFeedback(null); setCodeSent(false); }}
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${
                    mode === id ? "bg-slate-950 text-white" : "text-slate-600"
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Icon size={16} />
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Phone auth */}
            {mode === "phone" ? (
              <div className="space-y-4">
                <div>
                  <label className="editor-label">手机号</label>
                  <div className="flex gap-2">
                    <input
                      className="editor-input flex-1"
                      type="tel"
                      placeholder="输入手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSendCode}
                      disabled={isPending || codeSent}
                      className="shrink-0"
                    >
                      {codeSent ? "已发送" : "获取验证码"}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="editor-label">验证码</label>
                  <input
                    className="editor-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="输入 6 位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <Button className="w-full" onClick={handleVerifyCode} disabled={isPending || !codeSent}>
                  {isPending ? "验证中..." : "登录"}
                </Button>
              </div>
            ) : (
              /* Email auth */
              <div className="space-y-4">
                <div>
                  <label className="editor-label">邮箱</label>
                  <input
                    className="editor-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="editor-label">密码</label>
                  <input
                    className="editor-input"
                    type="password"
                    placeholder="至少 6 位"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <Button className="w-full" onClick={handleEmailAuth} disabled={isPending}>
                  {isPending ? "提交中..." : mode === "email-signin" ? "登录" : "注册账号"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
