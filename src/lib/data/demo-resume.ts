import type { ResumeProfile } from "@/lib/types";
import { normalizeResumeProfile } from "@/lib/utils";

export const demoResume: ResumeProfile = normalizeResumeProfile({
  slug: "demo-resume",
  theme: "aurora",
  visibility: "public",
  basics: {
    fullName: "林知微",
    headline: "AI 产品经理 / Web 体验设计",
    email: "zhiwei@example.com",
    phone: "+86 138 0000 2026",
    birth: "2002.03",
    location: "上海",
    website: "https://portfolio.example.com",
    linkedin: "https://linkedin.com/in/zhiwei",
    github: "https://github.com/zhiwei",
    summary:
      "我专注于把复杂 AI 能力打磨成清晰、可信、可转化的产品体验，擅长从 0 到 1 打造求职工具、效率工具与作品集产品。过去 3 年持续负责用户研究、交互方案、增长验证与跨团队协作。",
  },
  experiences: [
    {
      id: "exp-demo-1",
      company: "Nova Labs",
      role: "AI 产品经理",
      period: "2024.03 - 至今",
      location: "上海 / Remote",
      highlights: [
        "负责 AI 简历生成平台的核心体验，完成从模板筛选、智能润色到 PDF 导出的完整闭环设计。",
        "联动算法、前端与增长团队，上线岗位推荐模块，简历投递转化率提升 28%。",
        "搭建作品集展示系统与主题模板体系，新增公开主页分享能力，用户活跃度提升 35%。",
      ],
    },
    {
      id: "exp-demo-2",
      company: "BlueDot Studio",
      role: "产品实习生",
      period: "2023.06 - 2024.02",
      location: "杭州",
      highlights: [
        "参与校园招聘工具的需求调研与原型设计，输出 40+ 页用户洞察材料。",
        "推进 React 组件库落地，减少多个活动页的重复开发工作量。",
      ],
    },
  ],
  projects: [
    {
      id: "proj-demo-1",
      title: "AI 网页简历平台",
      year: "2026",
      description:
        "一个面向学生与职场人的在线简历平台，支持编辑简历、展示作品集、切换主题与生成分享链接。",
      impact: "从产品定义到交互细节全链路负责，验证了“简历 + 作品集”双栏展示形态。",
      link: "https://resume.example.com",
      tags: ["Next.js", "Supabase", "AI Product", "Portfolio"],
    },
    {
      id: "proj-demo-2",
      title: "Interview Copilot",
      year: "2025",
      description:
        "基于大模型的模拟面试助手，支持题库生成、实时追问与面试复盘。",
      impact: "首月完成 5k+ 使用，帮助求职用户快速进入高频练习状态。",
      link: "https://copilot.example.com",
      tags: ["LLM", "Prompt", "Growth", "UX"],
    },
  ],
  skills: [
    {
      id: "skill-demo-1",
      category: "产品",
      items: ["需求拆解", "用户研究", "原型设计", "增长分析"],
    },
    {
      id: "skill-demo-2",
      category: "技术",
      items: ["Next.js", "Supabase", "Prompt Design", "SQL"],
    },
    {
      id: "skill-demo-3",
      category: "协作",
      items: ["跨团队沟通", "项目推进", "文案表达", "英文汇报"],
    },
  ],
  awards: [
    {
      id: "award-demo-1",
      title: "优秀产品创新奖",
      issuer: "Nova Labs",
      year: "2025",
      description: "因主导 AI 求职工具 MVP 上线与增长试验获得团队季度表彰。",
    },
  ],
  education: [
    {
      id: "edu-demo-1",
      school: "上海交通大学",
      major: "计算机科学与技术",
      degree: "本科",
      period: "2020.09 - 2024.06",
      gpa: "3.8/4.0",
      courses: ["数据结构", "算法设计", "机器学习", "数据库系统"],
    },
  ],
  campus: [
    {
      id: "cam-demo-1",
      org: "学生科技创新协会",
      role: "副会长",
      period: "2022.09 - 2024.01",
      highlights: [
        "组织校内 Hackathon 活动，参与人数 200+，覆盖全校 8 个学院。",
        "搭建协会内部知识库与项目管理系统，协作者文档查阅效率提升 40%。",
      ],
    },
    {
      id: "cam-demo-2",
      org: "AI 爱好者社区",
      role: "核心成员",
      period: "2023.03 - 2024.06",
      highlights: [
        "主导「Prompt 工程分享周」系列活动，累计举办 6 场 workshop。",
        "撰写 15+ 篇 AI 工具测评文章，社区阅读量总计 10w+。",
      ],
    },
  ],
  evaluation: [
    "具备从 0 到 1 的 AI 产品落地经验，善于将技术能力转化为可感知的用户体验。",
    "强烈的自我驱动与学习能力，能快速进入新领域并产出结构化方案。",
  ],
});

