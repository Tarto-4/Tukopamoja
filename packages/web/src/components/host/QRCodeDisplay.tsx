// ─────────────────────────────────────────────────────────────
// QR Code Display — generates QR from a URL value
// ─────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  size = 200,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  }, [value, size]);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
      <canvas ref={canvasRef} />
    </div>
  );
}
