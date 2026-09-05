import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Share2, FileText, Activity, ExternalLink, HardDriveDownload } from "lucide-react";
import { AppStats } from "@/types";
import { bytesToSize } from "@/lib/utils/format";

interface LiveStatsProps {
  refreshTrigger?: number;
}

export const LiveStats: React.FC<LiveStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const json = await res.json();
        if (isMounted && json.data) {
          setStats(json.data);
        }
      } catch {
        // Silently handle fetch error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const hasActiveFiles = Boolean(stats?.activeFiles && stats.activeFiles.length > 0);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Live Platform Stats</h3>
      </div>

      <div className="space-y-3.5">
        {/* Stat 1: Users */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Users</span>
              <span className="text-[10px] text-slate-500 block">Lifetime uploaders</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-white">
            {isLoading ? "..." : (stats?.users ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Stat 2: Shares */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Shares</span>
              <span className="text-[10px] text-slate-500 block">Lifetime rooms</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-white">
            {isLoading ? "..." : (stats?.shares ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Stat 3: Files */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-400/30 text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Files</span>
              <span className="text-[10px] text-slate-500 block">Currently active</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-white">
            {isLoading ? "..." : (stats?.files ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Active Files Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Active Files</span>
          {hasActiveFiles && (
            <span className="text-[10px] font-medium text-slate-500">
              {stats?.activeFiles.length} item{stats?.activeFiles.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 animate-pulse">
            <span className="text-xs text-slate-500">Loading active files...</span>
          </div>
        ) : hasActiveFiles ? (
          <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {stats?.activeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {bytesToSize(file.size)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/room/${file.roomCode}`}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-mono shrink-0 transition-colors"
                  title={`Open room ${file.roomCode}`}
                >
                  <span>{file.roomCode}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-400">Currently we don&apos;t have files</p>
            <p className="text-[10px] text-slate-500">
              Active files from the last 7 days will be listed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
