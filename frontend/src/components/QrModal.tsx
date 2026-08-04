import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

interface QRLocation {
  id?: string;
  qr_string?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: QRLocation | null;
  onDownload?: (dataUrl: string, filename: string) => void;
}

export default function QRModal({
  isOpen,
  onClose,
  location,
  onDownload,
}: QRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !location) {
      return;
    }

    setIsGenerating(true);
    const qrValue = location.qr_string || `qr_${location.id || "attendee"}`;

    QRCode.toDataURL(qrValue, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0B2545",
        light: "#FFFFFF",
      },
    })
      .then((url: string) => {
        setQrDataUrl(url);
        setIsGenerating(false);
      })
      .catch((err: Error) => {
        console.error("Error generating QR code:", err);
        toast.error("Failed to generate QR code");
        setIsGenerating(false);
      });
  }, [isOpen, location]);

  if (!isOpen || !location) {
    return null;
  }

  const handleDownload = () => {
    if (qrDataUrl) {
      const filename = `${location.location || "qr-code"}.png`;
      onDownload?.(qrDataUrl, filename);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-[#0B2545]">QR Code</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold text-[#0B2545]">
              {location.location || "Registration QR"}
            </h3>
            {typeof location.latitude === "number" &&
              typeof location.longitude === "number" && (
                <p className="mt-1 text-sm text-slate-500">
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </p>
              )}
          </div>

          <div className="mb-6 flex justify-center">
            {isGenerating ? (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${location.location || "registration"}`}
                className="h-64 w-64 rounded-lg border border-slate-200 object-contain"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-slate-200 text-slate-400">
                Failed to generate QR code
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl || isGenerating}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2545] text-white transition hover:bg-[#12345c] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-xl bg-white text-[#0B2545] ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
