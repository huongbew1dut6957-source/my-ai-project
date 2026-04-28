export interface ResumeBasic {
  name: string;
  birth: string;
  phone: string;
  email: string;
}

export interface ResumeEducationItem {
  school: string;
  major: string;
  degree: string;
  time: string;
  gpa: string;
  courses: string[];
}

export interface ResumeInternshipItem {
  company: string;
  role: string;
  time: string;
  bullets: string[];
}

export interface ResumeProjectItem {
  name: string;
  role: string;
  time: string;
  bullets: string[];
}

export interface ResumeCampusItem {
  org: string;
  role: string;
  time: string;
  bullets: string[];
}

export interface ResumeData {
  basic: ResumeBasic;
  education: ResumeEducationItem[];
  internships: ResumeInternshipItem[];
  projects: ResumeProjectItem[];
  campus: ResumeCampusItem[];
  evaluation: string[];
}

