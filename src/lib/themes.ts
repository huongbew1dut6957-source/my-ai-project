import type { CSSProperties } from "react";
import type { ThemeName } from "@/lib/types";

const baseShadow =
  "0 18px 45px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.5)";

export const themeMap: Record<
  ThemeName,
  {
    label: string;
    eyebrow: string;
    preview: string;
    style: CSSProperties;
  }
> = {
  aurora: {
    label: "极光橙",
    eyebrow: "产品 / 设计 / AI",
    preview: "from-rose-200 via-white to-sky-200",
    style: {
      "--resume-bg": "#fffdf7",
      "--resume-surface": "#ffffff",
      "--resume-surface-muted": "#f6efe7",
      "--resume-line": "#eadfd0",
      "--resume-text": "#211f1b",
      "--resume-text-soft": "#645d55",
      "--resume-accent": "#ff6a3d",
      "--resume-accent-soft": "#ffe2d7",
      "--resume-highlight": "#2151ff",
      "--resume-shadow": baseShadow,
    } as CSSProperties,
  },
  graphite: {
    label: "石墨灰",
    eyebrow: "开发 / 数据 / 咨询",
    preview: "from-slate-300 via-slate-100 to-white",
    style: {
      "--resume-bg": "#f5f7fb",
      "--resume-surface": "#ffffff",
      "--resume-surface-muted": "#eff2f6",
      "--resume-line": "#dbe3ef",
      "--resume-text": "#101828",
      "--resume-text-soft": "#475467",
      "--resume-accent": "#0f766e",
      "--resume-accent-soft": "#d8f4ef",
      "--resume-highlight": "#334155",
      "--resume-shadow": baseShadow,
    } as CSSProperties,
  },
  ember: {
    label: "经典黑",
    eyebrow: "金融 / 咨询 / 商务",
    preview: "from-slate-400 via-gray-200 to-white",
    style: {
      "--resume-bg": "#fafafa",
      "--resume-surface": "#ffffff",
      "--resume-surface-muted": "#f5f5f5",
      "--resume-line": "#e0e0e0",
      "--resume-text": "#111111",
      "--resume-text-soft": "#555555",
      "--resume-accent": "#1a1a1a",
      "--resume-accent-soft": "#e8e8e8",
      "--resume-highlight": "#333333",
      "--resume-shadow": baseShadow,
    } as CSSProperties,
  },
  ocean: {
    label: "深海蓝",
    eyebrow: "出海 / 品牌 / 视觉",
    preview: "from-cyan-200 via-sky-50 to-white",
    style: {
      "--resume-bg": "#f4fcff",
      "--resume-surface": "#ffffff",
      "--resume-surface-muted": "#eaf7fb",
      "--resume-line": "#cfe8ef",
      "--resume-text": "#0f1f2f",
      "--resume-text-soft": "#4c6377",
      "--resume-accent": "#0677af",
      "--resume-accent-soft": "#d8f2ff",
      "--resume-highlight": "#0f766e",
      "--resume-shadow": baseShadow,
    } as CSSProperties,
  },
};

export const themeEntries = Object.entries(themeMap).map(([key, value]) => ({
  id: key as ThemeName,
  ...value,
}));

