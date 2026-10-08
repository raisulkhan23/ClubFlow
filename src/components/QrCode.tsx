import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function QrCode({
  value,
  size = 180,
  className,
  light = "#ffffff",
  dark = "#0c1210",
}: {
  value: string;
  size?: number;
  className?: string;
  light?: string;
  dark?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { light, dark },
    }).catch(() => setError(true));
  }, [value, size, light, dark]);

  if (error) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground", className)}
        style={{ width: size, height: size }}
      >
        QR unavailable
      </div>
    );
  }

  return (
    <div className={cn("inline-flex rounded-xl bg-white p-2.5", className)}>
      <canvas ref={canvasRef} aria-label={`QR code for ${value}`} />
    </div>
  );
}
