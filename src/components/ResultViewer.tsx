import React from 'react';

export const ResultViewer = ({ result }: { result: any }) => {
  if (!result) return null;
  return (
    <div className="mt-6 bg-gray-50 border rounded-lg p-4 text-sm text-gray-800">
      <h3 className="text-lg font-semibold mb-2">Fit Score: {result.overall_score}/100</h3>
      <p className="font-medium">Verdict: {result.verdict}</p>
      <h4 className="mt-3 font-semibold">Strengths</h4>
      <ul className="list-disc ml-6">
        {result.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
      </ul>
      <h4 className="mt-3 font-semibold">Weaknesses</h4>
      <ul className="list-disc ml-6">
        {result.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
};
