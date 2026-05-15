"use client";

import type { ResumeProfile, ThemeName } from "@/lib/types";
import { themeEntries } from "@/lib/themes";
import { ResumeStage } from "@/components/public/resume-stage";

export function ResumePreview({
  resume,
  onThemeChange,
}: {
  resume: ResumeProfile;
  onThemeChange?: (theme: ThemeName) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
          实时预览
        </div>
        <div className="flex items-center gap-1">
          {themeEntries.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeChange?.(theme.id as ThemeName)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                resume.theme === theme.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <ResumeStage resume={resume} />
      </div>
    </div>
  );
}
