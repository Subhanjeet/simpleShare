import React from "react";
import { Upload } from "lucide-react";
import { motion } from "framer-motion";

interface UploadProgressProps {
  progress: number;
  statusText?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  statusText = "Uploading files...",
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-lg">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 font-medium text-white">
          <Upload className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>{statusText}</span>
        </div>
        <span className="font-mono text-blue-400 font-semibold text-xs">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: "5%" }}
          animate={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        />
      </div>
    </div>
  );
};
