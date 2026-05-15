"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Palette,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const carouselItems = [
  {
    label: "AI 简历解析",
    desc: "上传 PDF，秒级提取全部信息",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    icon: ScanSearch,
  },
  {
    label: "岗位定向优化",
    desc: "输入岗位名，一键生成匹配版本",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: Sparkles,
  },
  {
    label: "专业模板导出",
    desc: "4 套模板 · A4 竖版 · 所见即所得",
    gradient: "from-orange-500 via-rose-500 to-red-500",
    icon: Download,
  },
  {
    label: "数据安全可控",
    desc: "简历加密存储 · 仅你可见",
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    icon: ShieldCheck,
  },
];

const features = [
  { icon: ScanSearch, title: "导入即解析", desc: "上传 PDF 或 Word，AI 自动识别姓名、教育、经历等全部字段" },
  { icon: Sparkles, title: "岗位定向优化", desc: "只输入目标岗位名称，AI 自动分析要求并重写简历内容" },
  { icon: Palette, title: "4 套专业模板", desc: "极光橙 · 石墨灰 · 经典黑 · 深海蓝，一键切换即时预览" },
  { icon: Download, title: "高质量 PDF 导出", desc: "A4 竖版、页边距、孤行控制，导出效果媲美专业排版" },
];

export function LandingPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const item = carouselItems[current];
  const Icon = item.icon;

  return (
    <main className="app-shell pb-16 pt-6 sm:pt-10 lg:pb-24">
      {/* Hero */}
      <section className="grid items-center gap-10 pb-12 pt-4 lg:grid-cols-[1fr_480px] lg:pt-12">
        <div>
          <div className="mb-5 inline-block rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-2.5 text-base font-bold text-white shadow-lg shadow-purple-500/25">
            投不同岗，不用重写简历
          </div>

          <h1 className="max-w-2xl font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            一份简历，
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              适配所有岗位
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
            应届生专属 AI 简历平台。上传简历 → AI 解析 → 岗位优化 → 导出 PDF，三步告别重复改简历。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth">
              <Button className="gap-2 px-6 py-3 text-base">
                免费开始使用
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/p/demo-resume">
              <Button variant="secondary" className="gap-2 px-6 py-3 text-base">
                <FileText size={18} />
                查看示例简历
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-8 text-sm text-slate-400">
            <span>无需下载 · 网页即用 · 数据加密</span>
          </div>
        </div>

        {/* Auto-rotating showcase */}
        <div className="glass-card overflow-hidden p-4">
          <div
            className={`flex h-[420px] flex-col items-center justify-center rounded-[28px] bg-gradient-to-br ${item.gradient} p-8 text-center text-white transition-all duration-500`}
          >
            <Icon size={56} className="mb-4 opacity-80" />
            <p className="text-2xl font-bold">{item.label}</p>
            <p className="mt-2 text-sm opacity-80">{item.desc}</p>
            {/* Dots */}
            <div className="mt-6 flex gap-2">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">What You Get</p>
          <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            更聪明的简历工作方式
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: FIcon, title, desc }) => (
            <div key={title} className="glass-card p-6">
              <div className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <FIcon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="glass-card overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-800 p-10 text-center text-white sm:p-16">
          <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-tight sm:text-4xl">
            还在为每个岗位重写简历？
          </h2>
          <p className="mt-4 text-lg text-white/60">
            投不同岗，不用重写简历。AI 帮你搞定。
          </p>
          <div className="mt-8">
            <Link href="/auth">
              <Button className="gap-2 bg-white px-8 py-4 text-base font-semibold text-slate-900 hover:bg-white/90">
                免费注册
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
