import type { ResumeProfile } from "@/lib/types";
import { themeMap } from "@/lib/themes";

export function ResumePdfPage({ resume }: { resume: ResumeProfile }) {
  const contactItems = [
    resume.basics.birth,
    resume.basics.phone,
    resume.basics.email,
    resume.basics.location,
  ].filter(Boolean);

  const theme = themeMap[resume.theme];
  const accent = (theme.style as Record<string, string>)["--resume-accent"] || "#333";

  return (
    <div
      className="w-[794px] px-[48px] py-[40px]"
      style={{
        backgroundColor: "#ffffff",
        color: "#222",
        fontFamily:
          '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
      }}
    >
      {/* Header + Contact row */}
      <div style={{ borderBottom: `2.5px solid ${accent}`, paddingBottom: 14, marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.06em", margin: 0 }}>
          {resume.basics.fullName || "姓名"}
        </h1>
        {resume.basics.headline ? (
          <div style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 4 }}>
            {resume.basics.headline}
          </div>
        ) : null}
        {contactItems.length > 0 ? (
          <div style={{ fontSize: 11, color: "#555", marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 18px" }}>
            {contactItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Education */}
      {resume.education.length > 0 ? (
        <PdfSection accent={accent} title="教育经历">
          {resume.education.map((item) => (
            <div key={item.id} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{item.school}</span>
                <span style={{ fontSize: 11, color: "#666" }}>{item.period}</span>
              </div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 1 }}>
                {item.major} · {item.degree}
                {item.gpa ? <span> · GPA {item.gpa}</span> : null}
              </div>
              {item.courses.length > 0 ? (
                <div style={{ fontSize: 10, color: "#777", marginTop: 1 }}>
                  主修课程：{item.courses.join("、")}
                </div>
              ) : null}
            </div>
          ))}
        </PdfSection>
      ) : null}

      {/* Internship / Work */}
      {resume.experiences.length > 0 ? (
        <PdfSection accent={accent} title="实习经历">
          {resume.experiences.map((item) => (
            <EntryItem key={item.id} accent={accent}>
              <EntryTitle title={item.company} subtitle={item.role} meta={item.period} accent={accent} />
              {item.highlights.length > 0 ? (
                <BulletList items={item.highlights} accent={accent} />
              ) : null}
            </EntryItem>
          ))}
        </PdfSection>
      ) : null}

      {/* Projects */}
      {resume.projects.length > 0 ? (
        <PdfSection accent={accent} title="项目经历">
          {resume.projects.map((item) => (
            <EntryItem key={item.id} accent={accent}>
              <EntryTitle title={item.title} subtitle={item.year} meta={item.tags?.join(" · ")} accent={accent} />
              {item.description ? (
                <BulletList items={[item.description, item.impact].filter(Boolean)} accent={accent} />
              ) : null}
            </EntryItem>
          ))}
        </PdfSection>
      ) : null}

      {/* Campus */}
      {resume.campus.length > 0 ? (
        <PdfSection accent={accent} title="校园经历">
          {resume.campus.map((item) => (
            <EntryItem key={item.id} accent={accent}>
              <EntryTitle title={item.org} subtitle={item.role} meta={item.period} accent={accent} />
              {item.highlights.length > 0 ? (
                <BulletList items={item.highlights} accent={accent} />
              ) : null}
            </EntryItem>
          ))}
        </PdfSection>
      ) : null}

      {/* Skills + Awards row */}
      <div style={{ display: "flex", gap: 32 }}>
        {resume.skills.length > 0 ? (
          <div style={{ flex: 1 }}>
            <PdfSection accent={accent} title="专业技能">
              {resume.skills.map((group) => (
                <div key={group.id} style={{ marginBottom: 3, fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{group.category}：</span>
                  <span style={{ color: "#555" }}>{group.items.join("、")}</span>
                </div>
              ))}
            </PdfSection>
          </div>
        ) : null}

        {resume.awards.length > 0 ? (
          <div style={{ flex: 1 }}>
            <PdfSection accent={accent} title="获奖 / 证书">
              {resume.awards.map((item) => (
                <div key={item.id} style={{ marginBottom: 4, fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  <span style={{ color: "#999", marginLeft: 6 }}>{item.year}</span>
                  {item.issuer ? (
                    <div style={{ color: "#777", marginTop: 1 }}>{item.issuer}</div>
                  ) : null}
                </div>
              ))}
            </PdfSection>
          </div>
        ) : null}
      </div>

      {/* Self evaluation */}
      {resume.evaluation.length > 0 ? (
        <PdfSection accent={accent} title="自我评价">
          <BulletList items={resume.evaluation} accent={accent} />
        </PdfSection>
      ) : resume.basics.summary ? (
        <PdfSection accent={accent} title="自我评价">
          <p style={{ fontSize: 11, color: "#555", lineHeight: 1.7, margin: 0 }}>
            {resume.basics.summary}
          </p>
        </PdfSection>
      ) : null}
    </div>
  );
}

/* === Small helpers === */

function PdfSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 14, pageBreakInside: "avoid" }}>
      <div style={{ borderBottom: `1.2px solid ${accent}`, marginBottom: 8, paddingBottom: 3 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: accent }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EntryItem({ children, accent: _a }: { children: React.ReactNode; accent: string }) {
  return <div style={{ marginBottom: 10, pageBreakInside: "avoid" }}>{children}</div>;
}

function EntryTitle({ title, subtitle, meta, accent }: { title: string; subtitle?: string; meta?: string; accent: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
      <div>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span>
        {subtitle ? <span style={{ fontSize: 12, color: accent, marginLeft: 10, fontWeight: 600 }}>{subtitle}</span> : null}
      </div>
      {meta ? <span style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap" }}>{meta}</span> : null}
    </div>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul style={{ margin: "2px 0 0 0", padding: "0 0 0 14px", listStyle: "none" }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: 11, color: "#444", lineHeight: 1.65, marginBottom: 1, position: "relative", paddingLeft: 10 }}>
          <span style={{ position: "absolute", left: 0, top: 0, color: accent, fontWeight: 700 }}>·</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
