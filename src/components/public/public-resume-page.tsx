import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { themeMap } from "@/lib/themes";
import type { ResumeProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PublicResumePageProps {
  resume: ResumeProfile;
  className?: string;
  preview?: boolean;
}

export function PublicResumePage({
  resume,
  className,
  preview = false,
}: PublicResumePageProps) {
  const theme = themeMap[resume.theme];
  const compact = preview;

  return (
    <div
      className={cn(
        "resume-shell rounded-[32px] border border-black/5",
        compact ? "p-3" : "p-3 sm:p-5",
        className,
      )}
      style={theme.style}
    >
      <div
        className={cn(
          "resume-panel grid overflow-hidden rounded-[28px] border lg:grid-cols-[320px_minmax(0,1fr)]",
          compact ? "gap-3 p-4 lg:grid-cols-[286px_minmax(0,1fr)] lg:p-4" : "gap-4 p-4 sm:p-6 lg:p-7",
          !preview && "min-h-[calc(100vh-10rem)]",
        )}
      >
        <aside className={cn("resume-panel-soft rounded-[24px] border", compact ? "p-4" : "p-5 sm:p-6")}>
          <div className={cn("flex items-start justify-between gap-4", compact ? "mb-5" : "mb-8")}>
            <div>
              <div className={cn("resume-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold", compact ? "mb-2" : "mb-3")}>
                {theme.label}
              </div>
              <h1 className={cn("font-semibold tracking-tight", compact ? "text-[28px]" : "text-3xl sm:text-4xl")}>
                {resume.basics.fullName || "你的名字"}
              </h1>
              <p className={cn("resume-soft text-sm", compact ? "mt-2 leading-5" : "mt-3 leading-6")}>
                {resume.basics.headline || "一句话介绍你的方向与优势"}
              </p>
            </div>
            <div className="rounded-full border border-[color:var(--resume-line)] px-3 py-1 text-[11px] font-semibold">
              {resume.visibility === "public" ? "PUBLIC" : "PRIVATE"}
            </div>
          </div>

          <InfoItem icon={<Mail size={16} />} value={resume.basics.email} />
          <InfoItem icon={<Phone size={16} />} value={resume.basics.phone} />
          <InfoItem icon={<MapPin size={16} />} value={resume.basics.location} />
          <InfoItem label="网站" value={resume.basics.website} isLink />
          <InfoItem label="GitHub" value={resume.basics.github} isLink />
          <InfoItem label="LinkedIn" value={resume.basics.linkedin} isLink />

          <SectionTitle title="技能矩阵" />
          <div className={cn("space-y-4", compact && "space-y-3")}>
            {resume.skills.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
                  {group.category || "技能组"}
                </p>
                <div className={cn("mt-3 flex flex-wrap", compact ? "gap-1.5" : "gap-2")}>
                  {group.items.length > 0 ? (
                    group.items.map((item) => (
                      <span
                        key={item}
                        className={cn(
                          "resume-chip rounded-full font-medium",
                          compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
                        )}
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="resume-soft text-sm">添加技能关键词后会展示在这里。</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <SectionTitle title="获奖与亮点" />
          <div className={cn("space-y-4", compact && "space-y-3")}>
            {resume.awards.length > 0 ? (
              resume.awards.map((award) => (
                <div
                  key={award.id}
                  className={cn(
                    "rounded-2xl border border-[color:var(--resume-line)]",
                    compact ? "p-3" : "p-4",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{award.title || "奖项名称"}</p>
                    <span className="resume-soft text-xs">{award.year || "年份"}</span>
                  </div>
                  <p className="resume-soft mt-2 text-sm">{award.issuer}</p>
                  <p className={cn("text-sm", compact ? "mt-2 leading-5" : "mt-3 leading-6")}>
                    {award.description}
                  </p>
                </div>
              ))
            ) : (
              <p className="resume-soft text-sm">可以放奖项、认证、论文、证书或活动成就。</p>
            )}
          </div>
        </aside>

        <section className={cn("space-y-6", compact && "space-y-4")}>
          <div
            className={cn(
              "rounded-[24px] border border-[color:var(--resume-line)] bg-[color:var(--resume-surface)]",
              compact ? "p-4" : "p-5 sm:p-6",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
              About
            </p>
            <h2 className={cn("font-semibold", compact ? "mt-2 text-[24px]" : "mt-3 text-2xl sm:text-3xl")}>
              左侧是简历，右侧是作品集
            </h2>
            <p className={cn("resume-soft max-w-3xl text-sm", compact ? "mt-3 leading-6" : "mt-4 leading-7 sm:text-base")}>
              {resume.basics.summary ||
                "在这里用 3 到 5 句话快速解释你的核心能力、行业经验、代表成果和下一步目标。"}
            </p>
          </div>

          <div
            className={cn(
              "rounded-[24px] border border-[color:var(--resume-line)] bg-[color:var(--resume-surface)]",
              compact ? "p-4" : "p-5 sm:p-6",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
              Education
            </p>
            <div className={cn("space-y-4", compact ? "mt-4 space-y-3" : "mt-5")}>
              {resume.education.length > 0 ? (
                resume.education.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "border-b border-[color:var(--resume-line)] last:border-none",
                      compact ? "pb-3 last:pb-0" : "pb-4 last:pb-0",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
                        {item.school || "学校名称"}
                      </h3>
                      <span className="resume-soft text-xs sm:text-sm">{item.period || ""}</span>
                    </div>
                    <p className="resume-soft mt-1 text-sm">
                      {item.major || "专业"} · {item.degree || "学历"}
                    </p>
                    {item.gpa ? (
                      <p className="resume-soft mt-1 text-xs">GPA：{item.gpa}</p>
                    ) : null}
                    {item.courses.length > 0 ? (
                      <p className="resume-soft mt-1 text-xs">
                        主修课程：{item.courses.join("、")}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="resume-soft text-sm">添加教育经历后展示在这里。</p>
              )}
            </div>
          </div>

          <div
            className={cn(
              "rounded-[24px] border border-[color:var(--resume-line)] bg-[color:var(--resume-surface)]",
              compact ? "p-4" : "p-5 sm:p-6",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
              Campus
            </p>
            <div className={cn("space-y-4", compact ? "mt-4 space-y-3" : "mt-5")}>
              {resume.campus.length > 0 ? (
                resume.campus.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "border-b border-[color:var(--resume-line)] last:border-none",
                      compact ? "pb-3 last:pb-0" : "pb-4 last:pb-0",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>
                        {item.org || "组织名称"}
                      </h3>
                      <span className="resume-soft text-xs">{item.period || ""}</span>
                    </div>
                    <p className="resume-soft mb-2 text-sm">{item.role || "角色"}</p>
                    <ul className={cn("space-y-1 text-sm", compact ? "leading-5" : "leading-6")}>
                      {item.highlights.map((h) => (
                        <li key={h} className="flex gap-2">
                          <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--resume-accent)]")} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="resume-soft text-sm">添加校园经历后展示在这里。</p>
              )}
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div
              className={cn(
                "rounded-[24px] border border-[color:var(--resume-line)] bg-[color:var(--resume-surface)]",
                compact ? "p-4" : "p-5 sm:p-6",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
                Experience
              </p>
              <div className={cn("space-y-5", compact ? "mt-4 space-y-3" : "mt-5")}>
                {resume.experiences.map((experience) => (
                  <div
                    key={experience.id}
                    className={cn(
                      "border-b border-[color:var(--resume-line)] last:border-none",
                      compact ? "pb-3 last:pb-0" : "pb-5 last:pb-0",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
                          {experience.role || "你的岗位名称"}
                        </h3>
                        <p className="resume-soft mt-1 text-sm">
                          {experience.company || "公司名称"} · {experience.location || "地点"}
                        </p>
                      </div>
                      <span className="resume-soft text-xs sm:text-sm">
                        {experience.period || "时间范围"}
                      </span>
                    </div>
                    <ul className={cn("space-y-2 text-sm", compact ? "mt-3 leading-5" : "mt-4 leading-6")}>
                      {experience.highlights.length > 0 ? (
                        experience.highlights.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className={cn("rounded-full bg-[color:var(--resume-accent)]", compact ? "mt-[7px] h-1.5 w-1.5" : "mt-2 h-1.5 w-1.5")} />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="resume-soft">补充 2 到 4 条可量化的成果会更有说服力。</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "rounded-[24px] border border-[color:var(--resume-line)] bg-[color:var(--resume-surface)]",
                compact ? "p-4" : "p-5 sm:p-6",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
                Portfolio
              </p>
              <div className={cn("grid gap-4", compact ? "mt-4 gap-3" : "mt-5")}>
                {resume.projects.map((project) => (
                  <article
                    key={project.id}
                    className={cn(
                      "resume-panel-soft rounded-[22px] border",
                      compact ? "p-4" : "p-5",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
                          {project.title || "项目标题"}
                        </h3>
                        <p className="resume-soft mt-2 text-sm">{project.year || "年份"}</p>
                      </div>
                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="resume-link inline-flex items-center gap-2 text-sm font-semibold no-underline"
                          style={{ textDecoration: "none" }}
                        >
                          查看项目
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                    </div>
                    <p className={cn("text-sm", compact ? "mt-3 leading-6" : "mt-4 leading-7")}>
                      {project.description || "这里可以展示项目背景、你负责的部分和关键设计。"}
                    </p>
                    <p className={cn("resume-soft text-sm", compact ? "mt-2 leading-6" : "mt-4 leading-7")}>
                      {project.impact || "建议写出结果，比如用户增长、效率提升、上线速度或业务影响。"}
                    </p>
                    <div className={cn("flex flex-wrap", compact ? "mt-3 gap-1.5" : "mt-5 gap-2")}>
                      {project.tags.length > 0 ? (
                        project.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "rounded-full border border-[color:var(--resume-line)]",
                              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs",
                            )}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="resume-soft text-sm">添加项目标签后会出现在这里。</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="my-4 border-t border-[color:var(--resume-line)] pt-4 first:mt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--resume-accent)]">
        {title}
      </p>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon?: React.ReactNode;
  label?: string;
  value?: string;
  isLink?: boolean;
}) {
  if (!value) return null;

  const content = isLink ? (
    <a href={value} target="_blank" rel="noreferrer" className="resume-link break-all">
      {value}
    </a>
  ) : (
    <span className="break-all">{value}</span>
  );

  return (
    <div className="mb-3 flex items-start gap-3 text-sm">
      <span className="resume-soft mt-0.5 shrink-0">{icon ?? label}</span>
      <div className="min-w-0">
        {label ? <p className="resume-soft mb-1 text-xs uppercase tracking-[0.18em]">{label}</p> : null}
        <div style={{ textDecoration: "none" }}>{content}</div>
      </div>
    </div>
  );
}
