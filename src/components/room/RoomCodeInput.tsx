import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { ArrowRight, KeyRound } from "lucide-react";

export const RoomCodeInput: React.FC = () => {
  const [code, setCode] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode || cleanCode.length < 6 || cleanCode.length > 20) {
      setErrorText("Please enter a valid share code (6–20 characters)");
      return;
    }
    setErrorText(null);
    router.push(`/room/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg"
    >
      <div className="flex items-center space-x-2 text-white font-semibold text-base">
        <KeyRound className="w-4 h-4 text-blue-400" />
        <span>Already have a share?</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          maxLength={20}
          placeholder="Enter share code (e.g. X7K92P or my-code)"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""));
            if (errorText) setErrorText(null);
          }}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-base sm:text-lg font-mono tracking-wider font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal placeholder:text-xs sm:placeholder:text-sm placeholder:font-normal"
        />
        <Button
          type="submit"
          variant="secondary"
          size="md"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Join Share
        </Button>
      </div>

      {errorText && (
        <p className="text-xs text-rose-400 font-medium text-center">{errorText}</p>
      )}
    </form>
  );
};
