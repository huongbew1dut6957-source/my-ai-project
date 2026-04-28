import { clsx, type ClassValue } from "clsx";
import type {
  AwardItem,
  CampusItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeBasics,
  ResumeProfile,
  SkillGroup,
  ThemeName,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function linesToArray(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function commaToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBasics(input?: Partial<ResumeBasics>): ResumeBasics {
  return {
    fullName: input?.fullName ?? "",
    headline: input?.headline ?? "",
    email: input?.email ?? "",
    phone: input?.phone ?? "",
    birth: input?.birth ?? "",
    location: input?.location ?? "",
    website: input?.website ?? "",
    linkedin: input?.linkedin ?? "",
    github: input?.github ?? "",
    summary: input?.summary ?? "",
  };
}

function normalizeExperiences(input?: ExperienceItem[]): ExperienceItem[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("exp"),
    company: item.company ?? "",
    role: item.role ?? "",
    period: item.period ?? "",
    location: item.location ?? "",
    highlights: item.highlights ?? [],
  }));
}

function normalizeProjects(input?: ProjectItem[]): ProjectItem[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("proj"),
    title: item.title ?? "",
    year: item.year ?? "",
    description: item.description ?? "",
    impact: item.impact ?? "",
    link: item.link ?? "",
    tags: item.tags ?? [],
  }));
}

function normalizeSkills(input?: SkillGroup[]): SkillGroup[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("skill"),
    category: item.category ?? "",
    items: item.items ?? [],
  }));
}

function normalizeAwards(input?: AwardItem[]): AwardItem[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("award"),
    title: item.title ?? "",
    issuer: item.issuer ?? "",
    year: item.year ?? "",
    description: item.description ?? "",
  }));
}

function normalizeEducation(input?: EducationItem[]): EducationItem[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("edu"),
    school: item.school ?? "",
    major: item.major ?? "",
    degree: item.degree ?? "",
    period: item.period ?? "",
    gpa: item.gpa ?? "",
    courses: item.courses ?? [],
  }));
}

function normalizeCampus(input?: CampusItem[]): CampusItem[] {
  return (input ?? []).map((item) => ({
    id: item.id ?? newId("cam"),
    org: item.org ?? "",
    role: item.role ?? "",
    period: item.period ?? "",
    highlights: item.highlights ?? [],
  }));
}

export function createEmptyResume(theme: ThemeName = "aurora"): ResumeProfile {
  return {
    slug: "my-ai-resume",
    theme,
    visibility: "public",
    basics: normalizeBasics(),
    experiences: [
      {
        id: newId("exp"),
        company: "",
        role: "",
        period: "",
        location: "",
        highlights: [],
      },
    ],
    projects: [
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
    skills: [
      {
        id: newId("skill"),
        category: "核心技能",
        items: [],
      },
    ],
    awards: [],
    education: [],
    campus: [],
    evaluation: [],
  };
}

export function normalizeResumeProfile(
  input?: Partial<ResumeProfile>,
): ResumeProfile {
  const fallback = createEmptyResume(input?.theme ?? "aurora");

  return {
    ...fallback,
    ...input,
    slug: input?.slug ?? fallback.slug,
    theme: input?.theme ?? fallback.theme,
    visibility: input?.visibility ?? fallback.visibility,
    basics: normalizeBasics(input?.basics),
    experiences: normalizeExperiences(input?.experiences),
    projects: normalizeProjects(input?.projects),
    skills: normalizeSkills(input?.skills),
    awards: normalizeAwards(input?.awards),
    education: normalizeEducation(input?.education),
    campus: normalizeCampus(input?.campus),
    evaluation: input?.evaluation ?? [],
  };
}

export function timeLabel(value?: string) {
  if (!value) return "尚未保存";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

