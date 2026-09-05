import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface ExpiredRoomProps {
  message?: string;
}

export const ExpiredRoom: React.FC<ExpiredRoomProps> = ({
  message = "This share has expired",
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center shadow-lg my-12">
      <div className="w-14 h-14 rounded-2xl bg-slate-950 text-slate-400 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
        <Clock className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold text-white">
          {message}
        </h2>
        <p className="text-sm text-slate-400">
          Files are automatically deleted after 7 days.
        </p>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        SimpleShare automatically purges all temporary files to maintain security and privacy. Once expired, sharing codes cannot be recovered.
      </p>

      <div className="pt-2">
        <Link href="/">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Create a New Share
          </Button>
        </Link>
      </div>
    </div>
  );
};
