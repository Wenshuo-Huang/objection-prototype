import OpenAI from "openai";
import { createHash, randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FileRecord {
  name: string;
  hash: string;
  text: string;
  type: string;
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a")) {
    return `[AUDIO FILE: ${file.name} — ${(file.size / 1024).toFixed(1)} KB. Duration and content not extractable in this prototype. Treat as corroborating audio evidence.]`;
  }

  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return `[IMAGE FILE: ${file.name} — ${(file.size / 1024).toFixed(1)} KB. Visual content not extractable in this prototype.]`;
  }

  const buffer = await file.arrayBuffer();

  if (name.endsWith(".docx")) {
    // Minimal DOCX text extraction: unzip and parse word/document.xml
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(buffer);
      const xmlFile = zip.file("word/document.xml");
      if (!xmlFile) return "[DOCX: could not read document.xml]";
      const xml = await xmlFile.async("string");
      const text = xml
        .replace(/<w:br[^/]*/g, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return text;
    } catch {
      return `[DOCX: extraction failed for ${file.name}]`;
    }
  }

  if (name.endsWith(".pdf")) {
    // Return raw bytes as text — PDFs with embedded text can be partially read
    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      const cleaned = text
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return cleaned.slice(0, 8000);
    } catch {
      return `[PDF: extraction failed for ${file.name}]`;
    }
  }

  // Plain text
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function hashBuffer(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function generateCertificateId(): string {
  const uid = randomUUID().replace(/-/g, "").toUpperCase().slice(0, 6);
  return `OBJ-${new Date().getFullYear()}-${uid}`;
}

function classifyScore(score: number): string {
  if (score >= 80) return "HIGH CREDIBILITY";
  if (score >= 60) return "MODERATE CREDIBILITY";
  return "LOW CREDIBILITY — INSUFFICIENT EVIDENCE";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFiles = formData.getAll("files") as File[];
    const context = (formData.get("context") as string) || "";

    if (rawFiles.length === 0) {
      return Response.json({ error: "No files provided" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Hash and extract text from all files
    const fileRecords: FileRecord[] = await Promise.all(
      rawFiles.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const hash = hashBuffer(buffer);
        const text = await extractText(file);
        return { name: file.name, hash, text, type: file.type };
      })
    );

    // Build the prompt for Claude
    const evidenceBlocks = fileRecords
      .map(
        (f, i) =>
          `--- EVIDENCE FILE ${i + 1}: ${f.name} ---\n${f.text.slice(0, 6000)}\n`
      )
      .join("\n");

    const systemPrompt = `You are an evidence verification analyst for investigative journalism. Your job is to assess a package of evidence submitted by an anonymous source.

You must analyze the evidence package and return a JSON object with EXACTLY this structure:
{
  "confidence": <integer 0-100>,
  "breakdown": [
    { "dimension": "Timeline Consistency", "score": <0-100>, "summary": "<1-2 sentences>" },
    { "dimension": "Cross-Document Corroboration", "score": <0-100>, "summary": "<1-2 sentences>" },
    { "dimension": "Source Motivation Plausibility", "score": <0-100>, "summary": "<1-2 sentences>" },
    { "dimension": "Claim Specificity & Verifiability", "score": <0-100>, "summary": "<1-2 sentences>" },
    { "dimension": "Document Provenance Integrity", "score": <0-100>, "summary": "<1-2 sentences>" }
  ],
  "corroborationSummary": "<2-3 sentences summarizing how documents corroborate each other>",
  "redFlags": ["<caveat 1>", "<caveat 2>"],
  "attributionLanguage": "<A single ready-to-publish attribution sentence a journalist can copy directly, referencing the certificate ID placeholder {{CERT_ID}}>"
}

IMPORTANT RULES:
- The overall confidence score is a weighted average of the breakdown scores, reflecting holistic judgment.
- Do NOT include any source-identifying information in attributionLanguage, corroborationSummary, or breakdown summaries.
- redFlags should list 1-4 genuine limitations, uncertainties, or caveats about the evidence.
- Output ONLY valid JSON, no explanation, no markdown fences.`;

    const userMessage = `Context provided by journalist: ${context || "None"}

Evidence package submitted at: ${timestamp}
Number of files: ${fileRecords.length}
File names: ${fileRecords.map((f) => f.name).join(", ")}

${evidenceBlocks}

Analyze this evidence package and return the JSON assessment.`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawJson = response.choices[0]?.message?.content ?? "";

    let parsed: {
      confidence: number;
      breakdown: { dimension: string; score: number; summary: string }[];
      corroborationSummary: string;
      redFlags: string[];
      attributionLanguage: string;
    };

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (!match) {
        return Response.json({ error: "AI returned invalid response" }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    const certId = generateCertificateId();

    const certificate = {
      id: certId,
      timestamp,
      confidence: parsed.confidence,
      classification: classifyScore(parsed.confidence),
      evidenceCount: fileRecords.length,
      fileHashes: fileRecords.map((f) => ({ name: f.name, hash: f.hash })),
      breakdown: parsed.breakdown,
      corroborationSummary: parsed.corroborationSummary,
      redFlags: parsed.redFlags || [],
      attributionLanguage: parsed.attributionLanguage.replace("{{CERT_ID}}", certId),
    };

    return Response.json(certificate);
  } catch (err: unknown) {
    console.error("Verification error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
