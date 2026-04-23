import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Download,
  Globe,
  Palette,
  Sparkles,
} from "lucide-react";
import { PublicResumePage } from "@/components/public/public-resume-page";
import { Button } from "@/components/ui/button";
import { demoResume } from "@/lib/data/demo-resume";
import { themeEntries } from "@/lib/themes";

const features = [
  {
    title: "登录后继续编辑",
    description: "邮箱 + 密码注册登录，简历内容和主题配置会安全存进 Supabase。",
    icon: Sparkles,
  },
  {
    title: "简历 + 作品集双栏主页",
    description: "公开页把你的经历、技能和作品放在一个分享链接里，适合投递和社媒展示。",
    icon: Globe,
  },
  {
    title: "一键切换主题与导出 PDF",
    description: "同一份内容适配不同岗位语境，支持直接导出高质量 PDF。",
    icon: Download,
  },
  {
    title: "岗位推荐",
    description: "根据技能、项目与经历关键词，智能给出更匹配的投递方向。",
    icon: Briefcase,
  },
];

export function LandingPage() {
  return (
    <main className="app-shell pb-16 pt-6 sm:pt-8 lg:pb-24">
      <section className="hero-glow grid items-center gap-10 pb-14 pt-6 lg:grid-cols-[minmax(0,1fr)_560px] lg:pt-12">
        <div>
          <div className="section-kicker">AI Resume Platform</div>
          <h1 className="max-w-3xl font-[family-name:var(--font-fraunces)] text-5xl leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            把简历、作品集和岗位推荐
            <span className="text-orange-500"> 合成一张能打的网页名片</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            这个项目基于 Next.js + Supabase 构建，借鉴了 upcv.tech
            的强视觉首页、模板切换与动态展示节奏，但更强调“左侧简历 + 右侧作品集”的个人主页体验。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button>
                开始制作
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/p/demo-resume">
              <Button variant="secondary">查看示例主页</Button>
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Metric value="4+" label="主题模板" />
            <Metric value="6" label="核心模块" />
            <Metric value="1 链接" label="简历与作品集统一分享" />
          </div>
        </div>

        <div className="glass-card overflow-hidden p-3">
          <div className="flex items-center justify-between rounded-[24px] bg-slate-950 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">动态网页简历预览</p>
              <p className="mt-1 text-xs text-white/70">滚动展示、主题切换、投递即分享</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <Palette size={14} />
              {themeEntries.length} Themes
            </div>
          </div>
          <div className="mt-3 h-[540px] overflow-hidden rounded-[28px]">
            <PublicResumePage
              resume={demoResume}
              preview
              className="origin-top scale-[0.88] sm:scale-[0.82]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map(({ title, description, icon: Icon }) => (
          <div key={title} className="glass-card p-6">
            <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
              <Icon size={20} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </div>
        ))}
      </section>

      <section className="pt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="section-kicker">Theme Lab</div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight text-slate-950">
              一份内容，多种叙事风格
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            你可以针对不同岗位切换视觉语气，让同一份经历在产品、技术、增长或设计场景下呈现得更合适。
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {themeEntries.map((theme) => (
            <div key={theme.id} className="glass-card overflow-hidden p-4">
              <div className={`h-32 rounded-[24px] bg-gradient-to-br ${theme.preview}`} />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{theme.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{theme.eyebrow}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
    </div>
  );
}

