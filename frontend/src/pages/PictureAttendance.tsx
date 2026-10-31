// src/pages/PictureAttendance.tsx
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Upload, User, X } from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// Frame geometry (based on 736 x 920 flyer)
// ============================================

const FLYER_WIDTH = 736;
const FLYER_HEIGHT = 920;

// White inner frame area — where the photo goes
const FRAME_X = 98;
const FRAME_Y = 266;
const FRAME_W = 253;
const FRAME_H = 373;

// Name text placement — above "will be attending"
const NAME_CENTER_X = 570;
const NAME_BASELINE_Y = 405;
const NAME_MAX_WIDTH = 300;

// Name typography
const NAME_FONT_FAMILY = '"Inter", "Helvetica Neue", Arial, sans-serif';
const NAME_FONT_WEIGHT = 800;
const NAME_FONT_SIZE = 42;
// const NAME_LINE_HEIGHT = 46; // vertical space between lines

export function PictureAttendance() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [flyerLoaded, setFlyerLoaded] = useState(false);
  const flyerImgRef = useRef<HTMLImageElement | null>(null);

  // Load the flyer image once on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/flyer.png";
    img.onload = () => {
      flyerImgRef.current = img;
      setFlyerLoaded(true);
    };
    img.onerror = () => {
      toast.error("Could not load the flyer image. Check /flyer.png exists.");
    };
  }, []);

  // Redraw whenever name, photo, or flyer changes
  useEffect(() => {
    if (!flyerLoaded) return;
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, photoPreview, flyerLoaded]);

  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    const flyer = flyerImgRef.current;
    if (!canvas || !flyer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = FLYER_WIDTH;
    canvas.height = FLYER_HEIGHT;

    // 1. Flyer background
    ctx.clearRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
    ctx.drawImage(flyer, 0, 0, FLYER_WIDTH, FLYER_HEIGHT);

    // 2. Photo inside the frame
    if (photoPreview) {
      await drawPhotoInsideFrame(ctx, photoPreview);
    }

    // 3. Name above "will be attending"
    if (name.trim()) {
      drawName(ctx, name.trim());
    }
  };

  // Cover-fit the photo inside the frame
  const drawPhotoInsideFrame = (
    ctx: CanvasRenderingContext2D,
    src: string,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const frameRatio = FRAME_W / FRAME_H;

        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (imgRatio > frameRatio) {
          sw = img.height * frameRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / frameRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.save();
        roundRectPath(ctx, FRAME_X, FRAME_Y, FRAME_W, FRAME_H, 6);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, FRAME_X, FRAME_Y, FRAME_W, FRAME_H);
        ctx.restore();

        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  };

  // ============================================
  // Name rendering with word wrapping
  // ============================================
  const drawName = (ctx: CanvasRenderingContext2D, text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // Start with the preferred font size
    let fontSize = NAME_FONT_SIZE;
    let lines: string[] = [];
    let fits = false;

    // Try the current font size; if any single word is still too wide,
    // shrink the font by 2px and try again. Repeat until every word fits.
    while (!fits && fontSize >= 16) {
      ctx.font = `${NAME_FONT_WEIGHT} ${fontSize}px ${NAME_FONT_FAMILY}`;

      // Check every individual word fits within NAME_MAX_WIDTH
      const allWordsFit = words.every(
        (w) => ctx.measureText(w).width <= NAME_MAX_WIDTH,
      );

      if (!allWordsFit) {
        fontSize -= 2;
        continue;
      }

      // All words fit individually — now greedily pack them into lines
      const packed: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth <= NAME_MAX_WIDTH) {
          currentLine = testLine;
        } else {
          if (currentLine) packed.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) packed.push(currentLine);

      lines = packed;
      fits = true;
    }

    // Safety fallback if even at 16px something didn't fit (very unlikely)
    if (!fits) {
      ctx.font = `${NAME_FONT_WEIGHT} 16px ${NAME_FONT_FAMILY}`;
      lines = [words[0]];
    }

    // Re-apply the final font size for drawing
    ctx.font = `${NAME_FONT_WEIGHT} ${fontSize}px ${NAME_FONT_FAMILY}`;

    // Scale line height with the font size so spacing stays proportional
    const lineHeight = Math.round(fontSize * 1.1);

    // Vertically center the block of lines around NAME_BASELINE_Y
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = NAME_BASELINE_Y - totalHeight / 2;

    // Draw each line with shadow + thin outline
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;

      // Shadow pass
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${NAME_FONT_WEIGHT} ${fontSize}px ${NAME_FONT_FAMILY}`;
      ctx.fillText(line, NAME_CENTER_X, y);
      ctx.restore();

      // Outline pass
      ctx.save();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.font = `${NAME_FONT_WEIGHT} ${fontSize}px ${NAME_FONT_FAMILY}`;
      ctx.strokeText(line, NAME_CENTER_X, y);
      ctx.restore();
    });
  };

  const roundRectPath = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large. Please use an image under 8MB.");
      return;
    }

    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!name.trim() && !photo) {
      toast.error("Add your name and photo first.");
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to generate the image.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ASF-Retreat-${name.trim() || "me"}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Flyer downloaded!");
    }, "image/png");
  };

  return (
    <div className="min-h-screen bg-[#f6f0ee] px-4 py-6 text-[#2a0d18] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b1e2e] sm:gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="rounded-full bg-white/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e] backdrop-blur-[8px]">
            I'll Be Attending
          </div>
        </div>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[#5b1e2e] shadow-sm backdrop-blur-[8px]">
            {/* <Sparkles className="h-3.5 w-3.5" /> */}
            Personalize your flyer
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#220b13] sm:text-4xl md:text-5xl">
            Create your "I Will Be Attending" flyer
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[#5b1e2e]/80 sm:text-lg">
            Upload your photo and type your name. Your flyer will be ready to
            download and share instantly.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Live Preview */}
          <div className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
              Live Preview
            </p>
            <div className="flex justify-center">
              {!flyerLoaded ? (
                <div className="flex aspect-[736/920] w-full max-w-md animate-pulse items-center justify-center rounded-xl bg-[#5b1e2e]/5 text-sm text-[#5b1e2e]/60">
                  Loading flyer…
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="w-full max-w-md rounded-xl shadow-lg ring-1 ring-black/5"
                  style={{ aspectRatio: `${FLYER_WIDTH} / ${FLYER_HEIGHT}` }}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Name field */}
            <div className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
                Your Name
              </p>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b1e2e]/60" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Mr. David Okonkwo"
                  className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 py-3 pl-11 pr-4 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                />
              </div>
              <p className="mt-2 text-[11px] text-[#5b1e2e]/60">
                {name.length}/60 characters · long names will wrap onto new
                lines
              </p>
            </div>

            {/* Photo upload */}
            <div className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
                Your Photo
              </p>

              {!photoPreview ? (
                <label
                  htmlFor="photo-upload"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#5b1e2e]/25 bg-white/60 px-4 py-10 text-center text-sm font-medium text-[#5b1e2e] transition hover:border-[#5b1e2e]/50 hover:bg-white/80"
                >
                  <Upload className="h-6 w-6" />
                  <span className="font-semibold">Tap to upload a photo</span>
                  <span className="text-[11px] text-[#5b1e2e]/60">
                    JPG, PNG or WEBP · max 8MB
                  </span>
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-[#5b1e2e]/10 bg-white/80 p-3">
                  <img
                    src={photoPreview}
                    alt="Your upload"
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-[#5b1e2e]/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#2a0d18]">
                      {photo?.name}
                    </p>
                    <p className="text-[11px] text-[#5b1e2e]/60">
                      {photo && (photo.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="rounded-full p-2 text-[#5b1e2e]/60 transition hover:bg-[#5b1e2e]/10"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!flyerLoaded}
              className="inline-flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-5 w-5" />
              Download My Flyer
            </button>

            <p className="text-center text-[11px] text-[#5b1e2e]/60">
              Tip: Use a clear, well-lit photo facing forward for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
