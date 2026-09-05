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
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorText("Please enter a valid 6-character code");
      return;
    }
    setErrorText(null);
    router.push(`/room/${cleanCode}`);
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
          maxLength={6}
          placeholder="Enter 6-character code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (errorText) setErrorText(null);
          }}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono uppercase tracking-widest font-bold text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
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
