import type { ResumeData } from "@/lib/resume-types";
import { resumeToMarkdown } from "@/lib/resume-to-markdown";
import type { ResumeProfile } from "@/lib/types";

export const LATEST_RESUME_MARKDOWN_KEY = "latest_resume_markdown";

function summaryToEvaluation(summary?: string) {
  const normalized = summary?.trim() ?? "";
  if (!normalized) return [];

  const byLines = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (byLines.length > 1) {
    return byLines;
  }

  return normalized
    .split(/[。；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function profileToResumeData(profile: ResumeProfile): ResumeData {
  return {
    basic: {
      name: profile.basics.fullName,
      birth: profile.basics.birth ?? "",
      phone: profile.basics.phone,
      email: profile.basics.email,
    },
    education: (profile.education ?? []).map((item) => ({
      school: item.school,
      major: item.major,
      degree: item.degree,
      time: item.period,
      gpa: item.gpa,
      courses: item.courses,
    })),
    internships: profile.experiences.map((item) => ({
      company: item.company,
      role: item.role,
      time: item.period,
      bullets: item.highlights,
    })),
    projects: profile.projects.map((item) => ({
      name: item.title,
      role: item.tags[0] ?? "",
      time: item.year,
      bullets: [item.description, item.impact].filter(Boolean),
    })),
    campus: (profile.campus ?? []).map((item) => ({
      org: item.org,
      role: item.role,
      time: item.period,
      bullets: item.highlights,
    })),
    evaluation:
      (profile.evaluation ?? []).length > 0
        ? profile.evaluation
        : summaryToEvaluation(profile.basics.summary),
  };
}

export function buildResumeSyncPayload(profile: ResumeProfile) {
  const data = profileToResumeData(profile);
  const markdown = resumeToMarkdown(data);

  return {
    data,
    markdown,
  };
}

export function getMarkdownEditorUrl(markdown: string) {
  const internalRoute = process.env.NEXT_PUBLIC_OH_MY_CV_INTERNAL_ROUTE;

  if (internalRoute) {
    const base =
      typeof window !== "undefined"
        ? new URL(internalRoute, window.location.origin)
        : new URL(internalRoute, "http://localhost:3000");

    base.searchParams.set("source", "ai-product");
    base.searchParams.set("content", encodeURIComponent(markdown));
    return base.toString();
  }

  const url = new URL("http://localhost:5173/");
  url.searchParams.set("source", "ai-product");
  url.searchParams.set("content", encodeURIComponent(markdown));
  return url.toString();
}
