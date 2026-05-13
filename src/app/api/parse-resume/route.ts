import { NextResponse } from "next/server";
import { normalizeResumeProfile } from "@/lib/utils";
import type { ResumeProfile } from "@/lib/types";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);

function detectFileType(file: File): "pdf" | "docx" | null {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    if (file.type === "application/pdf") return "pdf";
    return "docx";
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = new PDFParse({ data: buffer });
  const result = await pdfParse.getText();
  const text = result.text?.trim() ?? "";
  if (!text) {
    throw new Error("PDF 文件无法读取文字，可能为扫描件或图片型 PDF。");
  }
  return text;
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() ?? "";
  if (!text) {
    throw new Error("Word 文件无法读取文字。");
  }
  return text;
}

async function parseWithClaude(rawText: string): Promise<Partial<ResumeProfile> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `你是一个专业的简历解析助手。用户会提供一份从 PDF 或 Word 文件中提取的简历纯文本。
请仔细阅读文本，将其解析为结构化的 JSON 数据。只返回 JSON，不要包含其他内容。

规则：
1. 从文本中提取所有可识别的字段，缺失的字段留空字符串或空数组。
2. 姓名、邮箱、电话、出生日期、地点、个人网站、GitHub、LinkedIn、求职方向（headline）、个人简介（summary）放入 basics 对象。
3. 工作/实习经历放入 experiences 数组，每项包含 company、role、period、location、highlights。
4. 项目经历放入 projects 数组，每项包含 title、year、description、impact、link、tags。
5. 教育经历放入 education 数组，每项包含 school、major、degree、period、gpa、courses。
6. 校园/社团经历放入 campus 数组，每项包含 org、role、period、highlights。
7. 技能放入 skills 数组，每项包含 category、items。
8. 获奖/证书放入 awards 数组，每项包含 title、issuer、year、description。
9. 多条个人评价放入 evaluation 字符串数组。
10. 保持原文信息不变，不要编造内容。`;

  const userPrompt = `请解析以下简历文本：\n\n${rawText}`;

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
    console.error("Claude API error:", response.status, await response.text().catch(() => ""));
    return null;
  }

  const claudeResponse = await response.json();
  const content = claudeResponse.content?.[0]?.text;

  if (!content) return null;

  const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonStr) as Partial<ResumeProfile>;
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { message: "请上传简历文件。" },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "请上传简历文件。" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "文件大小不能超过 10MB。" },
        { status: 400 },
      );
    }

    const fileType = detectFileType(file);
    if (!fileType) {
      return NextResponse.json(
        { message: "仅支持 PDF 和 Word (.docx) 格式。" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText: string;
    try {
      rawText = await (fileType === "pdf"
        ? extractTextFromPDF(buffer)
        : extractTextFromDOCX(buffer));
    } catch (err) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message : "文件解析失败。" },
        { status: 400 },
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { message: "未能从文件中提取到文字，请确认文件包含可选择的文本而非图片。" },
        { status: 400 },
      );
    }

    const parsed = await parseWithClaude(rawText);
    if (!parsed) {
      return NextResponse.json(
        { message: "AI 解析失败，请检查 ANTHROPIC_API_KEY 是否配置正确。" },
        { status: 502 },
      );
    }

    const profile = normalizeResumeProfile(parsed);

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { message: "处理请求时出错，请稍后重试。" },
      { status: 500 },
    );
  }
}
