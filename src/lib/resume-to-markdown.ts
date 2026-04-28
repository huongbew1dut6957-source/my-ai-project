import type { ResumeData } from "@/lib/resume-types";

function clean(value?: string | null) {
  return value?.trim() ?? "";
}

function cleanList(values?: Array<string | null | undefined>) {
  return (values ?? []).map((item) => clean(item)).filter(Boolean);
}

function joinInline(values: Array<string | null | undefined>) {
  return cleanList(values).join("    ");
}

function pushBullets(lines: string[], bullets: string[]) {
  cleanList(bullets).forEach((bullet) => {
    lines.push(`- ${bullet}`);
  });
}

export function resumeToMarkdown(resume: ResumeData): string {
  const lines: string[] = [];
  const name = clean(resume.basic.name) || "未命名简历";

  lines.push(`# ${name}`);

  const basicLine = joinInline([
    clean(resume.basic.birth) ? `出生日期：${clean(resume.basic.birth)}` : "",
    clean(resume.basic.phone) ? `联系电话：${clean(resume.basic.phone)}` : "",
    clean(resume.basic.email) ? `邮箱：${clean(resume.basic.email)}` : "",
  ]);

  if (basicLine) {
    lines.push(basicLine);
  }

  lines.push("");
  lines.push("## 教育经历");
  if (resume.education.length > 0) {
    resume.education.forEach((item) => {
      const header = joinInline([
        clean(item.school),
        clean(item.major),
        clean(item.degree),
        clean(item.time),
      ]);

      if (header) {
        lines.push(header);
      }

      const detail = joinInline([
        clean(item.gpa) ? `GPA：${clean(item.gpa)}` : "",
        cleanList(item.courses).length > 0
          ? `主修课程：${cleanList(item.courses).join("、")}`
          : "",
      ]);

      if (detail) {
        lines.push(detail);
      }

      lines.push("");
    });
  }

  lines.push("");

  lines.push("## 实习经历");
  if (resume.internships.length > 0) {
    resume.internships.forEach((item) => {
      const header = joinInline([
        clean(item.company),
        clean(item.role),
        clean(item.time),
      ]);

      if (header) {
        lines.push(header);
      }

      pushBullets(lines, item.bullets);
      lines.push("");
    });
  }

  lines.push("");

  lines.push("## 项目经历");
  if (resume.projects.length > 0) {
    resume.projects.forEach((item) => {
      const header = joinInline([
        clean(item.name),
        clean(item.role),
        clean(item.time),
      ]);

      if (header) {
        lines.push(header);
      }

      pushBullets(lines, item.bullets);
      lines.push("");
    });
  }

  lines.push("");

  lines.push("## 校园经历");
  if (resume.campus.length > 0) {
    resume.campus.forEach((item) => {
      const header = joinInline([
        clean(item.org),
        clean(item.role),
        clean(item.time),
      ]);

      if (header) {
        lines.push(header);
      }

      pushBullets(lines, item.bullets);
      lines.push("");
    });
  }

  lines.push("");

  lines.push("## 个人评价");
  const evaluation = cleanList(resume.evaluation);
  if (evaluation.length > 0) {
    pushBullets(lines, evaluation);
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
