// src/pages/LandingPage.tsx

import { useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Phone,
  Mail, // Added missing Mail import
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  Upload,
  X,
  Check,
  Copy,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";

type AttendeeFormState = {
  fullname: string;
  phone: string;
  email: string;
  faculty: string;
  department: string;
  level: string;
  is_visitor: boolean;
  pay_now: boolean; // true = Yes, false = No
  receipt?: File | null; // receipt image if pay_now
};

type AttendeeRecord = {
  id: string;
  fullname: string;
  phone: string;
  email: string;
  faculty?: string | null;
  department?: string | null;
  level?: string | null;
  qrcode: string;
  is_visitor: boolean;
  is_confirmed: boolean;
  payment_method?: "bank_transfer" | "cash" | null;
  payment_status?: "pending_verification" | "unpaid" | "verified" | null;
  amount_due?: number | null;
  receipt_url?: string | null;
  registered_on?: string | null;
};

const retreatInfo = {
  name: "Anglican Students' Fellowship LASU OJO Retreat Registration",
  motto: "Arise...Shine! (Isaiah 60 vs 1)",
  hail: "ASF Arise...Shine!",
  slogan: "ASF...Restoring the Ancient Landmark!",
  school: "LASU Ojo Campus",
  date: "Friday, 13th - Sunday, 15th November 2026",
  venue: "Living Faith Anglican Church, Agboroko, LASU-Iba Road, Lagos.",
};

const initialForm: AttendeeFormState = {
  fullname: "",
  phone: "",
  email: "",
  faculty: "",
  department: "",
  level: "",
  is_visitor: false,
  pay_now: false,
  receipt: null,
};

const facultyOptions = [
  "Arts",
  "Science",
  "Law",
  "Communication and Media Studies",
  "Education",
  "Computing and Information Technology",
  "Transport",
  "Management Sciences",
  "Social Sciences",
  "Engineering",
  "Other",
];

const levelOptions = ["100", "200", "300", "400", "500", "600"];

const ACCOUNT_DETAILS = {
  bank: "Palmpay",
  accountName: "Adepoju Oluwatofunmi",
  accountNumber: "8022819419",
};

const FEES = {
  memberOnline: 800,
  memberCash: 1000,
  invitee: 1000,
};

export function LandingPage() {
  const [form, setForm] = useState<AttendeeFormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AttendeeFormState, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAttendee, setSavedAttendee] = useState<AttendeeRecord | null>(
    null,
  );
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string>("");

  const updateField = (
    field: keyof AttendeeFormState,
    value: string | boolean | File | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AttendeeFormState, string>> = {};

    if (!form.fullname.trim()) {
      nextErrors.fullname = "Please enter your full name.";
    }

    const phone = form.phone.replace(/\D/g, "");
    if (phone.length !== 11) {
      nextErrors.phone = "Phone number must be exactly 11 digits.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.is_visitor) {
      if (!form.faculty.trim()) {
        nextErrors.faculty = "Faculty is required for members.";
      }
      if (!form.department.trim()) {
        nextErrors.department = "Department is required for members.";
      }
      if (!form.level.trim()) {
        nextErrors.level = "Level is required for members.";
      }
    }

    if (form.pay_now || form.is_visitor) {
      if (!form.receipt) {
        nextErrors.receipt = "Please upload your payment receipt.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const generateBrandedQR = async (attendee: AttendeeRecord) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = 600;
    const height = 800;
    const qrSize = 400;
    const sidePadding = (width - qrSize) / 2;

    canvas.width = width;
    canvas.height = height;

    if (!ctx) return null;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#5b1e2e");
    gradient.addColorStop(1, "#7c2a3a");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    ctx.fillStyle = "#5b1e2e";
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("ASF LASU OJO RETREAT", width / 2, 40);

    ctx.fillStyle = "#2a0d18";
    ctx.font = "26px Arial, sans-serif";
    ctx.fillText(`ATT ID: ${attendee.qrcode}`, width / 2, 75);

    const qrCodeUrl = await QRCode.toDataURL(attendee.qrcode, {
      width: qrSize,
      margin: 0,
      color: {
        dark: "#2b0d18",
        light: "#ffffff",
      },
    });

    const qrImage = new Image();

    return new Promise<string>((resolve, reject) => {
      qrImage.onload = () => {
        const x = sidePadding;
        const y = 180;
        ctx.drawImage(qrImage, x, y, qrSize, qrSize);

        ctx.fillStyle = "#5b1e2e";
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          "ASF Arise...Shine! ASF...Restoring the Ancient Landmark!",
          width / 2,
          height - 45,
        );

        resolve(canvas.toDataURL("image/png"));
      };
      qrImage.onerror = reject;
      qrImage.src = qrCodeUrl;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine payment method
      const paymentMethod =
        form.is_visitor || form.pay_now ? "bank_transfer" : "cash";

      const formData = new FormData();
      formData.append("fullname", form.fullname.trim());
      formData.append("phone", form.phone.replace(/\D/g, ""));
      formData.append("email", form.email.trim());
      formData.append("is_visitor", String(form.is_visitor));
      formData.append("payment_method", paymentMethod);
      formData.append(
        "amount_due",
        String(
          form.is_visitor
            ? FEES.invitee
            : form.pay_now
              ? FEES.memberOnline
              : FEES.memberCash,
        ),
      );

      if (!form.is_visitor) {
        formData.append("faculty", form.faculty.trim());
        formData.append("department", form.department.trim());
        formData.append("level", form.level.trim());
      }

      if (form.receipt) {
        formData.append("receipt", form.receipt);
      }

      const { data } = await api.post("/attendees/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const attendee = data.attendee as AttendeeRecord;

      setSavedAttendee(attendee);

      const brandedQrUrl = await generateBrandedQR(attendee);
      if (brandedQrUrl) {
        setQrDataUrl(brandedQrUrl);
      } else {
        const qrUrl = await QRCode.toDataURL(attendee.qrcode, {
          width: 1024,
          margin: 2,
          color: {
            dark: "#2b0d18",
            light: "#ffffff",
          },
        });
        setQrDataUrl(qrUrl);
      }

      toast.success(
        "Registration successful! Your QR code is ready and sent to your email.",
      );
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSavedAttendee(null);
    setQrDataUrl("");
    setForm(initialForm);
    setErrors({});
    setReceiptPreview("");
    setCopiedField("");
  };

  const downloadQr = () => {
    if (!qrDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `ASF-${savedAttendee?.qrcode || "attendee"}-qr.png`;
    link.click();
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS / older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      toast.success("Copied!");
      setTimeout(() => setCopiedField(""), 2500);
    } catch (err) {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const whatsappUrl = `https://wa.me/2348144152544?text=I%20saw%20the%20site%20you%20built%20for%20ASF%20LASU%20OJO%20Retreat%20Registration...`;

  return (
    <div className="min-h-screen bg-[#f6f0ee]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-[#5b1e2e]/5 blur-2xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-purple-500/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <img
              src="/asflogo.png"
              alt="ASF LASU OJO Logo"
              className="h-10 w-10 rounded-full border border-white/50 object-cover bg-white shadow-sm sm:h-12 sm:w-12"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/60">
                ASF LASU OJO
              </p>
              <p className="text-sm font-bold text-[#2a0d18] sm:text-base">
                Retreat Registration
              </p>
            </div>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-95"
          >
            Admin
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="space-y-8">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[#5b1e2e] shadow-sm backdrop-blur-[8px] sm:text-sm">
                <Sparkles className="h-4 w-4" />
                1st Semester's Retreat
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-[#220b13] sm:text-4xl md:text-5xl lg:text-6xl">
                  {retreatInfo.name}
                </h1>
                <p className="text-base leading-7 text-[#5b1e2e]/80 sm:text-lg sm:leading-8">
                  A simple, secure registration experience for fellows and
                  guests preparing for a spiritually refreshing retreat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[#3e1d2b] sm:text-base">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-2 shadow-sm backdrop-blur-[8px]">
                  <ShieldCheck className="h-4 w-4 text-[#5b1e2e]" />
                  <span className="text-xs sm:text-sm">
                    {retreatInfo.motto}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-2 shadow-sm backdrop-blur-[8px]">
                  <Sparkles className="h-4 w-4 text-[#5b1e2e]" />
                  <span className="text-xs sm:text-sm">
                    {retreatInfo.slogan}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/60 p-4 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60 sm:text-sm">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2a0d18] sm:mt-2 sm:text-base">
                    {retreatInfo.date}
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-4 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60 sm:text-sm">
                    Venue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#2a0d18] sm:mt-2 sm:text-base">
                    {retreatInfo.venue}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
              {!savedAttendee ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60 sm:text-sm">
                        Registration
                      </p>
                      <h2 className="text-xl font-bold text-[#220b13] sm:text-2xl">
                        Join the train of Light Bearers!
                      </h2>
                    </div>
                    <div className="rounded-full bg-[#5b1e2e]/5 p-2 text-[#5b1e2e]">
                      <UserRound className="h-5 w-5" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                      Full name
                    </label>
                    <input
                      value={form.fullname}
                      onChange={(event) =>
                        updateField("fullname", event.target.value)
                      }
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-5 sm:py-3.5"
                    />
                    {errors.fullname && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.fullname}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b1e2e]/60" />
                      <input
                        value={form.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="080XXXXXXXX"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 py-3 pl-11 pr-4 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:py-3.5"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b1e2e]/60" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 py-3 pl-11 pr-4 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:py-3.5"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-[#5b1e2e]/10 bg-white/60 px-4 py-3 text-sm text-[#2c111d] transition hover:bg-white/80 sm:rounded-2xl sm:px-4 sm:py-3.5">
                    <input
                      type="checkbox"
                      checked={form.is_visitor}
                      onChange={(event) =>
                        updateField("is_visitor", event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-[#5b1e2e]/20 text-[#5b1e2e] focus:ring-[#5b1e2e]"
                    />
                    <span>
                      I am an invitee. Skip faculty, department, and level.
                    </span>
                  </label>

                  {/* Payment Section */}
                  <div className="space-y-3 rounded-xl border border-[#5b1e2e]/10 bg-white/60 p-4 sm:rounded-2xl sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-sm">
                          Commitment Fee
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#220b13] sm:text-base">
                          {form.is_visitor
                            ? "Invitees pay ₦1,000 online only"
                            : "Do you wish to make payment now?"}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#5b1e2e]/5 p-2 text-[#5b1e2e]">
                        <Wallet className="h-5 w-5" />
                      </div>
                    </div>

                    {!form.is_visitor ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label
                          className={`cursor-pointer rounded-xl border p-3 transition ${
                            form.pay_now
                              ? "border-[#5b1e2e] bg-[#5b1e2e]/5 shadow-sm"
                              : "border-[#5b1e2e]/10 bg-white/80 hover:border-[#5b1e2e]/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pay_now"
                            checked={form.pay_now === true}
                            onChange={() => updateField("pay_now", true)}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                form.pay_now
                                  ? "border-[#5b1e2e]"
                                  : "border-[#5b1e2e]/30"
                              }`}
                            >
                              {form.pay_now && (
                                <div className="h-2 w-2 rounded-full bg-[#5b1e2e]" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#2a0d18]">
                                Yes — Pay ₦{FEES.memberOnline} now
                              </p>
                              <p className="mt-0.5 text-xs text-[#5b1e2e]/70">
                                Save ₦{FEES.memberCash - FEES.memberOnline} ·
                                Bank transfer
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`cursor-pointer rounded-xl border p-3 transition ${
                            !form.pay_now
                              ? "border-[#5b1e2e] bg-[#5b1e2e]/5 shadow-sm"
                              : "border-[#5b1e2e]/10 bg-white/80 hover:border-[#5b1e2e]/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pay_now"
                            checked={form.pay_now === false}
                            onChange={() => updateField("pay_now", false)}
                            className="sr-only"
                          />
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                !form.pay_now
                                  ? "border-[#5b1e2e]"
                                  : "border-[#5b1e2e]/30"
                              }`}
                            >
                              {!form.pay_now && (
                                <div className="h-2 w-2 rounded-full bg-[#5b1e2e]" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#2a0d18]">
                                No — Pay ₦{FEES.memberCash} at venue
                              </p>
                              <p className="mt-0.5 text-xs text-[#5b1e2e]/70">
                                Cash payment on arrival
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#5b1e2e] bg-[#5b1e2e]/5 p-3">
                        <p className="text-sm font-bold text-[#2a0d18]">
                          Pay ₦{FEES.invitee} online
                        </p>
                        <p className="mt-0.5 text-xs text-[#5b1e2e]/70">
                          Invitees must complete bank transfer before the
                          retreat.
                        </p>
                      </div>
                    )}

                    {/* Show account details if paying now (or if invitee) */}
                    {(form.pay_now || form.is_visitor) && (
                      <div className="space-y-3 rounded-xl border border-[#5b1e2e]/15 bg-[#fdf7f8] p-3 sm:p-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                            Transfer to
                          </p>
                          <div className="mt-2 space-y-1.5 text-sm">
                            <div className="flex justify-between gap-2">
                              <span className="text-[#5b1e2e]/70">Bank</span>
                              <span className="font-bold text-[#2a0d18]">
                                {ACCOUNT_DETAILS.bank}
                              </span>
                            </div>

                            <div className="flex justify-between gap-2">
                              <span className="text-[#5b1e2e]/70">
                                Account Name
                              </span>
                              <span className="font-bold text-right text-[#2a0d18]">
                                {ACCOUNT_DETAILS.accountName}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[#5b1e2e]/70">
                                Account Number
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#2a0d18]">
                                  {ACCOUNT_DETAILS.accountNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      ACCOUNT_DETAILS.accountNumber,
                                      "accountNumber",
                                    )
                                  }
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#5b1e2e]/5 text-[#5b1e2e] transition hover:bg-[#5b1e2e]/10 active:scale-95"
                                  aria-label="Copy account number"
                                  title="Copy account number"
                                >
                                  {copiedField === "accountNumber" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-[#5b1e2e]/10 pt-1.5">
                              <span className="text-[#5b1e2e]/70">Amount</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#2a0d18]">
                                  ₦
                                  {form.is_visitor
                                    ? FEES.invitee
                                    : FEES.memberOnline}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      String(
                                        form.is_visitor
                                          ? FEES.invitee
                                          : FEES.memberOnline,
                                      ),
                                      "amount",
                                    )
                                  }
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#5b1e2e]/5 text-[#5b1e2e] transition hover:bg-[#5b1e2e]/10 active:scale-95"
                                  aria-label="Copy amount"
                                  title="Copy amount"
                                >
                                  {copiedField === "amount" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-[#3a1825] sm:text-sm">
                            Upload payment receipt
                          </label>
                          <label
                            htmlFor="receipt-upload"
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#5b1e2e]/25 bg-white/60 px-4 py-4 text-xs font-medium text-[#5b1e2e] transition hover:border-[#5b1e2e]/50 hover:bg-white/80 sm:text-sm"
                          >
                            <Upload className="h-4 w-4" />
                            {form.receipt
                              ? "Change receipt"
                              : "Tap to upload receipt"}
                          </label>
                          <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              updateField("receipt", file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  setReceiptPreview(
                                    ev.target?.result as string,
                                  );
                                reader.readAsDataURL(file);
                              } else {
                                setReceiptPreview("");
                              }
                            }}
                            className="hidden"
                          />
                          {receiptPreview && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#5b1e2e]/10 bg-white/80 p-2">
                              <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="h-12 w-12 rounded object-cover ring-1 ring-[#5b1e2e]/10"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-[#2a0d18]">
                                  {form.receipt?.name}
                                </p>
                                <p className="text-[10px] text-[#5b1e2e]/60">
                                  {form.receipt &&
                                    (form.receipt.size / 1024).toFixed(0)}{" "}
                                  KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  updateField("receipt", null);
                                  setReceiptPreview("");
                                }}
                                className="rounded-full p-1 text-[#5b1e2e]/60 hover:bg-[#5b1e2e]/10"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {errors.receipt && (
                            <p className="mt-1 text-xs text-[#b42318]">
                              {errors.receipt}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!form.is_visitor && (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                          Faculty
                        </label>
                        <select
                          value={form.faculty}
                          onChange={(event) =>
                            updateField("faculty", event.target.value)
                          }
                          className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-5 sm:py-3.5"
                        >
                          <option value="">Select faculty</option>
                          {facultyOptions.map((faculty) => (
                            <option key={faculty} value={faculty}>
                              {faculty}
                            </option>
                          ))}
                        </select>
                        {errors.faculty && (
                          <p className="mt-1 text-xs text-[#b42318]">
                            {errors.faculty}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                            Department
                          </label>
                          <input
                            value={form.department}
                            onChange={(event) =>
                              updateField("department", event.target.value)
                            }
                            placeholder="Department"
                            className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-5 sm:py-3.5"
                          />
                          {errors.department && (
                            <p className="mt-1 text-xs text-[#b42318]">
                              {errors.department}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                            Level
                          </label>
                          <select
                            value={form.level}
                            onChange={(event) =>
                              updateField("level", event.target.value)
                            }
                            className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-5 sm:py-3.5"
                          >
                            <option value="">Select level</option>
                            {levelOptions.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                          {errors.level && (
                            <p className="mt-1 text-xs text-[#b42318]">
                              {errors.level}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:rounded-2xl sm:py-4"
                  >
                    {isSubmitting ? "Registering..." : "Register now"}
                    {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3 text-[#2b0d18] backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                    <div className="rounded-full bg-[#5b1e2e]/5 p-2 text-[#5b1e2e]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                        Registration complete
                      </p>
                      <p className="text-base font-bold sm:text-lg">
                        Welcome aboard
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#5b1e2e]/10 bg-white/60 p-4 text-center backdrop-blur-[8px] sm:rounded-2xl sm:p-5">
                    <div className="mx-auto mb-4 flex w-36 items-center justify-center rounded-xl bg-white/60 p-3 shadow-sm ring-1 ring-[#5b1e2e]/10 sm:w-44 sm:p-4">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Registration QR Code"
                          className="h-36 w-36 rounded-lg object-cover sm:h-44 sm:w-44"
                        />
                      ) : (
                        <div className="h-36 w-36 animate-pulse rounded-lg bg-white/30 sm:h-44 sm:w-44" />
                      )}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60 sm:text-sm">
                      ATTENDEE ID
                    </p>
                    <p className="mt-2 break-all text-base font-bold text-[#2a0d18] sm:text-lg">
                      {savedAttendee?.qrcode}
                    </p>
                    <button
                      type="button"
                      onClick={downloadQr}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#431724] active:scale-95 sm:px-5 sm:py-2.5"
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </button>
                  </div>

                  <div className="rounded-xl bg-white/60 p-4 text-sm leading-6 text-[#3d1d2b] backdrop-blur-[8px] sm:rounded-2xl sm:p-5 sm:text-base sm:leading-7">
                    <p className="font-semibold text-[#2a0d18]">
                      You have registered for the {retreatInfo.name}.
                    </p>
                    <p className="mt-1">Date: {retreatInfo.date}</p>
                    <p>Venue: {retreatInfo.venue}</p>
                    <p>School: {retreatInfo.school}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/60 px-4 py-3 text-sm font-semibold text-[#2a0d18] transition hover:bg-white/80 active:scale-[0.98] sm:rounded-2xl sm:py-3.5 sm:text-base"
                  >
                    Register another person
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-white/20 bg-white/60 py-4 text-center text-sm text-[#4f2a36] backdrop-blur-[12px] sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 sm:flex-row sm:gap-4">
          <span className="font-semibold text-[#2a0d18]">
            Anglican Students’ Fellowship LASU OJO
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{retreatInfo.school}</span>
          <span className="hidden sm:inline">•</span>
          <span>{retreatInfo.hail}</span>
          <span>{retreatInfo.slogan}</span>
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-3 right-3 z-40 flex items-center gap-3 rounded-full bg-white/70 px-3 py-2 shadow-lg backdrop-blur-[12px] transition hover:bg-white/90 hover:shadow-xl active:scale-95 sm:bottom-4 sm:right-4 sm:gap-3 sm:px-4 sm:py-2.5"
      >
        <img
          src="/okesh_tech.jpg"
          alt="Okesh Tech"
          className="h-7 w-7 rounded-full border border-white/50 object-cover shadow-sm sm:h-10 sm:w-10"
        />
        <div className="leading-tight">
          <p className="text-[7px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60 sm:text-[9px]">
            Developed by
          </p>
          <p className="text-xs font-bold text-[#2a0d18] sm:text-sm">
            Goodluck Okechukwu
          </p>
        </div>
      </a>
    </div>
  );
}
