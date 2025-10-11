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
      // Prepare multipart form data for upload + JD text
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jd);

      // Single API call to unified backend route
      const response = await fetch("/api/upload-and-analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
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
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 text-center font-bold text-xl shadow-md">
        JD vs CV Analyzer v2
      </header>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto mt-10 px-4 pb-16">
        {/* Job Description Input */}
        <JDInput jd={jd} setJD={setJD} />

        {/* File Uploader */}
        <FileUploader
          onFileSelect={setFile}
          onAnalyze={handleAnalyze}
          file={file}
        />

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center text-blue-600 mt-4 font-semibold">
            ⏳ Uploading and analyzing your resume...
          </div>
        )}

        {/* Results Viewer */}
        <ResultViewer result={result} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 text-center py-4 text-sm">
        © 2025 LibraTech Systems · LetsApplAI JDvsCV v2
      </footer>
    </div>
  );
};
