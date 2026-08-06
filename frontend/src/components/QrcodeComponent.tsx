// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, QrCode, Sparkles, X } from "lucide-react";

interface QrCodeScannerProps {
  onScan?: (qrString: string) => Promise<void> | void;
}

export function QrCodeScanner({ onScan }: QrCodeScannerProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (isScanning || isSubmitting) {
      return;
    }

    setIsScanning(true);
    setStatusMessage("Opening camera…");

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;

      const container = document.getElementById("qr-reader");
      const containerWidth = container?.clientWidth || 300;
      const qrboxSize = Math.min(containerWidth - 40, 280);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: qrboxSize,
            height: qrboxSize,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          setIsSubmitting(true);
          setStatusMessage("QR detected. Confirming attendee…");
          try {
            await html5QrCode.stop();
            setIsScanning(false);
            if (onScan) {
              await onScan(decodedText);
            }
            setStatusMessage("✅ Attendance confirmed successfully.");
          } catch (error) {
            console.error("QR confirm failed:", error);
            setStatusMessage(
              "❌ Something went wrong while confirming this attendee.",
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        () => {},
      );

      setStatusMessage("Align the QR code within the frame.");
    } catch (error) {
      console.error("Camera startup failed:", error);
      setStatusMessage("❌ Camera access was blocked or unavailable.");
      setIsScanning(false);
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setStatusMessage("");
  };

  return (
    <>
      <button
        type="button"
        onClick={startScanner}
        disabled={isScanning || isSubmitting}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#5b1e2e] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <QrCode className="h-5 w-5" />
        <span>Scan QR Code to Confirm Attendance</span>
        <Sparkles className="h-4 w-4" />
      </button>

      {statusMessage && !isScanning && (
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-medium text-[#4a2a35]">
          {statusMessage}
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#220b13]/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#5b1e2e] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">Scan Attendee QR</h3>
                <p className="text-xs text-white/75">Point camera at QR code</p>
              </div>
              <button
                type="button"
                onClick={closeScanner}
                className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950">
                <div
                  id="qr-reader"
                  className="absolute inset-0 flex items-center justify-center"
                />
              </div>
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                Hold steady until the code is detected
              </p>
              {isSubmitting && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-[#5b1e2e]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
