import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateRoomCode } from "@/lib/utils/format";
import { Check, AlertCircle, Loader2, Sparkles, Pencil } from "lucide-react";

export interface CodeOptionResult {
  codeType: "generated" | "custom";
  customCode: string;
  isValid: boolean;
}

interface CodeOptionSelectorProps {
  onChange: (result: CodeOptionResult) => void;
  isDisabled?: boolean;
}

export const CodeOptionSelector: React.FC<CodeOptionSelectorProps> = ({
  onChange,
  isDisabled = false,
}) => {
  const [codeType, setCodeType] = useState<"generated" | "custom">("generated");
  const [customInput, setCustomInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: false });

  // Stable random code preview for option 1
  const generatedPreview = useMemo(() => generateRoomCode(), []);

  // Debounced live availability check against /api/rooms/check-code
  const checkCodeAvailability = useCallback(async (codeToTest: string) => {
    const trimmed = codeToTest.trim().toLowerCase();
    if (!trimmed) {
      setAvailabilityStatus({ checked: false, available: false });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch(`/api/rooms/check-code?code=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.data) {
        setAvailabilityStatus({
          checked: true,
          available: json.data.available,
          message: json.data.available ? "Code available" : json.data.reason || "Code already in use",
        });
      } else {
        setAvailabilityStatus({
          checked: true,
          available: false,
          message: json.error || "Failed to check code availability",
        });
      }
    } catch {
      setAvailabilityStatus({
        checked: true,
        available: false,
        message: "Failed to check code availability",
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Debounce user input
  useEffect(() => {
    if (codeType !== "custom") return;

    const normalized = customInput.trim().toLowerCase();
    if (!normalized) {
      setAvailabilityStatus({ checked: false, available: false });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(() => {
      checkCodeAvailability(normalized);
    }, 300);

    return () => clearTimeout(timer);
  }, [customInput, codeType, checkCodeAvailability]);

  // Propagate state to parent whenever codeType, customInput, or availability changes
  useEffect(() => {
    if (codeType === "generated") {
      onChange({
        codeType: "generated",
        customCode: "",
        isValid: true,
      });
    } else {
      const isInputValid =
        availabilityStatus.checked && availabilityStatus.available && !isChecking;
      onChange({
        codeType: "custom",
        customCode: customInput.trim().toLowerCase(),
        isValid: isInputValid,
      });
    }
  }, [codeType, customInput, availabilityStatus, isChecking, onChange]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Choose your share code</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Option 1: Generated Code */}
        <label
          onClick={() => !isDisabled && setCodeType("generated")}
          className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
            codeType === "generated"
              ? "bg-slate-950 border-blue-500/80 ring-1 ring-blue-500/50 shadow-md"
              : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
          } ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}
        >
          <div className="flex items-start space-x-3">
            <div className="mt-0.5">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  codeType === "generated"
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {codeType === "generated" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-200 block">
                Generate a code
              </span>
              <span className="inline-block text-xs font-mono font-bold tracking-widest text-blue-400 bg-blue-950/60 border border-blue-800/60 rounded px-2 py-0.5">
                {generatedPreview}
              </span>
            </div>
          </div>
        </label>

        {/* Option 2: Custom Code */}
        <label
          onClick={() => !isDisabled && setCodeType("custom")}
          className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-150 space-y-3 ${
            codeType === "custom"
              ? "bg-slate-950 border-blue-500/80 ring-1 ring-blue-500/50 shadow-md"
              : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
          } ${isDisabled ? "opacity-40 pointer-events-none" : ""}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              codeType === "custom"
                ? "border-blue-500 bg-blue-500"
                : "border-slate-600 bg-slate-900"
            }`}>
              {codeType === "custom" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">
                Create my own code
              </span>
            </div>
          </div>

          {codeType === "custom" && (
            <div className="pl-7 space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                maxLength={20}
                placeholder="my-project-26"
                value={customInput}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setCustomInput(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-sm font-mono text-blue-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Live Availability Feedback */}
              <div className="min-h-[20px] flex items-center space-x-1.5 text-xs font-medium">
                {isChecking ? (
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span>Checking...</span>
                  </span>
                ) : availabilityStatus.checked ? (
                  availabilityStatus.available ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{availabilityStatus.message || "Code available"}</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{availabilityStatus.message || "Code unavailable"}</span>
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 text-[11px]">
                    Use 6–20 letters, numbers or hyphens
                  </span>
                )}
              </div>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};
