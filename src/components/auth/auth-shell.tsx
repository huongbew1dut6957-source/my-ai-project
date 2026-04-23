"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Lock, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthShell() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    setFeedback(null);

    startTransition(() => {
      void (async () => {
        const client = getSupabaseBrowserClient();

        if (!client) {
          setError("请先在 .env.local 中配置 Supabase 环境变量。");
          return;
        }

        if (mode === "signin") {
          const { error: signInError } = await client.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setError(signInError.message);
            return;
          }

          window.location.href = "/dashboard";
          return;
        }

        const { error: signUpError } = await client.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setFeedback("注册成功，请去邮箱确认后再登录。");
        setMode("signin");
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
          你可以创建自己的公开主页、管理作品集、切换主题并导出 PDF。登录能力基于
          Supabase Auth 的邮箱密码方案实现。
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
              目前项目代码已经接好了认证逻辑，但你还需要把 Supabase 项目的 URL 和匿名密钥写进
              `.env.local`，然后执行 `supabase/schema.sql` 中的建表脚本。
            </p>
            <Link href="/dashboard">
              <Button>先进入演示工作台</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-2 rounded-full bg-black/5 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${
                  mode === "signin" ? "bg-slate-950 text-white" : "text-slate-600"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn size={16} />
                  登录
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${
                  mode === "signup" ? "bg-slate-950 text-white" : "text-slate-600"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={16} />
                  注册
                </span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="editor-label">邮箱</label>
                <input
                  className="editor-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className="editor-label">密码</label>
                <input
                  className="editor-input"
                  type="password"
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {feedback ? <p className="mt-4 text-sm text-emerald-600">{feedback}</p> : null}
            {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

            <Button className="mt-6 w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "提交中..." : mode === "signin" ? "登录并进入控制台" : "注册账号"}
            </Button>
          </>
        )}
      </section>
    </main>
  );
}

