import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

const SimpleShareLogoMark: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-blue-400" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="4" width="7" height="12" rx="1.5" />
    <rect x="15" y="8" width="7" height="12" rx="1.5" />
    <path d="M7 8c2.5-3 7.5-3 10 0" />
    <path d="M15 5l2 3-3 1" />
  </svg>
);

export const Navbar: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center group-hover:bg-blue-900/50 transition-colors">
            <SimpleShareLogoMark className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              SimpleShare
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-slate-400 -mt-1 uppercase">
              DROP · CONNECT · SHARE
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>7-day availability</span>
          </div>
        </div>
      </div>
    </header>
  );
};


