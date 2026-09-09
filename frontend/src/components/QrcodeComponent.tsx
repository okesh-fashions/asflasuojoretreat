// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, QrCode, Sparkles, X } from "lucide-react";

interface AttendeeData {
  fullname: string;
  phone: string;
  is_visitor: boolean;
  is_confirmed: boolean;
}

interface QrCodeScannerProps {
  onScan?: (
    qrString: string,
  ) => Promise<AttendeeData | null> | AttendeeData | null;
}

export function QrCodeScanner({ onScan }: QrCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attendeeData, setAttendeeData] = useState<AttendeeData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setIsVerifying(false);
    setScanError(null);
    setAttendeeData(null);
    setShowSuccessModal(false);

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;

      const container = document.getElementById("qr-reader");
      const containerWidth = container?.clientWidth || 300;
      const qrboxSize = Math.min(containerWidth - 40, 280);

      let isProcessing = false; // Prevent duplicate processing

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
          // Prevent duplicate processing of the same QR code
          if (isProcessing) return;
          isProcessing = true;

          // QR detected - start verification
          setIsVerifying(true);
          setScanError(null);

          try {
            // Stop scanning immediately
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
            setIsScanning(false);

            // Call the onScan callback with the decoded text
            if (onScan) {
              const result = await onScan(decodedText);

              if (result) {
                setAttendeeData(result);
                setShowSuccessModal(true);

                // Auto-close success modal after 3 seconds and allow rescanning
                setTimeout(() => {
                  setShowSuccessModal(false);
                  setAttendeeData(null);
                  isProcessing = false;
                }, 3000);
              } else {
                setScanError(
                  "Failed to verify attendee. Check the QR code and try again.",
                );
                isProcessing = false;
              }
            }
          } catch (error: any) {
            console.error("QR processing failed:", error);
            setScanError(
              error.message || "Failed to verify attendee. Please try again.",
            );
            setIsScanning(false);
            isProcessing = false;
          } finally {
            setIsVerifying(false);
          }
        },
        () => {},
      );
    } catch (error) {
      console.error("Camera startup failed:", error);
      setScanError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
      setIsVerifying(false);
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setIsVerifying(false);
    setShowSuccessModal(false);
    setAttendeeData(null);
    setScanError(null);
  };

  const closeSuccessModal = async () => {
    setShowSuccessModal(false);
    setAttendeeData(null);
    setScanError(null);
    // Restart scanner for next scan
    await startScanner();
  };

  return (
    <>
      <button
        type="button"
        onClick={startScanner}
        disabled={isScanning || isVerifying}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#5b1e2e] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <QrCode className="h-5 w-5" />
            <span>Scan QR Code to Confirm Attendance</span>
            <Sparkles className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Scanner Modal */}
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
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950">
                <div
                  id="qr-reader"
                  className="absolute inset-0 flex items-center justify-center"
                />
                {isVerifying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="text-center text-white">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                      <p className="mt-3 text-sm font-medium">
                        Verifying attendee...
                      </p>
                    </div>
                  </div>
                )}
                {scanError && !isVerifying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center text-white px-4 py-6 bg-red-900/40 rounded-lg">
                      <div className="text-red-300 text-2xl mb-2">⚠️</div>
                      <p className="text-sm font-semibold text-red-100 mb-3">
                        {scanError}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={closeScanner}
                          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-700 active:scale-95"
                        >
                          Close Scanner
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScanError(null);
                            startScanner();
                          }}
                          className="mt-3 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/30 active:scale-95"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs font-medium text-slate-500">
                {isVerifying
                  ? "Verifying..."
                  : "Hold steady until the code is detected"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && attendeeData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#220b13]/90 p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-white shadow-2xl animate-in zoom-in duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center p-8 text-center">
              {/* Animated Checkmark */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                <div className="absolute h-20 w-20 animate-pulse rounded-full bg-green-400/20" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white animate-in zoom-in duration-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[#220b13] mb-1">
                {attendeeData.fullname}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {attendeeData.phone}
              </p>

              <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
                  {attendeeData.is_visitor ? "Visitor" : "Member"}
                </span>
                <span className="h-1 w-1 rounded-full bg-green-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-700">
                  ✓ Confirmed
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Closing in 3 seconds...
              </p>

              <button
                type="button"
                onClick={closeSuccessModal}
                className="rounded-xl bg-[#5b1e2e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#431724] active:scale-95"
              >
                Scan Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
