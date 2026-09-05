import React from "react";
import { SelectedFileItem } from "@/types";
import { bytesToSize } from "@/lib/utils/format";
import { File, Trash2, X } from "lucide-react";

interface FileListProps {
  files: SelectedFileItem[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onClearAll,
}) => {
  if (files.length === 0) return null;

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h4 className="text-sm font-semibold text-white">
          Selected ({files.length}) <span className="font-normal text-slate-400 font-mono text-xs ml-1">· {bytesToSize(totalSize)}</span>
        </h4>
        <button
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear all</span>
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {files.map((fileItem) => (
          <div
            key={fileItem.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center space-x-3 truncate pr-2">
              <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 flex items-center justify-center flex-shrink-0">
                <File className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">
                  {fileItem.name}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {bytesToSize(fileItem.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemoveFile(fileItem.id)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
