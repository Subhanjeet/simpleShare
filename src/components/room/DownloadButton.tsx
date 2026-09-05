import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  roomCode: string;
  fileId?: string; // If undefined or 'all', downloads all files as ZIP
  fileName?: string;
  isDownloadAll?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  roomCode,
  fileId = "all",
  fileName,
  isDownloadAll = false,
  variant = isDownloadAll ? "primary" : "secondary",
  size = "md",
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const downloadUrl = `/api/rooms/${roomCode}/download/${fileId}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName || `SimpleShare_${roomCode}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      isLoading={isDownloading}
      onClick={handleDownload}
      leftIcon={<Download className="w-4 h-4" />}
    >
      {isDownloadAll ? "Download All" : "Download"}
    </Button>
  );
};
