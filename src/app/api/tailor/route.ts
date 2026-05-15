import { NextResponse } from "next/server";
import { callAI, getAIErrorMessage } from "@/lib/ai-client";

interface TailorRequest {
  resume: {
    basics?: { fullName?: string };
    experiences?: Array<{
      id: string;
      company: string;
      role: string;
      highlights: string[];
    }>;
    projects?: Array<{
      id: string;
      title: string;
      description: string;
      impact: string;
    }>;
  };
  jobRequirements?: string;
  jobTitle?: string;
  company?: string;
}

interface TailorExperience {
  id: string;
  tailoredHighlights: string[];
}

interface TailorProject {
  id: string;
  tailoredDescription: string;
  tailoredImpact: string;
}

interface TailorResponse {
  experiences: TailorExperience[];
  projects: TailorProject[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TailorRequest;
    const { resume, jobRequirements, jobTitle, company } = body;

    const hasFullJD = !!jobRequirements?.trim();
    const hasJobTitle = !!jobTitle?.trim();

    if (!hasFullJD && !hasJobTitle) {
      return NextResponse.json(
        { message: "请填写目标岗位描述或至少输入岗位名称。" },
        { status: 400 },
      );
    }

    const apiError = getAIErrorMessage();
    if (apiError) {
      return NextResponse.json({ message: apiError }, { status: 500 });
    }

    const experiencesContext = (resume.experiences ?? [])
      .map(
        (exp) =>
          `[${exp.id}] ${exp.role} @ ${exp.company}\n${exp.highlights.map((h) => `- ${h}`).join("\n")}`,
      )
      .join("\n\n");

    const projectsContext = (resume.projects ?? [])
      .map(
        (proj) =>
          `[${proj.id}] ${proj.title}\n描述: ${proj.description}\n影响: ${proj.impact}`,
      )
      .join("\n\n");

    const context = [experiencesContext, projectsContext].filter(Boolean).join("\n\n");

    if (!context.trim()) {
      return NextResponse.json(
        { message: "简历中暂无经历或项目内容，请先填写。" },
        { status: 400 },
      );
    }

    const hrPersona = `你是某头部互联网公司有 8 年招聘经验的 HR 负责人，面试过 500+ 校招和社招候选人。你深谙每个岗位 JD 背后的真实用人需求：JD 写"需求分析"实际是"能不能独立和业务方聊清楚他要什么"；JD 写"SQL"实际是"进去要自己跑数据发现问题"。`;

    let jobContext: string;
    if (hasFullJD) {
      jobContext = `目标岗位的完整描述：\n${jobRequirements}`;
    } else {
      const companyStr = company ? ` @ ${company}` : "";
      jobContext = `目标岗位：${jobTitle}${companyStr}\n\n请根据你的行业经验，推断这个岗位最看重的 3-5 项核心能力和典型工作场景，然后据此优化简历内容。`;
    }

    const systemPrompt = `${hrPersona}\n\n根据目标岗位要求，重写简历中的经历和项目描述，突出最能打动面试官的关键词和成果。保持事实不变，不要编造数据。只返回 JSON。`;

    const userPrompt = `${jobContext}

当前简历内容：
${context}

返回 JSON（id 保持原样）：
{"experiences":[{"id":"...","tailoredHighlights":["..."]}],"projects":[{"id":"...","tailoredDescription":"...","tailoredImpact":"..."}]}`;

    const content = await callAI({ systemPrompt, userPrompt, maxTokens: 4096 });

    if (!content) {
      return NextResponse.json(
        { message: "AI 返回内容为空，请重试。" },
        { status: 502 },
      );
    }

    const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    const parsed = JSON.parse(jsonStr) as TailorResponse;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Tailor API error:", error);
    return NextResponse.json(
      { message: "处理请求时出错，请稍后重试。" },
      { status: 500 },
    );
  }
}
