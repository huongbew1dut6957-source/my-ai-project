import { NextResponse } from "next/server";

interface TailorRequest {
  resume: {
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
  jobRequirements: string;
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
    const { resume, jobRequirements } = body;

    if (!jobRequirements?.trim()) {
      return NextResponse.json(
        { message: "请填写目标岗位描述。" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "AI 服务未配置（ANTHROPIC_API_KEY）。" },
        { status: 500 },
      );
    }

    const experiencesContext = (resume.experiences ?? [])
      .map(
        (exp) =>
          `[经历] ${exp.role} @ ${exp.company}\n${exp.highlights.map((h) => `- ${h}`).join("\n")}`,
      )
      .join("\n\n");

    const projectsContext = (resume.projects ?? [])
      .map(
        (proj) =>
          `[项目] ${proj.title}\n描述: ${proj.description}\n影响: ${proj.impact}`,
      )
      .join("\n\n");

    const context = [experiencesContext, projectsContext].filter(Boolean).join("\n\n");

    if (!context.trim()) {
      return NextResponse.json(
        { message: "简历中暂无经历或项目内容，请先填写。" },
        { status: 400 },
      );
    }

    const systemPrompt =
      "你是一个专业的简历优化助手。根据目标岗位要求，重写简历中的经历描述和项目内容，使其更贴合目标岗位。保持事实不变，突出与目标岗位相关的关键词和成果。只返回 JSON，不要包含其他内容。";

    const userPrompt = `目标岗位要求：
${jobRequirements}

当前简历内容：
${context}

请按以下 JSON 格式返回优化建议，id 保持原样不变：
{"experiences":[{"id":"...","tailoredHighlights":["..."]}],"projects":[{"id":"...","tailoredDescription":"...","tailoredImpact":"..."}]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Claude API error:", response.status, errorBody);
      return NextResponse.json(
        { message: "AI 服务请求失败，请稍后重试。" },
        { status: 502 },
      );
    }

    const claudeResponse = await response.json();
    const content = claudeResponse.content?.[0]?.text;

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
