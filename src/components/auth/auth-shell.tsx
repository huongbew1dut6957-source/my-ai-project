"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Download, FileText, Lock, LogIn, ScanSearch, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "email-signin" | "email-signup";

const features = [
  {
    icon: ScanSearch,
    title: "上传 PDF 自动解析",
    desc: "导入简历文档，AI 精准提取全部信息",
  },
  {
    icon: Sparkles,
    title: "岗位定向优化",
    desc: "输入目标岗位，一键生成匹配版本",
  },
  {
    icon: Download,
    title: "专业模板导出",
    desc: "4 套模板即时切换，A4 竖版 PDF 输出",
  },
  {
    icon: ShieldCheck,
    title: "数据安全存储",
    desc: "简历数据加密保存，仅你可见",
  },
];

export function AuthShell() {
  const [mode, setMode] = useState<AuthMode>("email-signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getClient = () => {
    const client = getSupabaseBrowserClient();
    if (!client) setError("请先在 .env.local 中配置 Supabase 环境变量。");
    return client;
  };

  const handleSubmit = () => {
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
    <main className="app-shell grid min-h-screen lg:grid-cols-[1fr_440px]">
      {/* Left — Branding */}
      <section className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="max-w-xl">
          {/* Slogan badge */}
          <div className="mb-6 inline-block rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-purple-500/25">
            投不同岗，不用重写简历
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            你的 AI 简历工作台
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
            专为应届生打造的智能简历工具。上传、优化、导出，三步拿到专业简历。
          </p>

          {/* Feature grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-black/5 bg-white/60 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Icon size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-10 flex items-center gap-6 text-xs text-slate-400">
            <Link href="/p/demo-resume" className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors">
              <FileText size={14} />
              查看示例简历
            </Link>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              数据加密存储
            </span>
          </div>
        </div>
      </section>

      {/* Right — Auth form */}
      <section className="flex items-center border-l border-black/5 bg-white/40 px-6 py-16 sm:px-10 backdrop-blur-sm">
        <div className="w-full max-w-sm mx-auto">
          {!isSupabaseConfigured ? (
            <div className="text-center space-y-4">
              <div className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Lock size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">需要先连接 Supabase</h2>
              <p className="text-sm leading-6 text-slate-500">
                在 `.env.local` 中配置 Supabase URL 和 Key
              </p>
              <Link href="/dashboard">
                <Button>先进入演示工作台</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-2 text-center">
                <h2 className="text-xl font-semibold text-slate-950">欢迎回来</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {mode === "email-signin" ? "登录你的账号继续编辑" : "创建账号开始制作简历"}
                </p>
              </div>

              {/* Mode tabs */}
              <div className="mt-6 flex gap-2 rounded-full bg-black/5 p-1">
                {([
                  { id: "email-signin" as const, label: "登录", icon: LogIn },
                  { id: "email-signup" as const, label: "注册", icon: UserPlus },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setMode(id); setError(null); setFeedback(null); }}
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                      mode === id ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Icon size={16} />
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">邮箱</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
                  <input
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    type="password"
                    placeholder="至少 6 位"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? "提交中..." : mode === "email-signin" ? "登录" : "创建账号"}
                  {!isPending ? <ArrowRight size={16} /> : null}
                </Button>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                登录即表示同意我们的服务条款和隐私政策
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
