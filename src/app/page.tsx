"use client";

import React, { useState } from "react";
import {
  FileUploader,
  FileList,
  UploadProgress,
  ShareRoomModal,
  RoomCodeInput,
  CodeOptionSelector,
  CodeOptionResult,
  LiveStats,
  Button,
} from "@/components";
import { SelectedFileItem, ShareRoom } from "@/types";
import { getLimitsFromEnv } from "@/lib/validation/room";
import { getPageInstanceSessionId } from "@/lib/utils/page-session";
import { Upload, CircleAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<ShareRoom | null>(null);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);
  const [codeOption, setCodeOption] = useState<CodeOptionResult>({
    codeType: "generated",
    customCode: "",
    isValid: true,
  });

  const limits = getLimitsFromEnv();

  const handleFilesSelected = (incomingFiles: File[]) => {
    setErrorMessage(null);
    const newItems: SelectedFileItem[] = incomingFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    }));

    const combined = [...selectedFiles, ...newItems];

    if (combined.length > limits.maxFilesPerRoom) {
      setErrorMessage(`Maximum ${limits.maxFilesPerRoom} files per room allowed.`);
      return;
    }

    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > limits.maxTotalSizeMB * 1024 * 1024) {
      setErrorMessage(`Total files size cannot exceed ${limits.maxTotalSizeMB} MB.`);
      return;
    }

    setSelectedFiles(combined);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setErrorMessage(null);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    if (codeOption.codeType === "custom" && !codeOption.isValid) return;

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMessage(null);

    try {
      const sessionId = getPageInstanceSessionId();

      const formData = new FormData();
      formData.append("uploaderName", "Subhan");
      formData.append("codeType", codeOption.codeType);
      if (codeOption.codeType === "custom") {
        formData.append("customCode", codeOption.customCode);
      }
      if (sessionId) {
        formData.append("sessionId", sessionId);
      }

      selectedFiles.forEach((item) => {
        formData.append("files", item.file);
      });

      setUploadProgress(45);
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Upload failed");
      }

      setUploadProgress(100);
      setCreatedRoom(json.data.room);
      setStatsRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload files";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto py-6 sm:py-10"
    >
      {/* Hero Header */}
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
          Send files. Simply.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
          Share files with friends in seconds — no account, no hassle.
        </p>
      </div>

      {/* Main Grid: Live Stats on LEFT (lg:col-span-4), Main Uploader Area on RIGHT (lg:col-span-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Statistics Section */}
        <div className="lg:col-span-4 space-y-6">
          <LiveStats refreshTrigger={statsRefreshTrigger} />
        </div>

        {/* Right Column: Main Upload & Room Workflow */}
        <div className="lg:col-span-8 space-y-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center space-x-3 text-rose-300 text-sm shadow-lg">
              <CircleAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Main Share View Area */}
          {createdRoom ? (
            <ShareRoomModal
              room={createdRoom}
              onReset={() => {
                setCreatedRoom(null);
                setSelectedFiles([]);
              }}
            />
          ) : (
            <div className="space-y-6">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                isDisabled={isUploading}
                maxFiles={limits.maxFilesPerRoom}
                maxFileSizeMB={limits.maxFileSizeMB}
                maxTotalSizeMB={limits.maxTotalSizeMB}
              />

              <FileList
                files={selectedFiles}
                onRemoveFile={handleRemoveFile}
                onClearAll={handleClearAll}
              />

              {selectedFiles.length > 0 && !isUploading && (
                <CodeOptionSelector
                  onChange={setCodeOption}
                  isDisabled={isUploading}
                />
              )}

              {isUploading && <UploadProgress progress={uploadProgress} />}

              {selectedFiles.length > 0 && !isUploading && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartUpload}
                    isDisabled={!codeOption.isValid}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Create Share
                  </Button>
                </div>
              )}

              {/* Join Share Secondary Section */}
              <div className="pt-2 border-t border-slate-800/80">
                <RoomCodeInput />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
