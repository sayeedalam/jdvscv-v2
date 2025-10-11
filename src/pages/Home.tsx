import React, { useState } from "react";
import { JDInput } from "../components/JDInput";
import { FileUploader } from "../components/FileUploader";
import { ResultViewer } from "../components/ResultViewer";

export const Home: React.FC = () => {
  const [jd, setJD] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Handle Analyze Button Click
  // -----------------------------
  const handleAnalyze = async () => {
    if (!file || !jd.trim()) {
      alert("Please provide both a Job Description and a Resume file.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // ============================
      // STEP 1 — Upload Resume (Hostinger)
      // ============================
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await fetch(
        "https://letsapplai.com/jdvscv2/uploads/javsresume/resume_upload.php",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok)
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);

      const uploadData = await uploadResponse.json();
      if (uploadData.status !== "success")
        throw new Error(uploadData.message || "Upload failed.");

      // ============================
      // STEP 2 — Extract Text (Hostinger)
      // ============================
      const extractResponse = await fetch(
        "https://letsapplai.com/jdvscv2/uploads/javsresume/extract_text.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: uploadData.filename }),
        }
      );

      if (!extractResponse.ok)
        throw new Error(`Extraction failed: ${extractResponse.statusText}`);

      const extractData = await extractResponse.json();
      if (extractData.status !== "success")
        throw new Error(extractData.message || "Extraction failed.");

      // ============================
      // STEP 3 — Analyze JD vs CV (Vercel / Gemini)
      // ============================
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jd,
          resumeText: extractData.text,
        }),
      });

      if (!analyzeResponse.ok)
        throw new Error(`Analysis failed: ${analyzeResponse.statusText}`);

      const analysisResult = await analyzeResponse.json();
      setResult(analysisResult);
    } catch (err: any) {
      console.error("JDvsCV Error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Render UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-600 text-white py-4 text-center font-bold text-xl shadow-md">
        JD vs CV Analyzer v2
      </header>

      <main className="max-w-3xl mx-auto mt-10 px-4 pb-16">
        {/* Job Description Input */}
        <JDInput jd={jd} setJD={setJD} />

        {/* Resume Uploader */}
        <FileUploader
          onFileSelect={setFile}
          onAnalyze={handleAnalyze}
          file={file}
        />

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center text-blue-600 mt-4 font-semibold">
            ⏳ Analyzing your resume against the job description...
          </div>
        )}

        {/* Results */}
        <ResultViewer result={result} />
      </main>

      <footer className="bg-gray-800 text-gray-300 text-center py-4 text-sm">
        © 2025 LibraTech Systems · LetsApplAI JDvsCV v2
      </footer>
    </div>
  );
};
