// ===============================
// JDvsCV v2 – FINAL Unified API Endpoint
// Clean, Stable, 100% Vercel-Compatible
// ===============================

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import formidable from "formidable";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false }, // disable Vercel's built-in body parser
};

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utility: extract text from PDF/DOCX
async function extractText(filePath: string, mimeType: string) {
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const form = formidable({ keepExtensions: true });

    // Parse form data
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable parse error:", err);
        return res.status(400).json({ message: "Invalid form data", error: err.message });
      }

      try {
        const jobDescription = fields.jobDescription?.[0] || "";
        const resumeFile = files.resume?.[0];

        if (!resumeFile) {
          return res.status(400).json({ message: "No resume file uploaded" });
        }

        const mimeType = resumeFile.mimetype || "";
        const resumeText = await extractText(resumeFile.filepath, mimeType);

        // Gemini prompt
        const prompt = `
Compare the following Job Description and Resume.
Return a JSON with these fields:
overall_score (0–100), strengths[], weaknesses[], missing_keywords[], verdict (string).

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        // Safely extract JSON
        const rawText = (result.text || "").trim();
        let parsedResult: any;

        try {
          const clean = rawText.replace(/^```json/, "").replace(/```$/, "");
          parsedResult = JSON.parse(clean);
        } catch {
          parsedResult = {
            error: "Failed to parse AI response",
            raw: rawText.substring(0, 300),
          };
        }

        return res.status(200).json(parsedResult);
      } catch (innerErr: any) {
        console.error("Processing error:", innerErr);
        return res.status(500).json({ message: "Resume processing failed", error: innerErr.message });
      }
    });
  } catch (err: any) {
    console.error("Upload-and-analyze error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
