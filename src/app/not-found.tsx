import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center py-10">
      <div className="glass-card max-w-xl p-8 text-center">
        <p className="section-kicker">404</p>
        <h1 className="text-3xl font-semibold text-slate-950">这个公开主页还不存在</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          你可以先去工作台创建自己的简历主页，或者先查看示例版本了解效果。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button>进入工作台</Button>
          </Link>
          <Link href="/p/demo-resume">
            <Button variant="secondary">查看示例</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

