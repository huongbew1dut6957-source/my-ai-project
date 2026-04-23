export type ThemeName = "aurora" | "graphite" | "ember" | "ocean";
export type ResumeVisibility = "public" | "private";

export interface ResumeBasics {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  year: string;
  description: string;
  impact: string;
  link: string;
  tags: string[];
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

export interface ResumeProfile {
  user_id?: string;
  slug: string;
  theme: ThemeName;
  visibility: ResumeVisibility;
  basics: ResumeBasics;
  experiences: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  awards: AwardItem[];
  created_at?: string;
  updated_at?: string;
}

export interface RecommendationItem {
  role: string;
  match: number;
  reasons: string[];
}

