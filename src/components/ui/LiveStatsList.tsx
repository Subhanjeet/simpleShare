import React from "react";
import { Users, Share2, FileText, HardDriveDownload, FolderArchive, UserCheck, Lock } from "lucide-react";
import { AppStats } from "@/types";
import { bytesToSize } from "@/lib/utils/format";

type TabType = "users" | "shares" | "files";

interface LiveStatsListProps {
  activeTab: TabType;
  stats: AppStats | null;
  isLoading: boolean;
}

export const LiveStatsList: React.FC<LiveStatsListProps> = ({ activeTab, stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 animate-pulse">
        <span className="text-xs text-slate-500">Loading {activeTab} data...</span>
      </div>
    );
  }

  if (activeTab === "users") {
    const usersList = stats?.recentUsers || [];
    if (usersList.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-400">No registered uploaders yet</p>
          <p className="text-[10px] text-slate-500">Uploader activity will appear here as rooms are created.</p>
        </div>
      );
    }

    return (
      <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {usersList.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate" title={user.uploaderName}>
                  {user.uploaderName}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {user.totalRooms} room{user.totalRooms === 1 ? "" : "s"} • {user.totalFiles} file{user.totalFiles === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono border border-blue-500/20 shrink-0">
              Active
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "shares") {
    const sharesList = stats?.activeShares || [];
    if (sharesList.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <FolderArchive className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-slate-400">No active rooms found</p>
          <p className="text-[10px] text-slate-500">Active rooms created in the last 7 days will be listed here.</p>
        </div>
      );
    }

    return (
      <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {sharesList.map((share, idx) => (
          <div
            key={share.id || idx}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  Active Share Room
                </p>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  By {share.uploaderName} • {share.filesCount} file{share.filesCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono shrink-0">
              <Lock className="w-2.5 h-2.5 text-emerald-400" />
              <span>Private</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Active Files Tab
  const filesList = stats?.activeFiles || [];
  if (filesList.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1">
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <HardDriveDownload className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-slate-400">Currently we don&apos;t have files</p>
        <p className="text-[10px] text-slate-500">Active files from the last 7 days will be listed here.</p>
      </div>
    );
  }

  return (
    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
      {filesList.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 transition-colors"
        >
          <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">{bytesToSize(file.size)}</p>
            </div>
          </div>

          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono shrink-0">
            <Lock className="w-2.5 h-2.5 text-purple-400" />
            <span>Protected</span>
          </span>
        </div>
      ))}
    </div>
  );
};
