"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShareRoom } from "@/types";
import { FileCard } from "@/components/room/FileCard";
import { DownloadButton } from "@/components/room/DownloadButton";
import { ExpiryTimer } from "@/components/room/ExpiryTimer";
import { ExpiredRoom } from "@/components/room/ExpiredRoom";
import { Loader2, Share2, FolderDown } from "lucide-react";
import { motion } from "framer-motion";

export default function RoomPage() {
  const params = useParams();
  const code = (params?.code as string)?.toUpperCase();

  const [room, setRoom] = useState<ShareRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    async function fetchRoom() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/rooms/${code}`);
        const json = await res.json();

        if (res.status === 410 || (json.error && json.error.includes("expired"))) {
          setIsExpired(true);
          return;
        }

        if (!res.ok || !json.data?.room) {
          setErrorMessage(json.error || "Room not found");
          return;
        }

        setRoom(json.data.room);
      } catch (err) {
        setErrorMessage("Failed to load room details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoom();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading files...</p>
      </div>
    );
  }

  if (isExpired) {
    return <ExpiredRoom message="This share has expired" />;
  }

  if (errorMessage || !room) {
    return <ExpiredRoom message={errorMessage || "Share code not found"} />;
  }

  const fileCount = room.files?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6 py-6"
    >
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Files shared with you
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {room.uploader_name} shared {fileCount} {fileCount === 1 ? "file" : "files"}
            </h1>
          </div>

          <ExpiryTimer
            expiresAt={room.expires_at}
            onExpire={() => setIsExpired(true)}
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Code: {room.room_code}</span>
        </div>
      </div>

      {/* Shared File List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 px-1 flex items-center space-x-2">
          <FolderDown className="w-4 h-4 text-blue-600" />
          <span>Shared Files</span>
        </h3>

        {fileCount === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-sm">
            No files found in this share.
          </div>
        ) : (
          room.files?.map((file) => (
            <FileCard key={file.id} file={file} roomCode={room.room_code} />
          ))
        )}
      </div>

      {/* Download All Primary Action */}
      {fileCount > 0 && (
        <div className="flex justify-end pt-2">
          <DownloadButton
            roomCode={room.room_code}
            isDownloadAll
            variant="primary"
            size="lg"
          />
        </div>
      )}
    </motion.div>
  );
}
