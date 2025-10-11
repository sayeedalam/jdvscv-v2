// /api/upload-and-analyze.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = { api: { bodyParser: false } };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function extractText(path: string, mime: string) {
  if (mime.includes("pdf")) {
    const buf = fs.readFileSync(path);
    const data = await pdfParse(buf);
    return data.text;
  }
  if (mime.includes("word") || mime.includes("officedocument")) {
    const buf = fs.readFileSync(path);
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  throw new Error("Unsupported file type");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Only POST allowed" });

  const form = formidable({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ message: "Invalid form data" });

    try {
      const jd = (fields.jobDescription as string[])?.[0] ?? "";
      const file: any = (files.resume as any)?.[0];
      const text = await extractText(file.filepath, file.mimetype);

      const prompt = `
Compare JD and Resume. Return JSON:
overall_score (0–100), strengths, weaknesses, missing_keywords, verdict.

JD:
${jd}

Resume:
${text}
`;

      const reply = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const raw = reply.text.trim(); // property, not function
      const json = JSON.parse(raw.replace(/^```json/, "").replace(/```$/, ""));
      res.status(200).json(json);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
}
