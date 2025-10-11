import React, { useState, useEffect } from "react";

interface JDInputProps {
  jd: string;
  setJD: (v: string) => void;
}

export const JDInput: React.FC<JDInputProps> = ({ jd, setJD }) => {
  const [wordCount, setWordCount] = useState(0);
  const maxWords = 300; // reasonable JD limit

  // Update live word count
  useEffect(() => {
    const words = jd.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [jd]);

  // Handle change with word limit enforcement
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    const words = input.trim().split(/\s+/);
    if (words.length <= maxWords) {
      setJD(input);
    } else {
      alert(`Maximum ${maxWords} words allowed.`);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow p-6 border border-gray-200">
      <label
        htmlFor="jd-input"
        className="block text-gray-800 font-semibold text-lg mb-2"
      >
        Paste the Job Description
      </label>

      <textarea
        id="jd-input"
        value={jd}
        onChange={handleChange}
        rows={10}
        placeholder={`Example:
We are seeking a Full Stack Developer with 3+ years of experience in React, Node.js, and RESTful APIs. The ideal candidate has built scalable web applications, understands cloud deployment (AWS preferred), and can collaborate with design and backend teams. Experience with SQL or NoSQL databases is a plus.`}
        className="w-full text-sm leading-relaxed border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 resize-none"
      />

      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Provide clear, detailed job description text.</span>
        <span>
          {wordCount}/{maxWords} words
        </span>
      </div>
    </div>
  );
};
