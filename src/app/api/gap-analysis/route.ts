import { NextResponse } from "next/server";
import { callAI, getAIErrorMessage } from "@/lib/ai-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resume, jobRequirements, jobTitle } = body;

    if (!jobRequirements?.trim() && !jobTitle?.trim()) {
      return NextResponse.json({ message: "请提供目标岗位描述或岗位名称。" }, { status: 400 });
    }

    const apiError = getAIErrorMessage();
    if (apiError) return NextResponse.json({ message: apiError }, { status: 500 });

    // Build resume summary
    const name = resume.basics?.fullName || "";
    const skills = resume.skills?.flatMap((s: { items?: string[] }) => s.items || []).join("、") || "";
    const expSummary = (resume.experiences || [])
      .map((e: { company?: string; role?: string; highlights?: string[] }) =>
        `${e.role} @ ${e.company}：${(e.highlights || []).join("；")}`
      )
      .join("\n");
    const eduSummary = (resume.education || [])
      .map((e: { school?: string; major?: string; degree?: string }) =>
        `${e.school} ${e.major} ${e.degree}`
      )
      .join("\n");

    const resumeText = [
      name ? `姓名：${name}` : "",
      skills ? `技能：${skills}` : "",
      eduSummary ? `教育：${eduSummary}` : "",
      expSummary ? `经历：\n${expSummary}` : "",
    ].filter(Boolean).join("\n\n");

    let jobContext = jobRequirements?.trim() || `岗位：${jobTitle}`;

    const hrPersona = `你是某大厂有 8 年经验的招聘负责人。分析简历与岗位的差距时，要区分"JD 官话"和"真实用人需求"。只返回 JSON，不要解释。`;

    const userPrompt = `${hrPersona}

目标岗位：
${jobContext}

候选人简历：
${resumeText}

请分析差距并返回 JSON：
{
  "matched": [{"requirement":"JD中的要求","evidence":"简历中的匹配点","level":"strong|partial"}],
  "gaps": [{"requirement":"JD要求但简历缺失","impact":"为什么这个缺失会扣分","fix":"具体怎么补（不是空话，是能直接写进简历的一句话）"}],
  "summary": "一句话总评"
}`;

    const content = await callAI({ systemPrompt: hrPersona, userPrompt, maxTokens: 2000 });

    if (!content) {
      return NextResponse.json({ message: "AI 分析失败，请重试。" }, { status: 502 });
    }

    try {
      const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      const analysis = JSON.parse(jsonStr);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({ message: "AI 返回格式异常，请重试。" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ message: "处理请求时出错。" }, { status: 500 });
  }
}
