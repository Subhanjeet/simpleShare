import React, { useState } from "react";
import { ShareRoom } from "@/types";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Button } from "../ui/Button";
import { formatExpiration, getTimeRemaining } from "@/lib/utils/format";
import { Copy, Link, CircleCheck, Clock, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ShareRoomModalProps {
  room: ShareRoom;
  onReset: () => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ room, onReset }) => {
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${room.room_code}`
    : `http://localhost:3000/room/${room.room_code}`;

  const timeRemaining = getTimeRemaining(room.expires_at);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setHasCopiedLink(true);
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl text-center"
    >
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center justify-center mx-auto shadow-inner">
          <CircleCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Your files are ready
        </h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Share this code or scan the QR to download
        </p>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center">
        <QRCodeDisplay url={shareUrl} roomCode={room.room_code} />
      </div>

      {/* Room Code Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-1">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Share Code
        </span>
        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-blue-400">
          {room.room_code}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="primary"
          onClick={handleCopyLink}
          leftIcon={hasCopiedLink ? <CircleCheck className="w-4 h-4 text-emerald-300" /> : <Link className="w-4 h-4" />}
        >
          {hasCopiedLink ? "Link Copied!" : "Copy Link"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleCopyCode}
          leftIcon={hasCopiedCode ? <CircleCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        >
          {hasCopiedCode ? "Code Copied!" : "Copy Code"}
        </Button>
      </div>

      {/* Expiration Details */}
      <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-center space-x-1.5 font-medium text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Available for 7 days</span>
          <span>·</span>
          <span>Expires in {timeRemaining.days} days {timeRemaining.hours} hours</span>
        </div>
        <p className="text-slate-500 text-[11px]">
          Expires on {formatExpiration(room.expires_at)}
        </p>
      </div>

      <div className="pt-1">
        <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
          Create Another Share
        </Button>
      </div>
    </motion.div>
  );
};
