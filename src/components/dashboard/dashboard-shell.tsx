"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useEffectEvent, useState, useTransition } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  Briefcase,
  Check,
  ExternalLink,
  FileDown,
  Link2,
  LoaderCircle,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ResumePreview } from "@/components/public/resume-preview";
import { ResumePdfPage } from "@/components/public/resume-pdf-page";
import { Button } from "@/components/ui/button";
import { demoResume } from "@/lib/data/demo-resume";
import {
  buildResumeSyncPayload,
  getMarkdownEditorUrl,
  LATEST_RESUME_MARKDOWN_KEY,
} from "@/lib/resume-sync";
import { themeEntries } from "@/lib/themes";
import type {
  AwardItem,
  CampusItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  RecommendationItem,
  ResumeProfile,
  SkillGroup,
  ThemeName,
} from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  commaToArray,
  createEmptyResume,
  linesToArray,
  newId,
  normalizeResumeProfile,
  slugify,
  timeLabel,
} from "@/lib/utils";

interface TailorExperience {
  id: string;
  tailoredHighlights: string[];
}

interface TailorProject {
  id: string;
  tailoredDescription: string;
  tailoredImpact: string;
}

interface TailorResponse {
  experiences: TailorExperience[];
  projects: TailorProject[];
}

const DRAFT_KEY = "ai-resume-platform-demo";

export function DashboardShell() {
  const [resume, setResume] = useState<ResumeProfile>(demoResume);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState("正在载入...");
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [jobRequirements, setJobRequirements] = useState("");
  const [tailoringResult, setTailoringResult] = useState<TailorResponse | null>(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [tailorError, setTailorError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<ResumeProfile | null>(null);
  const [parseError, setParseError] = useState("");
  const [parsePreviewOpen, setParsePreviewOpen] = useState(false);
  const [parsedSections, setParsedSections] = useState<Record<string, boolean>>({
    basic: true,
    experiences: true,
    projects: true,
    education: true,
    campus: true,
    skills: true,
    awards: true,
  });
  const [isSaving, startSaveTransition] = useTransition();
  const deferredResume = useDeferredValue(resume);
  const supabaseClient = getSupabaseBrowserClient();
  const isDemoMode = !supabaseClient;

  const loadSessionState = useEffectEvent(async (incoming: Session | null) => {
    if (!supabaseClient) {
      const localDraft = window.localStorage.getItem(DRAFT_KEY);
      if (localDraft) {
        setResume(normalizeResumeProfile(JSON.parse(localDraft)));
        setStatus("演示模式：使用本地草稿");
      } else {
        setResume(demoResume);
        setStatus("演示模式：已载入示例内容");
      }
      setAuthReady(true);
      return;
    }

    setSession(incoming);

    if (!incoming) {
      setAuthReady(true);
      setStatus("请先登录后保存到云端");
      return;
    }

    setStatus("正在同步你的简历...");
    const { data, error } = await supabaseClient
      .from("resume_profiles")
      .select("*")
      .eq("user_id", incoming.user.id)
      .maybeSingle();

    if (error) {
      setStatus("读取失败，已载入默认模板");
      setResume(
        normalizeResumeProfile({
          ...createEmptyResume(),
          slug: slugify(incoming.user.email?.split("@")[0] || "resume"),
          basics: {
            ...createEmptyResume().basics,
            email: incoming.user.email ?? "",
          },
        }),
      );
      setAuthReady(true);
      return;
    }

    if (data) {
      setResume(normalizeResumeProfile(data));
      setStatus("已从 Supabase 同步最新内容");
    } else {
      setResume(
        normalizeResumeProfile({
          ...demoResume,
          user_id: incoming.user.id,
          slug: slugify(incoming.user.email?.split("@")[0] || "resume"),
          basics: {
            ...demoResume.basics,
            email: incoming.user.email ?? demoResume.basics.email,
          },
        }),
      );
      setStatus("首次登录，已为你生成一份默认模板");
    }

    setAuthReady(true);
  });

  useEffect(() => {
    if (!supabaseClient) {
      const timer = window.setTimeout(() => {
        void loadSessionState(null);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    const initialize = async () => {
      const result = await supabaseClient.auth.getSession();
      void loadSessionState(result.data.session);
    };

    void initialize();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
      void loadSessionState(nextSession);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  useEffect(() => {
    if (isDemoMode && authReady) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(resume));
    }
  }, [authReady, isDemoMode, resume]);

  const syncMarkdownToLocal = (profile: ResumeProfile) => {
    const { markdown } = buildResumeSyncPayload(profile);
    window.localStorage.setItem(LATEST_RESUME_MARKDOWN_KEY, markdown);
    return markdown;
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRecommendationLoading(true);

      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deferredResume),
          signal: controller.signal,
        });

        const data = (await response.json()) as { items?: RecommendationItem[] };
        setRecommendations(data.items ?? []);
      } catch {
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [deferredResume]);

  const saveResume = () => {
    startSaveTransition(() => {
      void (async () => {
        const nextUpdatedAt = new Date().toISOString();
        const syncPayload = buildResumeSyncPayload(resume);
        window.localStorage.setItem(LATEST_RESUME_MARKDOWN_KEY, syncPayload.markdown);

        if (!supabaseClient || !session) {
          const draft = {
            ...resume,
            updated_at: nextUpdatedAt,
          };
          setResume(draft);
          window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          setStatus("已保存到浏览器本地草稿，并同步 Markdown");
          return;
        }

        const payload = {
          user_id: session.user.id,
          slug: resume.slug,
          theme: resume.theme,
          visibility: resume.visibility,
          basics: resume.basics,
          experiences: resume.experiences,
          projects: resume.projects,
          skills: resume.skills,
          awards: resume.awards,
          education: resume.education,
          campus: resume.campus,
          updated_at: nextUpdatedAt,
        };

        const { error } = await supabaseClient
          .from("resume_profiles")
          .upsert(payload, { onConflict: "user_id" });

        if (error) {
          setStatus(`保存失败：${error.message}`);
          return;
        }

        const { error: resumesError } = await supabaseClient.from("resumes").upsert(
          {
            user_id: session.user.id,
            slug: resume.slug,
            data: syncPayload.data,
            markdown: syncPayload.markdown,
            updated_at: nextUpdatedAt,
          },
          { onConflict: "user_id" },
        );

        if (resumesError) {
          console.warn("Failed to sync resumes table:", resumesError.message);
        }

        setResume((current) => ({
          ...current,
          user_id: session.user.id,
          updated_at: nextUpdatedAt,
        }));
        setStatus(
          resumesError
            ? "已保存到 Supabase，resumes 表同步失败"
            : "已保存到 Supabase，并同步 Markdown",
        );
      })();
    });
  };

  const openMarkdownEditor = () => {
    const markdown = syncMarkdownToLocal(resume);
    const editorUrl = getMarkdownEditorUrl(markdown);
    window.open(editorUrl, "_blank", "noopener,noreferrer");
    setStatus("已生成最新版 Markdown，并打开 oh-my-cv 编辑器");
  };

  const handleTailor = async () => {
    if (!jobRequirements.trim()) return;
    setTailoringLoading(true);
    setTailorError("");
    setTailoringResult(null);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: {
            experiences: resume.experiences,
            projects: resume.projects,
          },
          jobRequirements: jobRequirements.trim(),
        }),
      });

      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        throw new Error(err.message ?? "请求失败");
      }

      const data = (await response.json()) as TailorResponse;
      setTailoringResult(data);
    } catch (err) {
      setTailorError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setTailoringLoading(false);
    }
  };

  const applyTailoredExperience = (tailored: TailorExperience) => {
    setResume((current) => ({
      ...current,
      experiences: current.experiences.map((exp) =>
        exp.id === tailored.id
          ? { ...exp, highlights: tailored.tailoredHighlights }
          : exp,
      ),
    }));
    setStatus("已应用该经历的优化建议");
  };

  const applyTailoredProject = (tailored: TailorProject) => {
    setResume((current) => ({
      ...current,
      projects: current.projects.map((proj) =>
        proj.id === tailored.id
          ? {
              ...proj,
              description: tailored.tailoredDescription,
              impact: tailored.tailoredImpact,
            }
          : proj,
      ),
    }));
    setStatus("已应用该项目的优化建议");
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setParseError("");
    setParsedProfile(null);
    setParsePreviewOpen(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        throw new Error(err.message ?? "解析失败");
      }

      const data = (await response.json()) as { profile: ResumeProfile };
      setParsedProfile(data.profile);
      setParsePreviewOpen(true);
      setStatus("简历解析完成，请预览并选择需要导入的内容。");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "未知错误");
      setStatus("解析失败，请检查文件格式或重试。");
    } finally {
      setIsUploading(false);
    }
  };

  const applyParsedResume = () => {
    if (!parsedProfile) return;

    setResume((current) => {
      const next = { ...current };

      if (parsedSections.basic) {
        next.basics = {
          ...current.basics,
          ...Object.fromEntries(
            Object.entries(parsedProfile.basics).filter(
              ([, v]) => v !== "",
            ),
          ),
        };
      }

      if (parsedSections.experiences && parsedProfile.experiences.length > 0) {
        next.experiences = parsedProfile.experiences.map((exp) => ({
          ...exp,
          id: exp.id || newId("exp"),
        }));
      }

      if (parsedSections.projects && parsedProfile.projects.length > 0) {
        next.projects = parsedProfile.projects.map((p) => ({
          ...p,
          id: p.id || newId("proj"),
        }));
      }

      if (parsedSections.education && parsedProfile.education.length > 0) {
        next.education = parsedProfile.education.map((e) => ({
          ...e,
          id: e.id || newId("edu"),
        }));
      }

      if (parsedSections.campus && parsedProfile.campus.length > 0) {
        next.campus = parsedProfile.campus.map((c) => ({
          ...c,
          id: c.id || newId("cam"),
        }));
      }

      if (parsedSections.skills && parsedProfile.skills.length > 0) {
        next.skills = parsedProfile.skills.map((s) => ({
          ...s,
          id: s.id || newId("skill"),
        }));
      }

      if (parsedSections.awards && parsedProfile.awards.length > 0) {
        next.awards = parsedProfile.awards.map((a) => ({
          ...a,
          id: a.id || newId("award"),
        }));
      }

      return next;
    });

    setParsedProfile(null);
    setParsePreviewOpen(false);
    setStatus("已导入解析内容，请检查并保存。");
  };

  const exportPdf = async () => {
    const target = document.getElementById("resume-export-source");
    if (!target) return;

    setStatus("正在生成高质量 PDF...");

    if ("fonts" in document) {
      await (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready;
    }

    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: target.scrollWidth,
      height: target.scrollHeight,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });

    const image = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imageWidth = pdfWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    let remainingHeight = imageHeight;
    let position = 0;

    pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
    remainingHeight -= pdf.internal.pageSize.getHeight();

    while (remainingHeight > 0) {
      position -= pdf.internal.pageSize.getHeight();
      pdf.addPage();
      pdf.addImage(image, "PNG", 0, position, imageWidth, imageHeight);
      remainingHeight -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`${resume.slug || "resume"}.pdf`);
    setStatus("PDF 已导出");
  };

  const signOut = async () => {
    if (!supabaseClient) {
      setStatus("当前是演示模式，无需退出登录");
      return;
    }

    await supabaseClient.auth.signOut();
    setSession(null);
    setStatus("已退出登录");
  };

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${resume.slug || "demo-resume"}`
      : `/p/${resume.slug || "demo-resume"}`;

  if (!authReady) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center py-10">
        <div className="glass-card flex items-center gap-3 px-6 py-5 text-slate-700">
          <LoaderCircle className="animate-spin" size={18} />
          正在准备你的工作台...
        </div>
      </div>
    );
  }

  if (!isDemoMode && !session) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center py-10">
        <div className="glass-card max-w-xl p-8 text-center">
          <p className="section-kicker">Secure Workspace</p>
          <h1 className="text-3xl font-semibold text-slate-950">登录后继续编辑你的简历站</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            当前项目已经接入 Supabase Auth。登录后，你的内容会以 `resume_profiles`
            的形式保存到数据库并同步到公开主页。
          </p>
          <div className="mt-6">
            <Link href="/auth">
              <Button>去登录 / 注册</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="app-shell py-6 sm:py-8">
      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass-card p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-3 inline-block rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-3 text-xl font-bold text-white shadow-lg shadow-purple-500/25">
                投不同岗，不用重写简历
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                你的 AI 简历工作台
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
                上传简历或从零开始编辑，AI 帮你持续适配不同岗位。导入 → 优化 → 导出，三步搞定。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={openMarkdownEditor}>
                <ExternalLink size={16} />
                打开 Markdown 编辑器
              </Button>
              <Button variant="secondary" onClick={exportPdf}>
                <FileDown size={16} />
                导出 PDF
              </Button>
              <Button onClick={saveResume} disabled={isSaving}>
                <Save size={16} />
                {isSaving ? "保存中..." : "保存"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => document.getElementById("resume-file-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Upload size={16} />
                )}
                {isUploading ? "解析中..." : "导入简历"}
              </Button>
              <input
                type="file"
                id="resume-file-upload"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = "";
                }}
              />
              <Button variant="ghost" onClick={signOut}>
                <LogOut size={16} />
                退出
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-sm font-semibold text-slate-900">当前状态</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{status}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            最近更新时间 · {timeLabel(resume.updated_at)}
          </p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-700"
          >
            <Link2 size={15} />
            {publicUrl}
          </a>
        </div>
      </div>

      {parseError ? (
        <div className="mb-6 glass-card border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-center gap-2 text-sm text-rose-700">
            <AlertTriangle size={16} />
            <span>{parseError}</span>
            <button
              type="button"
              className="ml-auto text-rose-500 hover:text-rose-700"
              onClick={() => setParseError("")}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {parsePreviewOpen && parsedProfile ? (
        <div className="mb-6 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-kicker">解析结果预览</p>
              <h2 className="text-xl font-semibold text-slate-950">从文件中识别的简历内容</h2>
              <p className="mt-1 text-sm text-slate-500">勾选需要导入的板块，点击"应用"合并到当前简历。</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setParsePreviewOpen(false);
                  setParsedProfile(null);
                }}
              >
                <X size={16} />
                取消
              </Button>
              <Button onClick={applyParsedResume}>
                <Check size={16} />
                应用选中内容
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 mb-5">
            {([
              { key: "basic", label: "基本信息" },
              { key: "experiences", label: "工作经历" },
              { key: "projects", label: "项目作品" },
              { key: "education", label: "教育经历" },
              { key: "campus", label: "校园经历" },
              { key: "skills", label: "技能" },
              { key: "awards", label: "获奖" },
            ] as const).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-3 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={parsedSections[key] ?? false}
                  onChange={(e) =>
                    setParsedSections((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {parsedProfile.basics.fullName ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">基本信息</p>
              <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                {parsedProfile.basics.fullName && <span>姓名: {parsedProfile.basics.fullName}</span>}
                {parsedProfile.basics.email && <span>邮箱: {parsedProfile.basics.email}</span>}
                {parsedProfile.basics.phone && <span>电话: {parsedProfile.basics.phone}</span>}
                {parsedProfile.basics.headline && (
                  <span>求职方向: {parsedProfile.basics.headline}</span>
                )}
                {parsedProfile.basics.location && (
                  <span>地点: {parsedProfile.basics.location}</span>
                )}
                {parsedProfile.basics.birth && (
                  <span>出生日期: {parsedProfile.basics.birth}</span>
                )}
              </div>
              {parsedProfile.basics.summary ? (
                <p className="mt-2 text-sm text-slate-500">
                  简介: {parsedProfile.basics.summary.slice(0, 120)}...
                </p>
              ) : null}
            </div>
          ) : null}

          {parsedProfile.experiences.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                工作经历 ({parsedProfile.experiences.length} 条)
              </p>
              {parsedProfile.experiences.map((exp, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{exp.company}</span> — {exp.role} ({exp.period})
                </div>
              ))}
            </div>
          ) : null}

          {parsedProfile.projects.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                项目作品 ({parsedProfile.projects.length} 条)
              </p>
              {parsedProfile.projects.map((p, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{p.title}</span>
                  {p.year ? ` (${p.year})` : ""}
                </div>
              ))}
            </div>
          ) : null}

          {parsedProfile.education.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                教育经历 ({parsedProfile.education.length} 条)
              </p>
              {parsedProfile.education.map((edu, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{edu.school}</span> — {edu.major} · {edu.degree} ({edu.period})
                </div>
              ))}
            </div>
          ) : null}

          {parsedProfile.campus.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                校园经历 ({parsedProfile.campus.length} 条)
              </p>
              {parsedProfile.campus.map((cam, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{cam.org}</span> — {cam.role} ({cam.period})
                </div>
              ))}
            </div>
          ) : null}

          {parsedProfile.skills.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                技能 ({parsedProfile.skills.reduce((acc, g) => acc + g.items.length, 0)} 个)
              </p>
              {parsedProfile.skills.map((group, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{group.category}:</span> {group.items.join("、")}
                </div>
              ))}
            </div>
          ) : null}

          {parsedProfile.awards.length > 0 ? (
            <div className="mb-3 p-4 rounded-2xl bg-slate-50 border border-black/5">
              <p className="text-sm font-semibold text-slate-800 mb-2">
                获奖 ({parsedProfile.awards.length} 条)
              </p>
              {parsedProfile.awards.map((award, i) => (
                <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-600">
                  <span className="font-medium">{award.title}</span>
                  {award.issuer ? ` — ${award.issuer}` : ""}
                  {award.year ? ` (${award.year})` : ""}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6">
        <ResumePreview
          resume={resume}
          onThemeChange={(theme) =>
            setResume((current) => ({ ...current, theme }))
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-5">
          <EditorCard
            title="基础信息与发布配置"
            description="维护公开主页的核心文案、分享链接和主题风格。"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="姓名"
                value={resume.basics.fullName}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, fullName: value },
                    slug:
                      current.slug === "my-ai-resume" && value
                        ? slugify(value)
                        : current.slug,
                  }))
                }
              />
              <Field
                label="求职方向"
                value={resume.basics.headline}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, headline: value },
                  }))
                }
              />
              <Field
                label="邮箱"
                value={resume.basics.email}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, email: value },
                  }))
                }
              />
              <Field
                label="电话"
                value={resume.basics.phone}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, phone: value },
                  }))
                }
              />
              <Field
                label="出生日期"
                value={resume.basics.birth}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, birth: value },
                  }))
                }
              />
              <Field
                label="地点"
                value={resume.basics.location}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, location: value },
                  }))
                }
              />
              <Field
                label="公开链接 Slug"
                value={resume.slug}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    slug: slugify(value) || current.slug,
                  }))
                }
              />
              <Field
                label="个人网站"
                value={resume.basics.website}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, website: value },
                  }))
                }
              />
              <Field
                label="GitHub"
                value={resume.basics.github}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, github: value },
                  }))
                }
              />
              <Field
                label="LinkedIn"
                value={resume.basics.linkedin}
                onChange={(value) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, linkedin: value },
                  }))
                }
              />
              <div>
                <label className="editor-label">可见性</label>
                <select
                  className="editor-input"
                  value={resume.visibility}
                  onChange={(event) =>
                    setResume((current) => ({
                      ...current,
                      visibility: event.target.value as ResumeProfile["visibility"],
                    }))
                  }
                >
                  <option value="public">公开</option>
                  <option value="private">私密</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="editor-label">个人简介</label>
              <textarea
                className="editor-input min-h-32"
                value={resume.basics.summary}
                onChange={(event) =>
                  setResume((current) => ({
                    ...current,
                    basics: { ...current.basics, summary: event.target.value },
                  }))
                }
                placeholder="概括你的核心能力、行业经验、代表成果与求职目标。"
              />
            </div>
            <div className="mt-5">
              <p className="editor-label">主题</p>
              <div className="grid gap-3 md:grid-cols-2">
                {themeEntries.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      setResume((current) => ({
                        ...current,
                        theme: theme.id as ThemeName,
                      }))
                    }
                    className={`rounded-[24px] border p-4 text-left transition ${
                      resume.theme === theme.id
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-black/10 bg-white hover:border-black/25"
                    }`}
                  >
                    <div className={`h-16 rounded-2xl bg-gradient-to-br ${theme.preview}`} />
                    <p className="mt-3 text-sm font-semibold">{theme.label}</p>
                    <p className={`mt-1 text-xs ${resume.theme === theme.id ? "text-white/70" : "text-slate-500"}`}>
                      {theme.eyebrow}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </EditorCard>

          <EditorCard
            title="实习 / 工作经历"
            description="建议每段经历突出结果、范围和你真正负责的部分。"
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setResume((current) => ({
                    ...current,
                    experiences: [
                      ...current.experiences,
                      {
                        id: newId("exp"),
                        company: "",
                        role: "",
                        period: "",
                        location: "",
                        highlights: [],
                      },
                    ],
                  }))
                }
              >
                <Plus size={15} />
                添加经历
              </Button>
            }
          >
            <div className="space-y-4">
              {resume.experiences.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">经历卡片</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-rose-600"
                      onClick={() =>
                        setResume((current) => ({
                          ...current,
                          experiences: current.experiences.filter((entry) => entry.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ListField item={item} field="company" label="公司" setResume={setResume} list="experiences" />
                    <ListField item={item} field="role" label="岗位" setResume={setResume} list="experiences" />
                    <ListField item={item} field="period" label="时间" setResume={setResume} list="experiences" />
                    <ListField item={item} field="location" label="地点" setResume={setResume} list="experiences" />
                  </div>
                  <div className="mt-4">
                    <label className="editor-label">成果亮点（每行一条）</label>
                    <textarea
                      className="editor-input min-h-28"
                      value={item.highlights.join("\n")}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          experiences: current.experiences.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, highlights: linesToArray(event.target.value) }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard
            title="项目作品"
            description="公开主页右侧会把这里的内容作为作品集展示。"
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setResume((current) => ({
                    ...current,
                    projects: [
                      ...current.projects,
                      {
                        id: newId("proj"),
                        title: "",
                        year: "",
                        description: "",
                        impact: "",
                        link: "",
                        tags: [],
                      },
                    ],
                  }))
                }
              >
                <Plus size={15} />
                添加项目
              </Button>
            }
          >
            <div className="space-y-4">
              {resume.projects.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">作品卡片</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-rose-600"
                      onClick={() =>
                        setResume((current) => ({
                          ...current,
                          projects: current.projects.filter((entry) => entry.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ProjectField item={item} field="title" label="项目名称" setResume={setResume} />
                    <ProjectField item={item} field="year" label="年份" setResume={setResume} />
                  </div>
                  <div className="mt-4">
                    <label className="editor-label">项目简介</label>
                    <textarea
                      className="editor-input min-h-28"
                      value={item.description}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          projects: current.projects.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, description: event.target.value }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <label className="editor-label">项目影响</label>
                    <textarea
                      className="editor-input min-h-24"
                      value={item.impact}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          projects: current.projects.map((entry) =>
                            entry.id === item.id ? { ...entry, impact: event.target.value } : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <ProjectField item={item} field="link" label="项目链接" setResume={setResume} />
                    <div>
                      <label className="editor-label">项目标签（逗号分隔）</label>
                      <input
                        className="editor-input"
                        value={item.tags.join(", ")}
                        onChange={(event) =>
                          setResume((current) => ({
                            ...current,
                            projects: current.projects.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, tags: commaToArray(event.target.value) }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EditorCard>
        </section>

        <section className="space-y-5">
          <EditorCard
            title="教育经历"
            description="按学历由高到低填写，课程用逗号分隔。"
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setResume((current) => ({
                    ...current,
                    education: [
                      ...current.education,
                      {
                        id: newId("edu"),
                        school: "",
                        major: "",
                        degree: "",
                        period: "",
                        gpa: "",
                        courses: [],
                      },
                    ],
                  }))
                }
              >
                <Plus size={15} />
                添加教育经历
              </Button>
            }
          >
            <div className="space-y-4">
              {resume.education.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">学历卡片</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-rose-600"
                      onClick={() =>
                        setResume((current) => ({
                          ...current,
                          education: current.education.filter((entry) => entry.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <EducationField item={item} field="school" label="学校" setResume={setResume} />
                    <EducationField item={item} field="major" label="专业" setResume={setResume} />
                    <EducationField item={item} field="degree" label="学历" setResume={setResume} />
                    <EducationField item={item} field="period" label="时间" setResume={setResume} />
                    <EducationField item={item} field="gpa" label="GPA" setResume={setResume} />
                  </div>
                  <div className="mt-4">
                    <label className="editor-label">主修课程（逗号分隔）</label>
                    <input
                      className="editor-input"
                      value={item.courses.join("、")}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          education: current.education.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, courses: commaToArray(event.target.value) }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard
            title="校园经历"
            description="社团、学生会、志愿者等在校活动经历。"
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setResume((current) => ({
                    ...current,
                    campus: [
                      ...current.campus,
                      {
                        id: newId("cam"),
                        org: "",
                        role: "",
                        period: "",
                        highlights: [],
                      },
                    ],
                  }))
                }
              >
                <Plus size={15} />
                添加校园经历
              </Button>
            }
          >
            <div className="space-y-4">
              {resume.campus.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">活动卡片</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-rose-600"
                      onClick={() =>
                        setResume((current) => ({
                          ...current,
                          campus: current.campus.filter((entry) => entry.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <CampusField item={item} field="org" label="组织" setResume={setResume} />
                    <CampusField item={item} field="role" label="角色" setResume={setResume} />
                    <CampusField item={item} field="period" label="时间" setResume={setResume} />
                  </div>
                  <div className="mt-4">
                    <label className="editor-label">活动亮点（每行一条）</label>
                    <textarea
                      className="editor-input min-h-28"
                      value={item.highlights.join("\n")}
                      onChange={(event) =>
                        setResume((current) => ({
                          ...current,
                          campus: current.campus.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, highlights: linesToArray(event.target.value) }
                              : entry,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard
            title="技能与获奖"
            description="技能会影响岗位推荐结果，获奖会展示在左侧亮点区。"
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">技能组</p>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setResume((current) => ({
                        ...current,
                        skills: [
                          ...current.skills,
                          { id: newId("skill"), category: "", items: [] },
                        ],
                      }))
                    }
                  >
                    <Plus size={15} />
                    添加技能组
                  </Button>
                </div>
                <div className="space-y-4">
                  {resume.skills.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm text-rose-600"
                          onClick={() =>
                            setResume((current) => ({
                              ...current,
                              skills: current.skills.filter((entry) => entry.id !== item.id),
                            }))
                          }
                        >
                          <Trash2 size={15} />
                          删除
                        </button>
                      </div>
                      <div className="space-y-4">
                        <SkillField item={item} field="category" label="技能分类" setResume={setResume} />
                        <div>
                          <label className="editor-label">技能关键词（逗号分隔）</label>
                          <input
                            className="editor-input"
                            value={item.items.join(", ")}
                            onChange={(event) =>
                              setResume((current) => ({
                                ...current,
                                skills: current.skills.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, items: commaToArray(event.target.value) }
                                    : entry,
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">获奖 / 证书</p>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setResume((current) => ({
                        ...current,
                        awards: [
                          ...current.awards,
                          {
                            id: newId("award"),
                            title: "",
                            issuer: "",
                            year: "",
                            description: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={15} />
                    添加奖项
                  </Button>
                </div>
                <div className="space-y-4">
                  {resume.awards.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm text-rose-600"
                          onClick={() =>
                            setResume((current) => ({
                              ...current,
                              awards: current.awards.filter((entry) => entry.id !== item.id),
                            }))
                          }
                        >
                          <Trash2 size={15} />
                          删除
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <AwardField item={item} field="title" label="奖项名称" setResume={setResume} />
                        <AwardField item={item} field="year" label="年份" setResume={setResume} />
                        <AwardField item={item} field="issuer" label="颁发机构" setResume={setResume} />
                      </div>
                      <div className="mt-4">
                        <label className="editor-label">说明</label>
                        <textarea
                          className="editor-input min-h-24"
                          value={item.description}
                          onChange={(event) =>
                            setResume((current) => ({
                              ...current,
                              awards: current.awards.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, description: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </EditorCard>
        </section>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <EditorCard
            title="岗位推荐"
            description="根据你填入的技能、项目和经历关键词，动态计算更适合的投递方向。"
          >
            <div className="space-y-3">
              {recommendationLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LoaderCircle className="animate-spin" size={16} />
                  正在分析内容...
                </div>
              ) : null}
              {recommendations.map((item) => (
                <div
                  key={item.role}
                  className="rounded-[24px] border border-black/10 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 text-slate-900">
                      <Briefcase size={16} />
                      <span className="font-semibold">{item.role}</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      匹配度 {item.match}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!recommendationLoading && recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">继续补充内容后，这里会给出更准确的岗位方向。</p>
              ) : null}
            </div>
          </EditorCard>

          <EditorCard
            title="岗位优化（AI）"
            description="粘贴目标岗位描述，AI 会重写你的经历与项目描述以提高匹配度。"
          >
            <div className="space-y-4">
              <div>
                <label className="editor-label">目标岗位描述 / 要求</label>
                <textarea
                  className="editor-input min-h-32"
                  value={jobRequirements}
                  onChange={(e) => {
                    setJobRequirements(e.target.value);
                    setTailoringResult(null);
                    setTailorError("");
                  }}
                  placeholder="粘贴岗位 JD、技术栈要求、职责描述..."
                />
              </div>

              <Button
                onClick={handleTailor}
                disabled={tailoringLoading || !jobRequirements.trim()}
              >
                {tailoringLoading ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {tailoringLoading ? "AI 优化中..." : "生成优化版"}
              </Button>

              {tailorError ? (
                <p className="text-sm text-rose-600">{tailorError}</p>
              ) : null}

              {tailoringResult ? (
                <div className="space-y-6">
                  {tailoringResult.experiences.map((item) => {
                    const original = resume.experiences.find((e) => e.id === item.id);
                    if (!original) return null;
                    return (
                      <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {original.role} @ {original.company}
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => applyTailoredExperience(item)}
                          >
                            应用
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">原文</p>
                            <ul className="space-y-1 text-sm text-slate-600">
                              {original.highlights.map((h, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">优化后</p>
                            <ul className="space-y-1 text-sm text-slate-900">
                              {item.tailoredHighlights.map((h, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                  <span>{h}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {tailoringResult.projects.map((item) => {
                    const original = resume.projects.find((p) => p.id === item.id);
                    if (!original) return null;
                    return (
                      <div key={item.id} className="rounded-[24px] border border-black/10 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {original.title}
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => applyTailoredProject(item)}
                          >
                            应用
                          </Button>
                        </div>
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">描述</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                              {original.description}
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-900">
                              {item.tailoredDescription}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">影响</p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                              {original.impact}
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-slate-900">
                              {item.tailoredImpact}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </EditorCard>
      </div>

      <div className="pointer-events-none fixed left-[-200vw] top-0">
        <div id="resume-export-source">
          <ResumePdfPage resume={resume} />
        </div>
      </div>
    </main>
  );
}

function EditorCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input className="editor-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ListField({
  item,
  field,
  label,
  setResume,
  list,
}: {
  item: ExperienceItem;
  field: keyof Pick<ExperienceItem, "company" | "role" | "period" | "location">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
  list: "experiences";
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            [list]: current[list].map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}

function ProjectField({
  item,
  field,
  label,
  setResume,
}: {
  item: ProjectItem;
  field: keyof Pick<ProjectItem, "title" | "year" | "link">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            projects: current.projects.map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}

function SkillField({
  item,
  field,
  label,
  setResume,
}: {
  item: SkillGroup;
  field: keyof Pick<SkillGroup, "category">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            skills: current.skills.map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}

function AwardField({
  item,
  field,
  label,
  setResume,
}: {
  item: AwardItem;
  field: keyof Pick<AwardItem, "title" | "issuer" | "year">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            awards: current.awards.map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}

function EducationField({
  item,
  field,
  label,
  setResume,
}: {
  item: EducationItem;
  field: keyof Pick<EducationItem, "school" | "major" | "degree" | "period" | "gpa">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            education: current.education.map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}

function CampusField({
  item,
  field,
  label,
  setResume,
}: {
  item: CampusItem;
  field: keyof Pick<CampusItem, "org" | "role" | "period">;
  label: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeProfile>>;
}) {
  return (
    <div>
      <label className="editor-label">{label}</label>
      <input
        className="editor-input"
        value={item[field]}
        onChange={(event) =>
          setResume((current) => ({
            ...current,
            campus: current.campus.map((entry) =>
              entry.id === item.id ? { ...entry, [field]: event.target.value } : entry,
            ),
          }))
        }
      />
    </div>
  );
}
