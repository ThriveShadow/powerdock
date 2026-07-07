"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, QrCode } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          throw new Error("No camera found");
        }

        // Prefer back camera
        const backCam =
          cameras.find((c) =>
            c.label.toLowerCase().includes("back")
          ) || cameras[cameras.length - 1];

        await scanner.start(
          backCam.id,
          {
            fps: 12,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (!runningRef.current) return;

            runningRef.current = false;
            await scanner.stop();

            router.replace(
              `/scan/result?data=${encodeURIComponent(decodedText)}`
            );
          }
        );

        runningRef.current = true;
      } catch (err) {
        console.error("Camera start error:", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && runningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      runningRef.current = false;
    };
  }, [router]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]">
      {/* Header */}
      <div className="flex items-center justify-center py-6 relative">
        <button
          onClick={() => router.back()}
          className="absolute left-6 p-2 rounded-full hover:bg-[#FFD54F]/50 transition"
        >
          <ArrowLeft className="text-[#FF6F00]" />
        </button>

        <div className="flex items-center gap-2">
          <QrCode className="text-[#FF6F00]" />
          <h1 className="font-bold text-[#FF6F00]">Scan QR</h1>
        </div>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="bg-white rounded-xl shadow p-4 w-full max-w-md">
          <div
            id="qr-reader"
            className="w-full aspect-square rounded-lg overflow-hidden"
          />
        </div>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Align the QR code within the frame
        </p>
      </div>
    </div>
  );
}
