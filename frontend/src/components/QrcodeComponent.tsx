// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, QrCode, Sparkles, X } from "lucide-react";

interface QrCodeScannerProps {
  onScan?: (qrString: string) => Promise<void> | void;
  isScanning?: boolean;
  onClose?: () => void;
  verificationStep?: "scanning" | "verifying" | "success";
}

export function QrCodeScanner({
  onScan,
  isScanning: externalIsScanning,
  onClose,
  verificationStep: externalVerificationStep
}: QrCodeScannerProps) {
  const [internalIsScanning, setInternalIsScanning] = useState(false);
  const [internalVerificationStep, setInternalVerificationStep] = useState<"scanning" | "verifying" | "success">("scanning");
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  const isScanning = externalIsScanning !== undefined ? externalIsScanning : internalIsScanning;
  const verificationStep = externalVerificationStep || internalVerificationStep;

  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Force the internal video stream to stay inside the modal
  useEffect(() => {
    if (isScanning && readerContainerRef.current) {
      const videoElement = readerContainerRef.current.querySelector("video");
      if (videoElement) {
        videoElement.style.position = "relative";
        videoElement.style.zIndex = "1";
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.objectFit = "cover";
      }
    }
  }, [isScanning]);

  const startScanner = async () => {
    if (isScanning) return;

    setInternalIsScanning(true);
    setInternalVerificationStep("scanning");

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
          // QR detected - start verification
          setInternalVerificationStep("verifying");

          try {
            // Stop scanning immediately
            await html5QrCode.stop();
            setInternalIsScanning(false);

            // Call the onScan callback with the decoded text
            if (onScan) {
              await onScan(decodedText);
            }
          } catch (error) {
            console.error("QR processing failed:", error);
            setInternalIsScanning(false);
            setInternalVerificationStep("scanning");
          }
        },
        () => {},
      );
    } catch (error) {
      console.error("Camera startup failed:", error);
      setInternalIsScanning(false);
      setInternalVerificationStep("scanning");
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setInternalIsScanning(false);
    setInternalVerificationStep("scanning");
    if (onClose) {
      onClose();
    }
  };

  // If external control is being used, start scanning when isScanning becomes true
  useEffect(() => {
    if (externalIsScanning === true && !qrScannerRef.current?.isScanning) {
      startScanner();
    }
  }, [externalIsScanning]);

  return (
    <>
      <button
        type="button"
        onClick={startScanner}
        disabled={isScanning}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#5b1e2e] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <QrCode className="h-5 w-5" />
        <span>Scan QR Code to Confirm Attendance</span>
        <Sparkles className="h-4 w-4" />
      </button>

      {/* Scanner Modal - Overlays everything */}
      {isScanning && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#220b13]/90 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeScanner();
            }
          }}
        >
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
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
              <div className="relative isolate aspect-square w-full min-h-[320px] overflow-hidden rounded-xl bg-slate-950">
                <div
                  id="qr-reader"
                  ref={readerContainerRef}
                  className="absolute inset-0 flex h-full w-full items-center justify-center z-10"
                />
                {verificationStep === "verifying" && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
                    <div className="text-center text-white">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                      <p className="mt-3 text-sm font-medium">
                        Verifying attendee...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                {verificationStep === "scanning"
                  ? "Hold steady until the code is detected"
                  : "Processing..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
