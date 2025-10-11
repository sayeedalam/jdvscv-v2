// ===============================
// JDvsCV v2 – FINAL FIXED VERSION (PDF Worker Configuration) at 00:46
// ===============================

import formidable from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import path from "path"; // Added for path resolution
import { pathToFileURL } from "url"; // Added for file URL conversion

// --- PDF Worker Configuration ---
// This explicit setup helps resolve "DOMMatrix is not defined" errors
// in Vercel/Node.js environments by correctly initializing pdf-parse's dependency (pdfjs-dist).
try {
  // 1. Reliably find the path to the pdfjs-dist worker file within node_modules.
  // Note: Using 'pdfjs-dist/build/pdf.worker.mjs' is crucial for modern versions.
  // The 'as any' is a workaround for TypeScript not having a full signature for require.resolve.
  const workerPath = (require.resolve as any)("pdfjs-dist/build/pdf.worker.mjs");
  
  // 2. Convert the local file path to a file:// URL, required by the setWorker method.
  const workerUrl = pathToFileURL(workerPath).href; 
  
  // 3. Set the worker globally before any PDFParse instance is created.
  PDFParse.setWorker(workerUrl);
  
} catch (e) {
  // If this fails (e.g., in a development environment or during a pre-build step), 
  // we log a warning but proceed, letting the library try its own auto-config.
  console.warn("PDFParse worker setup failed. Relying on auto-config:", e);
}
// --- End Worker Configuration ---

export const config = { api: { bodyParser: false } };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------- extract text ----------
async function extractText(filePath: string, mimeType: string): Promise<string> {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  if (mimeType.includes("pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    
    let textContent = "";
    const parser = new PDFParse({ data: dataBuffer });
    
    try {
      const parsed = await parser.getText();
      textContent = parsed.text;
    } finally {
      // Important: Always call destroy() to free resources and prevent memory leaks.
      await parser.destroy();
    }
    
    return textContent;
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