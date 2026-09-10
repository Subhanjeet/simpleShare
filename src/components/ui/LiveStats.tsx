import React, { useEffect, useState } from "react";
import { Users, Share2, FileText, Activity } from "lucide-react";
import { AppStats } from "@/types";
import { LiveStatsList } from "./LiveStatsList";

type TabType = "users" | "shares" | "files";

interface LiveStatsProps {
  refreshTrigger?: number;
}

export const LiveStats: React.FC<LiveStatsProps> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("files");

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

  const getListHeader = () => {
    if (activeTab === "users") {
      const count = stats?.recentUsers?.length || stats?.users || 0;
      return { title: "Lifetime Uploaders", count };
    }
    if (activeTab === "shares") {
      const count = stats?.activeShares?.length || stats?.shares || 0;
      return { title: "Lifetime Rooms", count };
    }
    const count = stats?.activeFiles?.length || stats?.files || 0;
    return { title: "Active Files", count };
  };

  const listHeader = getListHeader();

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Live Platform Stats</h3>
      </div>

      <div className="space-y-3.5" role="tablist" aria-label="Platform Statistics Tabs">
        {/* Stat 1: Users */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          className={`w-full flex items-center justify-between p-3 rounded-xl min-h-[44px] transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border ${
            activeTab === "users"
              ? "bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm"
              : "bg-slate-950/60 border-slate-800/80 hover:border-blue-500/30 hover:bg-slate-900/60"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
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
        </button>

        {/* Stat 2: Shares */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "shares"}
          onClick={() => setActiveTab("shares")}
          className={`w-full flex items-center justify-between p-3 rounded-xl min-h-[44px] transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 border ${
            activeTab === "shares"
              ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-sm"
              : "bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900/60"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
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
        </button>

        {/* Stat 3: Files */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "files"}
          onClick={() => setActiveTab("files")}
          className={`w-full flex items-center justify-between p-3 rounded-xl min-h-[44px] transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-purple-500 border ${
            activeTab === "files"
              ? "bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/40 shadow-sm"
              : "bg-slate-950/60 border-slate-800/80 hover:border-purple-500/30 hover:bg-slate-900/60"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0">
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
        </button>
      </div>

      {/* Tab Detail List Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">{listHeader.title}</span>
          {!isLoading && listHeader.count > 0 && (
            <span className="text-[10px] font-medium text-slate-500">
              {listHeader.count} item{listHeader.count === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <LiveStatsList activeTab={activeTab} stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
};
