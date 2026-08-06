// import { useEffect, useRef, useState } from "react";
// import { Html5Qrcode } from "html5-qrcode";
// import { CheckCircle2, Loader2, QrCode, Sparkles, X } from "lucide-react";

// interface QrCodeScannerProps {
//   label: string;
//   onScan?: (qrString: string) => Promise<void> | void;
// }

// export function QrCodeScanner({ label, onScan }: QrCodeScannerProps) {
//   const [statusMessage, setStatusMessage] = useState("Ready to scan a QR code.");
//   const [isScanning, setIsScanning] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const qrScannerRef = useRef<Html5Qrcode | null>(null);

//   useEffect(() => {
//     return () => {
//       if (qrScannerRef.current?.isScanning) {
//         qrScannerRef.current.stop().catch(console.error);
//       }
//     };
//   }, []);

//   const startScanner = async () => {
//     if (isScanning || isSubmitting) {
//       return;
//     }

//     setIsScanning(true);
//     setStatusMessage("Opening camera…");

//     await new Promise((resolve) => setTimeout(resolve, 150));

//     try {
//       const html5QrCode = new Html5Qrcode("qr-reader");
//       qrScannerRef.current = html5QrCode;

//       const container = document.getElementById("qr-reader");
//       const containerWidth = container?.clientWidth || 300;
//       const qrboxSize = Math.min(containerWidth - 40, 280);

//       await html5QrCode.start(
//         { facingMode: "environment" },
//         {
//           fps: 10,
//           qrbox: {
//             width: qrboxSize,
//             height: qrboxSize,
//           },
//           aspectRatio: 1,
//         },
//         async (decodedText) => {
//           setIsSubmitting(true);
//           setStatusMessage("QR detected. Confirming attendee…");
//           try {
//             await html5QrCode.stop();
//             setIsScanning(false);
//             if (onScan) {
//               await onScan(decodedText);
//             }
//             setStatusMessage("Attendance confirmed successfully.");
//           } catch (error) {
//             console.error("QR confirm failed:", error);
//             setStatusMessage("Something went wrong while confirming this attendee.");
//           } finally {
//             setIsSubmitting(false);
//           }
//         },
//         () => {},
//       );

//       setStatusMessage("Align the QR code within the frame.");
//     } catch (error) {
//       console.error("Camera startup failed:", error);
//       setStatusMessage("Camera access was blocked or unavailable.");
//       setIsScanning(false);
//     }
//   };

//   const closeScanner = async () => {
//     if (qrScannerRef.current?.isScanning) {
//       await qrScannerRef.current.stop();
//     }
//     setIsScanning(false);
//     setStatusMessage("Scanner closed.");
//   };

//   return (
//     <>
//       <div className="w-full max-w-md">
//         <button
//           type="button"
//           onClick={startScanner}
//           disabled={isScanning || isSubmitting}
//           className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#5b1e2e] via-[#7c2a3a] to-[#b44b61] p-[1.5px] shadow-lg shadow-[#5b1e2e]/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
//         >
//           <div className="flex items-center gap-4 rounded-[14px] bg-white px-5 py-4 sm:px-6 sm:py-5">
//             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5b1e2e]/10 text-[#5b1e2e]">
//               {isSubmitting ? (
//                 <Loader2 className="h-6 w-6 animate-spin" />
//               ) : (
//                 <QrCode className="h-6 w-6" />
//               )}
//             </div>

//             <div className="min-w-0 flex-1 text-left">
//               <p className="truncate text-base font-bold text-[#2a0d18] sm:text-lg">{label}</p>
//               <p className="mt-0.5 flex items-center gap-1 text-xs text-[#5b1e2e]/70 sm:text-sm">
//                 <Sparkles className="h-3.5 w-3.5 text-[#5b1e2e]" />
//                 Fast QR scan at the venue
//               </p>
//             </div>
//           </div>
//         </button>
//       </div>

//       {isScanning && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#220b13]/80 p-4 backdrop-blur-sm">
//           <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
//             <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#5b1e2e] to-[#7c2a3a] px-5 py-4 text-white">
//               <div>
//                 <h3 className="text-base font-bold">Scan attendee QR</h3>
//                 <p className="text-xs text-white/75">Point the camera at the attendee QR code</p>
//               </div>
//               <button
//                 type="button"
//                 onClick={closeScanner}
//                 aria-label="Close scanner"
//                 className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             </div>

//             <div className="p-4">
//               <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#5b1e2e]/20 bg-slate-950">
//                 <div id="qr-reader" className="absolute inset-0 flex items-center justify-center" />
//               </div>
//               <p className="mt-3 text-center text-xs font-medium text-slate-500">
//                 Hold steady until the code is detected
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {statusMessage && !isScanning && (
//         <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#4a2a35]">
//           {statusMessage.includes("success") ? <CheckCircle2 className="h-4 w-4 text-[#166534]" /> : null}
//           {statusMessage}
//         </p>
//       )}
//     </>
//   );
// }

// src/components/QrcodeComponent.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, Loader2, QrCode, Sparkles, X } from "lucide-react";

interface QrCodeScannerProps {
  label: string;
  onScan?: (qrString: string) => Promise<void> | void;
}

export function QrCodeScanner({ onScan }: QrCodeScannerProps) {
  const [statusMessage, setStatusMessage] = useState(
    "Ready to scan a QR code.",
  );
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
            setStatusMessage("Attendance confirmed successfully.");
          } catch (error) {
            console.error("QR confirm failed:", error);
            setStatusMessage(
              "Something went wrong while confirming this attendee.",
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
      setStatusMessage("Camera access was blocked or unavailable.");
      setIsScanning(false);
    }
  };

  const closeScanner = async () => {
    if (qrScannerRef.current?.isScanning) {
      await qrScannerRef.current.stop();
    }
    setIsScanning(false);
    setStatusMessage("Scanner closed.");
  };

  return (
    <>
      <button
        type="button"
        onClick={startScanner}
        disabled={isScanning || isSubmitting}
        className="group inline-flex items-center gap-2.5 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <QrCode className="h-4 w-4" />
        Scan QR
        <Sparkles className="h-3.5 w-3.5" />
      </button>

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

      {statusMessage && !isScanning && (
        <p className="mt-2 flex items-center justify-center gap-2 text-center text-sm font-medium text-[#4a2a35]">
          {statusMessage.includes("success") && (
            <CheckCircle2 className="h-4 w-4 text-[#166534]" />
          )}
          {statusMessage}
        </p>
      )}
    </>
  );
}
