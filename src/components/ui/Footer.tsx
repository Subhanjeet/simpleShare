import React from "react";
import { Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 py-6 bg-slate-950 text-slate-400 text-xs mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 font-medium text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Files are automatically deleted after 7 days</span>
        </div>
        <div className="text-slate-500">
          <a
            href="https://github.com/Subhanjeet/simpleShare"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 rounded transition-colors duration-150"
          >
            Built by Subhanjeet
          </a>
        </div>
      </div>
    </footer>
  );
};
