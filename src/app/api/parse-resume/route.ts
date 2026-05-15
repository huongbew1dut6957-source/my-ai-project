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
      let result = texts.join(" ");
      let prev: string;
      do {
        prev = result;
        result = result.replace(/[一-鿿㐀-䶿] [一-鿿㐀-䶿]/g, (m) =>
          m[0] + m[2],
        );
      } while (result !== prev);
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

  const systemPrompt = `你是一个专业的简历解析助手，从 PDF 提取的纯文本中提取结构化信息。严格只返回 JSON，不要解释。

提取要点：
- 文本开头的第一个中文名就是姓名(fullName)。中文简历通常以"张三出生日期..."或"张三联系电话..."开头。
- "出生日期"后面的日期提取到 basics.birth，如"2002年7月10日"
- "联系电话"后面的数字提取到 basics.phone
- "邮箱"后面的地址提取到 basics.email
- 教育经历格式："学校名 专业 学位 时间"，GPA 和课程从紧随其后的文字提取
- 实习/工作经历格式："公司名 岗位 时间"，亮点从紧随其后的描述文字提取

JSON 结构（缺失字段用 "" 或 []）：{
  "basics": {"fullName":"","email":"","phone":"","birth":"","headline":"","summary":"","location":"","website":"","github":"","linkedin":""},
  "education": [{"school":"","major":"","degree":"","period":"","gpa":"","courses":[]}],
  "experiences": [{"company":"","role":"","period":"","location":"","highlights":[]}],
  "projects": [{"title":"","year":"","description":"","impact":"","link":"","tags":[]}],
  "campus": [{"org":"","role":"","period":"","highlights":[]}],
  "skills": [{"category":"","items":[]}],
  "awards": [{"title":"","issuer":"","year":"","description":""}],
  "evaluation": [""]
}`;

  const userPrompt = `请解析以下简历文本，务必提取文本开头的姓名和出生日期：\n\n${rawText}`;

  const content = await callAI({ systemPrompt, userPrompt, maxTokens: 4096 });

  if (!content) {
    return { ok: false, message: "AI 调用失败，请检查 API Key 和网络连接。" };
  }

  console.log("[parse-resume] AI response length:", content.length);
  console.log("[parse-resume] AI first 200:", content.substring(0, 200));

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
