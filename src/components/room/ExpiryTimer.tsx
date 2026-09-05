import React, { useState, useEffect } from "react";
import { getTimeRemaining } from "@/lib/utils/format";
import { Clock, CircleAlert } from "lucide-react";

interface ExpiryTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const ExpiryTimer: React.FC<ExpiryTimerProps> = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = getTimeRemaining(expiresAt);
      setTimeLeft(updated);
      if (updated.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-400 text-xs font-medium">
        <CircleAlert className="w-3.5 h-3.5" />
        <span>Share Expired</span>
      </div>
    );
  }

  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days} ${timeLeft.days === 1 ? "day" : "days"}`);
  if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours} ${timeLeft.hours === 1 ? "hour" : "hours"}`);
  parts.push(`${timeLeft.minutes} ${timeLeft.minutes === 1 ? "min" : "mins"}`);

  return (
    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-400 text-xs font-semibold">
      <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
      <span>Expires in {parts.join(" ")}</span>
    </div>
  );
};
