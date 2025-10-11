// /api/upload-and-analyze.ts
import formidable, { IncomingForm } from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false },
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------- extract text ----------
async function extractText(filePath: string, mimeType: string) {
  if (mimeType.includes("pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }
  if (mimeType.includes("word") || mimeType.includes("officedocument")) {
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  throw new Error("Unsupported file type");
}

// ---------- handler ----------
export default async function handler(req: any, res: any) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST method allowed" });

  try {
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ message: "Invalid form data" });

      const jobDescription = fields.jobDescription?.[0] || "";
      const file = files.resume?.[0];
      if (!file) return res.status(400).json({ message: "No resume uploaded" });

      const mimeType = file.mimetype || "";
      const resumeText = await extractText(file.filepath, mimeType);

      const prompt = `
Compare this job description and resume.
Return JSON with:
overall_score (0–100), strengths, weaknesses, missing_keywords, verdict.

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      // .text is a property, not a function
      const raw = response.text.trim();
      const jsonText = raw.replace(/^```json/, "").replace(/```$/, "");
      const result = JSON.parse(jsonText);

      return res.status(200).json(result);
    });
  } catch (err: any) {
    console.error("upload-and-analyze error:", err);
    res
      .status(500)
      .json({ message: "Failed to process resume", error: err.message });
  }
}
