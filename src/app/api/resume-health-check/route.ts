import { NextResponse } from "next/server";
import { callAI, getAIErrorMessage } from "@/lib/ai-client";

interface HealthReport {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resume = body.resume;

    if (!resume) {
      return NextResponse.json({ message: "请提供简历数据。" }, { status: 400 });
    }

    const apiError = getAIErrorMessage();
    if (apiError) return NextResponse.json({ message: apiError }, { status: 500 });

    // Build a plain-text summary of the resume
    const basics = resume.basics || {};
    const contactFilled = [basics.email, basics.phone, basics.fullName, basics.birth].filter(Boolean).length;
    const portfolioFilled = [basics.website, basics.github, basics.linkedin].filter(Boolean).length;

    const expCount = resume.experiences?.length || 0;
    const expWithBullets = resume.experiences?.filter(
      (e: { highlights?: string[] }) => (e.highlights || []).length > 0
    ).length || 0;
    const expHasNumbers = resume.experiences?.filter((e: { highlights?: string[] }) =>
      (e.highlights || []).some((h: string) => /\d+%|\d+\s*(倍|万|人|家|个)/.test(h))
    ).length || 0;

    const hasProjects = (resume.projects?.length || 0) > 0;
    const hasEducation = (resume.education?.length || 0) > 0;
    const hasSkills = resume.skills?.some((s: { items?: string[] }) => (s.items || []).length > 0) ?? false;
    const hasAwards = (resume.awards?.length || 0) > 0;
    const hasCampus = (resume.campus?.length || 0) > 0;
    const hasEvaluation = (resume.evaluation?.length || 0) > 0 || (basics.summary || "").length > 20;

    // Rule-based quick diagnosis FIRST, then AI enhances
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    if (contactFilled >= 3) strengths.push("联系方式完整");
    else { weaknesses.push("联系方式不完整"); suggestions.push("补充邮箱和电话号码"); }

    if (hasEducation) strengths.push("有教育经历");
    else { weaknesses.push("缺少教育经历"); suggestions.push("添加教育背景信息"); }

    if (expCount >= 2) strengths.push(`有 ${expCount} 段实习/工作经历`);
    else if (expCount === 1) strengths.push("有 1 段实习经历，建议再补充 1 段");
    else { weaknesses.push("缺少实习/工作经历"); suggestions.push("即使是校内项目或课程项目也可以写入"); }

    if (expWithBullets === expCount && expCount > 0) {
      strengths.push("经历描述都有要点展开");
    } else if (expCount > 0) {
      weaknesses.push("部分经历缺少要点描述");
      suggestions.push("每段经历补充 2-4 条具体成果");
    }

    if (expCount > 0 && expHasNumbers < expCount) {
      weaknesses.push(`${expCount - expHasNumbers} 段经历缺少量化数据`);
      suggestions.push("用数字说话：提升X%、服务Y位用户、缩短Z天");
    }

    if (hasProjects) strengths.push("有项目经历");
    else { weaknesses.push("缺少项目经历"); suggestions.push("课程项目、竞赛作品、个人作品都算项目"); }

    if (hasSkills) strengths.push("技能标签清晰");
    else weaknesses.push("缺少技能标签");

    if (hasAwards) strengths.push("有获奖/证书");
    if (hasCampus) strengths.push("有校园活动经历");

    if (!hasEvaluation) {
      weaknesses.push("缺少自我评价");
      suggestions.push("写 2-3 句话概括核心优势和求职意向");
    }

    // Score (0-100)
    let score = 50;
    if (contactFilled >= 3) score += 10;
    if (hasEducation) score += 5;
    score += Math.min(expCount * 5, 15);
    if (hasProjects) score += 8;
    if (hasSkills) score += 5;
    if (hasAwards) score += 3;
    if (hasCampus) score += 3;
    if (hasEvaluation) score += 3;
    if (expHasNumbers > 0) score += Math.min(expHasNumbers * 3, 8);

    const report: HealthReport = {
      score: Math.min(score, 98),
      strengths,
      weaknesses,
      suggestions,
    };

    // Use AI to add nuanced feedback
    if (resume.experiences?.length > 0) {
      const expText = resume.experiences
        .map((e: { company?: string; role?: string; highlights?: string[] }) =>
          `${e.company || ""} - ${e.role || ""}：${(e.highlights || []).join("；")}`
        )
        .join("\n");

      const systemPrompt = `你是某头部互联网公司 8 年招聘经验的 HR 负责人，面试过 500+ 校招和社招候选人。请用挑剔但建设性的眼光评价这份简历的实习经历部分。只返回 JSON，不要解释。格式：{"aiStrengths":["优点1"],"aiWeaknesses":["缺点1"],"aiSuggestions":["建议1"]}。每条建议具体、可执行、有场景感。最多各 2 条。`;

      const userPrompt = `这份简历的实习经历：\n${expText}\n\n请指出最需要改进的 1-2 个地方。`;

      const aiContent = await callAI({ systemPrompt, userPrompt, maxTokens: 600 });
      if (aiContent) {
        try {
          const jsonMatch = aiContent.match(/```(?:json)?\n?([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1].trim() : aiContent.trim();
          const aiFeedback = JSON.parse(jsonStr);
          if (aiFeedback.aiStrengths) report.strengths.push(...aiFeedback.aiStrengths);
          if (aiFeedback.aiWeaknesses) report.weaknesses.push(...aiFeedback.aiWeaknesses);
          if (aiFeedback.aiSuggestions) report.suggestions.push(...aiFeedback.aiSuggestions);
        } catch { /* ignore AI parse errors, rule-based feedback is enough */ }
      }
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ message: "处理请求时出错。" }, { status: 500 });
  }
}
