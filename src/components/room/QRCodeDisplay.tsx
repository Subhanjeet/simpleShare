import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "../ui/Button";

interface QRCodeDisplayProps {
  url: string;
  roomCode: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url, roomCode }) => {
  const qrRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `SimpleShare_QR_${roomCode}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div
        ref={qrRef}
        className="p-3 bg-white rounded-2xl border border-slate-700 shadow-lg inline-block"
      >
        <QRCodeSVG
          value={url}
          size={160}
          bgColor={"#ffffff"}
          fgColor={"#0f172a"}
          level={"H"}
          includeMargin={false}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownloadQR}
        leftIcon={<Download className="w-3.5 h-3.5" />}
      >
        Download QR
      </Button>
    </div>
  );
};
