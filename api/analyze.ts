import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { jobDescription, resumeText } = req.body || {};
  if (!jobDescription || !resumeText)
    return res.status(400).json({ error: "Missing jobDescription or resumeText" });

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

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const jsonText = result.text.trim().replace(/^```json/, "").replace(/```$/, "");
    const parsed = JSON.parse(jsonText);

    res.status(200).json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: "Gemini API failed", details: err.message });
  }
}
