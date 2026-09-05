import React from "react";
import { SharedFile } from "@/types";
import { bytesToSize } from "@/lib/utils/format";
import { DownloadButton } from "./DownloadButton";
import { FileText, FileArchive, Image as ImageIcon, FileCode, Film, Music } from "lucide-react";

interface FileCardProps {
  file: SharedFile;
  roomCode: string;
}

export const FileCard: React.FC<FileCardProps> = ({ file, roomCode }) => {
  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-cyan-400" />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || mimeType.includes("zip")) {
      return <FileArchive className="w-5 h-5 text-indigo-400" />;
    }
    if (mimeType.startsWith("video/") || ["mp4", "mkv", "mov"].includes(ext)) {
      return <Film className="w-5 h-5 text-purple-400" />;
    }
    if (mimeType.startsWith("audio/") || ["mp3", "wav", "flac"].includes(ext)) {
      return <Music className="w-5 h-5 text-emerald-400" />;
    }
    if (["js", "ts", "json", "html", "css", "py"].includes(ext)) {
      return <FileCode className="w-5 h-5 text-sky-400" />;
    }
    return <FileText className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100/[0.08] border border-slate-700/80 hover:border-slate-600 hover:bg-slate-100/[0.12] transition-all shadow-sm">
      <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
          {getFileIcon(file.mime_type, file.original_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate" title={file.original_name}>
            {file.original_name}
          </h4>
          <p className="text-xs text-slate-400 font-mono">
            {bytesToSize(file.file_size)}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0">
        <DownloadButton
          roomCode={roomCode}
          fileId={file.id}
          fileName={file.original_name}
          variant="secondary"
          size="sm"
        />
      </div>
    </div>
  );
};
