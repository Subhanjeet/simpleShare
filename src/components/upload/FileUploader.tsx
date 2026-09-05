import React, { useState, useRef } from "react";
import { Upload, File, Files, Clock } from "lucide-react";
import { Button } from "../ui/Button";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isDisabled?: boolean;
  maxFiles?: number;
  maxFileSizeMB?: number;
  maxTotalSizeMB?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  isDisabled = false,
  maxFiles = 10,
  maxFileSizeMB = 200,
  maxTotalSizeMB = 500,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDisabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-slate-900 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 shadow-lg ${
          isDragOver
            ? "border-blue-500 bg-blue-950/30 scale-[1.01]"
            : "border-slate-800 hover:border-slate-700 bg-slate-900"
        } ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/50 shadow-inner">
            <Upload className={`w-7 h-7 ${isDragOver ? "animate-bounce text-blue-400" : ""}`} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {isDragOver ? "Drop files to upload" : "Drop files here"}
            </h3>
            <p className="text-sm text-slate-400">
              or browse from your device
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            isDisabled={isDisabled}
            leftIcon={<File className="w-4 h-4" />}
          >
            Choose Files
          </Button>
        </div>
      </div>

      {/* File Limits */}
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-400">
        <span className="flex items-center space-x-1">
          <Files className="w-3.5 h-3.5 text-slate-500" />
          <span>{maxFiles} files max</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <File className="w-3.5 h-3.5 text-slate-500" />
          <span>{maxFileSizeMB} MB per file</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <Files className="w-3.5 h-3.5 text-slate-500" />
          <span>{maxTotalSizeMB} MB total</span>
        </span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>7-day availability</span>
        </span>
      </div>
    </div>
  );
};
