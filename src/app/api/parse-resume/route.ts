import { NextResponse } from "next/server";
import { normalizeResumeProfile } from "@/lib/utils";
import type { ResumeProfile } from "@/lib/types";
import { callAI, getAIErrorMessage } from "@/lib/ai-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
  const PDFParserCtor = await import("pdf2json");

  return new Promise((resolve, reject) => {
    const parser = new PDFParserCtor.default();
    parser.on("pdfParser_dataReady", (data: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
      const texts: string[] = [];
      for (const page of data.Pages) {
        for (const text of page.Texts) {
          for (const run of text.R) {
            texts.push(run.T);
          }
        }
      }
      const result = texts.join(" ");
      if (!result.trim()) {
        reject(new Error("PDF 文件无法读取文字，可能为扫描件或图片型 PDF。"));
      } else {
        resolve(result);
      }
    });
    parser.on("pdfParser_dataError", (err: unknown) => {
      reject(err instanceof Error ? err : new Error("PDF 解析失败。"));
    });
    parser.parseBuffer(buffer);
  });
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() ?? "";
  if (!text) {
    throw new Error("Word 文件无法读取文字。");
  }
  return text;
}

async function parseWithAI(rawText: string): Promise<{ ok: true; profile: Partial<ResumeProfile> } | { ok: false; message: string }> {
  const configError = getAIErrorMessage();
  if (configError) return { ok: false, message: configError };

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

  const content = await callAI({ systemPrompt, userPrompt, maxTokens: 4096 });

  if (!content) {
    return { ok: false, message: "AI 调用失败，请检查 API Key 和网络连接。" };
  }

  try {
    const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
    const profile = JSON.parse(jsonStr) as Partial<ResumeProfile>;
    return { ok: true, profile };
  } catch (err) {
    console.error("[parse-resume] JSON parse error:", err instanceof Error ? err.message : err);
    return { ok: false, message: "AI 返回内容格式异常，请重试。" };
  }
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

    const parsed = await parseWithAI(rawText);
    if (!parsed.ok) {
      return NextResponse.json(
        { message: parsed.message },
        { status: 502 },
      );
    }

    const profile = normalizeResumeProfile(parsed.profile);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json(
      { message: "处理请求时出错，请稍后重试。" },
      { status: 500 },
    );
  }
}
