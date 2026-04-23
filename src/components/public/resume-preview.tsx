"use client";

import { Eye, Link2, MousePointerClick, ScanText } from "lucide-react";
import type { ResumeProfile } from "@/lib/types";
import {
  LANDSCAPE_STAGE_HEIGHT,
  LANDSCAPE_STAGE_WIDTH,
  ResumeStage,
} from "@/components/public/resume-stage";

export function ResumePreview({
  resume,
  publicUrl,
}: {
  resume: ResumeProfile;
  publicUrl: string;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-b border-black/5 bg-slate-950 px-5 py-6 text-white lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
            <Eye size={14} />
            Live Preview
          </div>
          <h2 className="mt-4 text-2xl font-semibold">横向预览工作区</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            这里固定展示桌面端布局，避免右侧粘性区域和下方模块发生重叠。滚动区域只保留预览本身。
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-2xl bg-white/6 px-4 py-3">
              <ScanText size={16} className="mt-0.5 shrink-0" />
              <span className="leading-6">实时预览更偏网页展示，PDF 会使用独立的 A4 模板导出。</span>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/6 px-4 py-3">
              <MousePointerClick size={16} className="mt-0.5 shrink-0" />
              <span className="leading-6">如果内容很多，先精炼描述，单页 PDF 的完成度会更高。</span>
            </div>
          </div>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-200"
          >
            <Link2 size={15} />
            打开公开主页
          </a>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="rounded-[28px] bg-[#efe7db] p-3 sm:p-4">
            <div
              id="resume-live-preview"
              className="overflow-auto rounded-[24px] border border-black/10 bg-white/50"
              style={{
                height: "min(72vh, 760px)",
              }}
            >
              <div
                className="p-3"
                style={{
                  minWidth: LANDSCAPE_STAGE_WIDTH + 24,
                  minHeight: LANDSCAPE_STAGE_HEIGHT + 24,
                }}
              >
                <ResumeStage resume={resume} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
