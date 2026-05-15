import type { ResumeProfile } from "@/lib/types";
import { themeMap } from "@/lib/themes";

export function ResumePdfPage({ resume }: { resume: ResumeProfile }) {
  const contactItems = [
    resume.basics.phone,
    resume.basics.email,
    resume.basics.location,
    resume.basics.website,
    resume.basics.github,
    resume.basics.linkedin,
  ].filter(Boolean) as string[];

  const theme = themeMap[resume.theme];
  const accent = (theme.style as Record<string, string>)["--resume-accent"] || "#111111";
  const accentSoft = (theme.style as Record<string, string>)["--resume-accent-soft"] || "#f5f5f5";

  return (
    <div
      className="w-[794px] px-[44px] py-[36px]"
      style={{
        backgroundColor: "#ffffff",
        color: "#111111",
        fontFamily:
          '"Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", serif',
      }}
    >
      <header className="pb-4" style={{ borderBottom: `2px solid ${accent}` }}>
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-bold tracking-[0.08em]">
              {resume.basics.fullName || "你的名字"}
            </h1>
            <p className="mt-2 text-[14px] font-semibold">
              {resume.basics.headline || "求职方向 / 专业标签"}
            </p>
          </div>
          <div className="shrink-0 text-right text-[12px] leading-6">
            {contactItems.slice(0, 4).map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </div>
        {resume.basics.summary ? (
          <p className="mt-3 text-[12px] leading-6" style={{ color: "#262626" }}>
            {resume.basics.summary}
          </p>
        ) : null}
      </header>

      <div className="mt-4 grid grid-cols-[208px_minmax(0,1fr)] gap-6">
        <aside className="space-y-4">
          <PdfSection accent={accent} title="技能标签">
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.flatMap((group) => group.items).length > 0 ? (
                resume.skills.flatMap((group) => group.items).map((item) => (
                  <span
                    key={item}
                    className="rounded px-2 py-0.5 text-[10px]"
                    style={{ border: "1px solid #a3a3a3" }}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-[11px] leading-5" style={{ color: "#404040" }}>
                  暂未填写技能关键词
                </p>
              )}
            </div>
          </PdfSection>

          <PdfSection accent={accent} title="链接信息">
            <div className="space-y-1.5 text-[11px] leading-5">
              {resume.basics.website ? <p>{resume.basics.website}</p> : null}
              {resume.basics.github ? <p>{resume.basics.github}</p> : null}
              {resume.basics.linkedin ? <p>{resume.basics.linkedin}</p> : null}
              {!resume.basics.website &&
              !resume.basics.github &&
              !resume.basics.linkedin ? (
                <p style={{ color: "#404040" }}>暂未填写外部链接</p>
              ) : null}
            </div>
          </PdfSection>

          <PdfSection accent={accent} title="获奖 / 证书">
            <div className="space-y-3">
              {resume.awards.length > 0 ? (
                resume.awards.map((award) => (
                  <div key={award.id}>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="min-w-0 flex-1">{award.title}</span>
                      <span className="shrink-0">{award.year}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5" style={{ color: "#404040" }}>
                      {award.issuer}
                    </p>
                    {award.description ? (
                      <p className="mt-1 text-[11px] leading-5">{award.description}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-[11px] leading-5" style={{ color: "#404040" }}>
                  暂未填写奖项或证书
                </p>
              )}
            </div>
          </PdfSection>
        </aside>

        <main className="space-y-4">
          <PdfSection accent={accent} title="实习 / 工作经历">
            <div className="space-y-3">
              {resume.experiences.map((experience) => (
                <EntryBlock accent={accent}
                  key={experience.id}
                  title={experience.company || "公司名称"}
                  subtitle={experience.role || "岗位名称"}
                  meta={[experience.period, experience.location].filter(Boolean).join(" / ")}
                  bullets={experience.highlights}
                />
              ))}
            </div>
          </PdfSection>

          <PdfSection accent={accent} title="教育经历">
            <div className="space-y-3">
              {resume.education.length > 0 ? (
                resume.education.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-start justify-between gap-3 text-[12px]">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[13px] font-bold">{item.school}</h3>
                        <span className="font-semibold">{item.major} · {item.degree}</span>
                      </div>
                      <span className="shrink-0" style={{ color: "#404040" }}>{item.period}</span>
                    </div>
                    {item.gpa ? (
                      <p className="mt-1 text-[11px]" style={{ color: "#404040" }}>GPA：{item.gpa}</p>
                    ) : null}
                    {item.courses.length > 0 ? (
                      <p className="mt-1 text-[11px]" style={{ color: "#404040" }}>主修课程：{item.courses.join("、")}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-[11px]" style={{ color: "#404040" }}>暂未填写教育经历</p>
              )}
            </div>
          </PdfSection>

          <PdfSection accent={accent} title="校园经历">
            <div className="space-y-3">
              {resume.campus.length > 0 ? (
                resume.campus.map((item) => (
                  <EntryBlock accent={accent}
                    key={item.id}
                    title={item.org}
                    subtitle={item.role}
                    meta={item.period}
                    bullets={item.highlights}
                  />
                ))
              ) : (
                <p className="text-[11px]" style={{ color: "#404040" }}>暂未填写校园经历</p>
              )}
            </div>
          </PdfSection>

          <PdfSection accent={accent} title="项目经历">
            <div className="space-y-3">
              {resume.projects.map((project) => (
                <EntryBlock accent={accent}
                  key={project.id}
                  title={project.title || "项目名称"}
                  subtitle={project.year || "项目时间"}
                  meta={project.tags.join(" · ")}
                  bullets={[project.description, project.impact].filter(Boolean)}
                  extra={project.link}
                />
              ))}
            </div>
          </PdfSection>
        </main>
      </div>
    </div>
  );
}

function PdfSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 pb-1" style={{ borderBottom: `1.5px solid ${accent}` }}>
        <h2 className="text-[16px] font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EntryBlock({
  title,
  subtitle,
  meta,
  bullets,
  extra,
  accent,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  bullets: string[];
  extra?: string;
  accent: string;
}) {
  return (
    <article>
      <div className="flex items-start justify-between gap-3 text-[12px]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-[13px] font-bold">{title}</h3>
            <span className="font-semibold" style={{ color: accent }}>{subtitle}</span>
          </div>
          {meta ? (
            <p className="mt-1 leading-5" style={{ color: "#404040" }}>
              {meta}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="mt-1.5 space-y-1 text-[11px] leading-5">
        {bullets.length > 0 ? (
          bullets.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="shrink-0" style={{ color: accent }}>●</span>
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="flex gap-2" style={{ color: "#404040" }}>
            <span className="shrink-0" style={{ color: accent }}>●</span>
            <span>补充结果、职责和具体影响，会让 PDF 更完整。</span>
          </li>
        )}
      </ul>
      {extra ? (
        <p className="mt-1 text-[10px]" style={{ color: "#404040" }}>
          {extra}
        </p>
      ) : null}
    </article>
  );
}
