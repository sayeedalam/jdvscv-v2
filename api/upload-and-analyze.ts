import { IncomingForm } from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import pdf from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // formidable handles multipart
  },
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utility: extract text from uploaded resume
async function extractText(filePath: string, mimeType: string) {
  if (mimeType.includes("pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.text;
  } else if (mimeType.includes("word")) {
    const buffer = fs.readFileSync(filePath);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } else {
    throw new Error("Unsupported file type");
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST method allowed" });
  }

  try {
    // Parse multipart form (JD + resume)
    const form = new IncomingForm({ keepExtensions: true });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(400).json({ message: "Invalid form data" });
      }

      const jobDescription = fields.jobDescription?.[0] || "";
      const file = files.resume?.[0];

      if (!file) return res.status(400).json({ message: "No resume uploaded" });

      const mimeType = file.mimetype || "";
      const resumeText = await extractText(file.filepath, mimeType);

      // Create prompt for Gemini
      const prompt = `
Compare the following job description and resume.
Output a JSON with:
- overall_score (0–100)
- strengths
- weaknesses
- missing_keywords
- verdict

Job Description:
${jobDescription}

Resume:
${resumeText}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const raw = response.text().trim();
      const jsonString = raw.replace(/^```json/, "").replace(/```$/, "");
      const result = JSON.parse(jsonString);

      return res.status(200).json(result);
    });
  } catch (err: any) {
    console.error("Error in upload-and-analyze:", err);
    res.status(500).json({ message: "Failed to process resume", error: err.message });
  }
}
