// ===============================
// JDvsCV v2 – FINAL FIXED VERSION (Resilient pdf-parse Import)
// ===============================

import formidable from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
// FIX: Use namespace import instead of default import to fix the TS1192 error.
import * as pdf from "pdf-parse"; 

export const config = { api: { bodyParser: false } };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------- extract text ----------
async function extractText(filePath: string, mimeType: string): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  if (mimeType.includes("pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    
    // FIX: This pattern safely retrieves the parser function whether it's the 
    // default export (.default) or the main module export (pdf).
    const parserFunction = (pdf as any).default || pdf;
    const parsed = await parserFunction(dataBuffer); 
    
    return parsed.text;
  }

  if (mimeType.includes("word") || mimeType.includes("officedocument")) {
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ---------- handler ----------
export default async function handler(req: any, res: any) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST allowed" });

  try {
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ message: "Invalid form data", error: err.message });

      try {
        const jd = fields.jobDescription?.[0] || "";
        const file = files.resume?.[0];
        if (!file)
          return res.status(400).json({ message: "No resume file uploaded" });

        const text = await extractText(file.filepath, file.mimetype || "");

        const prompt = `
Compare this job description and resume.
Return JSON with: overall_score (0–100), strengths[], weaknesses[], missing_keywords[], verdict (string).

Job Description:
${jd}

Resume:
${text}
`;

        const aiResp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const raw = (aiResp.text || "").trim();
        let parsed;
        try {
          const cleaned = raw.replace(/^```json/, "").replace(/```$/, "");
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { error: "Failed to parse Gemini output", raw: raw.slice(0, 300) };
        }

        return res.status(200).json(parsed);
      } catch (innerErr: any) {
        console.error("Processing error:", innerErr);
        return res
          .status(500)
          .json({ message: innerErr.message || "Processing failed" });
      }
    });
  } catch (err: any) {
    console.error("Server error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
}