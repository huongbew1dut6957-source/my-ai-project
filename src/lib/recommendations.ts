import type { RecommendationItem, ResumeProfile } from "@/lib/types";

const roleDictionary = [
  {
    role: "AI 产品经理",
    keywords: ["ai", "llm", "prompt", "产品", "增长", "用户研究", "workflow"],
  },
  {
    role: "前端工程师",
    keywords: ["next.js", "react", "typescript", "web", "ui", "前端"],
  },
  {
    role: "产品运营",
    keywords: ["增长", "内容", "活动", "运营", "转化", "数据"],
  },
  {
    role: "数据分析师",
    keywords: ["sql", "分析", "可视化", "实验", "指标", "data"],
  },
  {
    role: "品牌 / 视觉设计师",
    keywords: ["设计", "portfolio", "视觉", "品牌", "交互", "动效"],
  },
];

export function buildRecommendations(
  resume: ResumeProfile,
): RecommendationItem[] {
  const text = [
    resume.basics.headline,
    resume.basics.summary,
    ...resume.projects.flatMap((project) => [
      project.title,
      project.description,
      project.impact,
      project.tags.join(" "),
    ]),
    ...resume.experiences.flatMap((experience) => [
      experience.company,
      experience.role,
      experience.highlights.join(" "),
    ]),
    ...resume.skills.flatMap((group) => [group.category, group.items.join(" ")]),
    ...resume.awards.flatMap((award) => [award.title, award.description]),
  ]
    .join(" ")
    .toLowerCase();

  const recommendations = roleDictionary
    .map((entry) => {
      const matched = entry.keywords.filter((keyword) => text.includes(keyword));
      return {
        role: entry.role,
        match: Math.min(98, 48 + matched.length * 10),
        reasons: matched.slice(0, 3).map((keyword) => `命中关键词：${keyword}`),
      };
    })
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => b.match - a.match);

  if (recommendations.length > 0) {
    return recommendations.slice(0, 4);
  }

  return [
    {
      role: "复合型岗位",
      match: 68,
      reasons: ["继续补充项目成果与技能关键词后，岗位推荐会更准确。"],
    },
  ];
}

