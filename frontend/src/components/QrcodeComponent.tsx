// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, Loader2, QrCode, Sparkles, X, User } from "lucide-react";
import api from "../utils/axiosConfig";

interface QrCodeScannerProps {
  onScan?: (qrString: string) => Promise<void> | void;
}

interface AttendeeInfo {
  fullname: string;
  phone: string;
  faculty?: string | null;
  department?: string | null;
  is_confirmed: boolean;
}

export function QrCodeScanner({ onScan }: QrCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null);
  const [verificationStep, setVerificationStep] = useState<
    "scanning" | "verifying" | "success"
  >("scanning");
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const readerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current?.isScanning) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // CRITICAL FIX: Force the internal video stream to stay inside the modal
  useEffect(() => {
    if (isScanning && readerContainerRef.current) {
      // Force the inner video element to have high z-index and correct position
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
    if (isScanning || isSubmitting) return;

    setIsScanning(true);
    setScannerStatus("Opening camera…");
    setVerificationStep("scanning");

    // Allow Modal to render before starting camera
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrScannerRef.current = html5QrCode;

      // Get dimensions based on the actual parent container
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
          setVerificationStep("verifying");
          setScannerStatus("Verifying attendee...");
          setIsSubmitting(true);

          try {
            await html5QrCode.stop();
            setIsScanning(false);

            const response = await api.get(`/attendees/by-qr/${decodedText}`);
            const data = response.data;

            if (data.attendee) {
              const attendee = data.attendee;

              if (attendee.is_confirmed) {
                setScannerStatus("⚠️ This attendee has already been confirmed.");
                setIsSubmitting(false);
                setVerificationStep("scanning");
                return;
              }

              setAttendeeInfo({
                fullname: attendee.fullname,
                phone: attendee.phone,
                faculty: attendee.faculty,
                department: attendee.department,
                is_confirmed: attendee.is_confirmed,
              });

              setVerificationStep("success");
              setShowSuccessModal(true);
              setScannerStatus("");

              if (onScan) {
                await onScan(decodedText);
              }
            } else {
              setScannerStatus("❌ Attendee not found. Please check the QR code.");
              setVerificationStep("scanning");
            }
          } catch (error: any) {
            console.error("QR verification failed:", error);
            if (error.response?.status === 404) {
              setScannerStatus("❌ Attendee not found. Please check the QR code.");
            } else if (error.response?.data?.message) {
              setScannerStatus(`❌ ${error.response.data.message}`);
            } else {
              setScannerStatus("❌ Something went wrong. Please try again.");
            }
            setVerificationStep("scanning");
          } finally {
            setIsSubmitting(false);
          }
        },
        () => {},
      );

      setScannerStatus("Align the QR code within the frame.");
    } catch (error) {
      console.error("Camera startup failed:", error);
      setScannerStatus("❌ Camera access was blocked or unavailable.");
      setIsScanning(false);
      setVerificationStep("scanning");
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setScannerStatus("");
    setVerificationStep("scanning");
    setShowSuccessModal(false);
    setAttendeeInfo(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setAttendeeInfo(null);
    setVerificationStep("scanning");
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

      {scannerStatus && !isScanning && !showSuccessModal && (
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-medium text-[#4a2a35]">
          {scannerStatus}
        </div>
      )}

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
              {/* 
                 MAJOR FIX: 
                 1. min-h-[320px] prevents collapse.
                 2. Added ref to monitor the video element directly.
                 3. Added `isolate` CSS class to force a new stacking context.
              */}
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

      {/* Success Modal - Overlays everything */}
      {showSuccessModal && attendeeInfo && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#220b13]/90 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSuccessClose();
            }
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Success Animation */}
            <div className="relative bg-gradient-to-br from-[#5b1e2e] to-[#7c2a3a] px-6 py-8 text-center text-white">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg_width=\'60\'_height=\'60\'_viewBox=\'0_0_60_60\'_xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg_fill=\'none\'_fill-rule=\'evenodd\'%3E%3Cg_fill=\'%23ffffff\'_fill-opacity=\'0.05\'%3E%3Cpath_d=\'M36_34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6_34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6_4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

              <div className="relative">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 animate-in fade-in zoom-in duration-500">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white animate-in fade-in zoom-in duration-700">
                    <CheckCircle2 className="h-12 w-12 text-[#5b1e2e] animate-in fade-in zoom-in duration-1000" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold animate-in fade-in slide-in-from-top-4 duration-500">
                  ✓ Verified!
                </h3>
                <p className="mt-1 text-sm text-white/80 animate-in fade-in slide-in-from-top-4 duration-700">
                  Attendance confirmed successfully
                </p>
              </div>
            </div>

            {/* Attendee Info */}
            <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-3 rounded-xl bg-[#f8ecee] p-4">
                <div className="rounded-full bg-[#5b1e2e]/10 p-2.5 text-[#5b1e2e]">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4d2a35]">Attendee</p>
                  <h4 className="text-xl font-bold text-[#220b13]">
                    {attendeeInfo.fullname}
                  </h4>
                  <div className="mt-1.5 space-y-0.5 text-sm text-[#4d2a35]">
                    <p>📱 {attendeeInfo.phone}</p>
                    {attendeeInfo.faculty && <p>🎓 {attendeeInfo.faculty}</p>}
                    {attendeeInfo.department && (
                      <p>📚 {attendeeInfo.department}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSuccessClose}
                className="mt-4 w-full rounded-xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white transition hover:bg-[#431724] active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}