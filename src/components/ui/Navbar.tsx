import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div
            className="relative w-10 h-10 rounded-xl overflow-hidden border border-blue-500/40 shadow-sm group-hover:border-blue-400 transition-colors flex-shrink-0 bg-slate-900"
            style={{ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px" }}
          >
            <Image
              src="/logo.jpg"
              alt="SimpleShare Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              style={{ width: "40px", height: "40px", objectFit: "cover" }}
              priority
            />
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
