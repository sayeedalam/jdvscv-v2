// ===============================
// JDvsCV v2 – Unified Upload + Analyze Endpoint (Final)
// ===============================

import formidable from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false }, // Vercel: disable default body parsing
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------- Helper: Extract text from resume ----------
async function extractText(filePath: string, mimeType: string): Promise<string> {
  if (mimeType.includes("pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType.includes("word") || mimeType.includes("officedocument")) {
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ---------- Main Handler ----------
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST method allowed" });
  }

  try {
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ message: "Invalid form data" });
      }

      const jobDescription = fields.jobDescription?.[0] || "";
      const file = files.resume?.[0];

      if (!file) {
        return res.status(400).json({ message: "No resume uploaded" });
      }

      const mimeType = file.mimetype || "";
      const resumeText = await extractText(file.filepath, mimeType);

      // --- AI Prompt ---
      const prompt = `
Compare the following Job Description and Resume.
Return a structured JSON object with:
- overall_score (0–100)
- strengths (array)
- weaknesses (array)
- missing_keywords (array)
- verdict (string)

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      // Gemini returns a text property (not a function)
      const raw = response.text.trim();
      const cleanJson = raw.replace(/^```json/, "").replace(/```$/, "");

      let result;
      try {
        result = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Gemini JSON parse failed:", parseError);
        result = { error: "Failed to parse Gemini response", raw: raw };
      }

      return res.status(200).json(result);
    });
  } catch (err: any) {
    console.error("Upload-and-Analyze Server Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
      stack: err.stack,
    });
  }
}
