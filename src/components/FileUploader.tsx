
import React, { useState, useCallback } from 'react';
import { UploadIcon, CheckCircleIcon } from "./IconComponents";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  file: File | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onAnalyze, file }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        onFileSelect(selectedFile);
      } else {
        alert('Please upload a valid PDF or DOCX file.');
      }
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full p-8 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ${isDragging ? 'border-brand-blue bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx"
          onChange={onFileInputChange}
        />
        <div className="flex flex-col items-center text-slate-600">
          <UploadIcon className="w-12 h-12 mb-4 text-slate-400" />
          <p className="font-semibold">
            <label htmlFor="file-upload" className="text-brand-blue cursor-pointer hover:underline">
              Click to upload
            </label> or drag and drop
          </p>
          <p className="text-sm text-slate-500 mt-1">PDF or DOCX only</p>
        </div>
      </div>
      
      {file && (
          <div className="w-full bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="font-medium">{file.name}</span>
              </div>
          </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!file}
        className="w-full md:w-auto bg-brand-orange text-white font-bold py-3 px-10 rounded-lg shadow-md hover:opacity-90 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Analyze My Resume
      </button>
    </div>
  );
};
