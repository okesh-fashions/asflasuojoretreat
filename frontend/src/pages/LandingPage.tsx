import { useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";

type AttendeeFormState = {
  fullname: string;
  phone: string;
  faculty: string;
  department: string;
  level: string;
  is_visitor: boolean;
};

type AttendeeRecord = {
  id: string;
  fullname: string;
  phone: string;
  faculty?: string | null;
  department?: string | null;
  level?: string | null;
  qrcode: string;
  is_visitor: boolean;
  is_confirmed: boolean;
  registered_on?: string | null;
};

const retreatInfo = {
  name: "Anglican Students' Fellowship LASU OJO Retreat Registration",
  motto: "Arise...Shine! (Isaiah 60 vs 1)",
  slogan: "ASF...Restoring the Ancient Landmark",
  school: "LASU Ojo Campus",
  date: "Friday, 13th - Sunday, 15th November 2026",
  venue: "Bishop James Johnson Memorial Anglican Church (BJJMAC), PPL, Okoko.",
};

const initialForm: AttendeeFormState = {
  fullname: "",
  phone: "",
  faculty: "",
  department: "",
  level: "",
  is_visitor: false,
};

const facultyOptions = [
  "Art",
  "Education",
  "Engineering",
  "Law",
  "Management Sciences",
  "Science",
  "Social Sciences",
  "Communication and Media Studies",
  "Agriculture",
  "Other",
];

const levelOptions = ["100", "200", "300", "400", "500", "Graduate", "Staff"];

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

  const updateField = (
    field: keyof AttendeeFormState,
    value: string | boolean,
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullname: form.fullname.trim(),
        phone: form.phone.replace(/\D/g, ""),
        faculty: form.is_visitor ? undefined : form.faculty.trim(),
        department: form.is_visitor ? undefined : form.department.trim(),
        level: form.is_visitor ? undefined : form.level.trim(),
        is_visitor: form.is_visitor,
      };

      const { data } = await api.post("/attendees/register", payload);
      const attendee = data.attendee as AttendeeRecord;

      setSavedAttendee(attendee);

      const qrUrl = await QRCode.toDataURL(attendee.qrcode, {
        width: 1024,
        margin: 2,
        color: {
          dark: "#2b0d18",
          light: "#ffffff",
        },
      });

      setQrDataUrl(qrUrl);
      toast.success("Registration successful! Your QR code is ready.");
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

  return (
    <div className="min-h-screen bg-[#f7f1ef] text-[#2a0d18]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-[#5b1e2e]/15 bg-white/75 px-4 py-3 shadow-[0_18px_40px_-30px_rgba(91,30,46,0.5)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/asflogo.png"
              alt="ASF LASU OJO Logo"
              className="h-11 w-11 rounded-full border border-[#5b1e2e]/20 object-cover bg-white"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/70">
                ASF LASU OJO
              </p>
              <p className="text-sm font-bold text-[#2a0d18]">
                Retreat Registration
              </p>
            </div>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724]"
          >
            Admin portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="space-y-8">
          <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5 py-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/15 bg-[#fffaf9] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5b1e2e] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                1st Semester's Retreat
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-[-0.06em] text-[#220b13] sm:text-5xl">
                  {retreatInfo.name}
                </h1>
                <p className="max-w-xl text-base leading-7 text-[#5b1e2e]/80 sm:text-lg">
                  A simple, secure registration experience for fellows and
                  guests preparing for a spiritually refreshing retreat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[#3e1d2b]">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-white/80 px-3 py-2 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-[#5b1e2e]" />
                  {retreatInfo.motto}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-white/80 px-3 py-2 shadow-sm">
                  <Sparkles className="h-4 w-4 text-[#5b1e2e]" />
                  {retreatInfo.slogan}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#5b1e2e]/10 bg-white/80 p-4 shadow-[0_18px_40px_-30px_rgba(91,30,46,0.5)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                    Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2a0d18]">
                    {retreatInfo.date}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#5b1e2e]/10 bg-white/80 p-4 shadow-[0_18px_40px_-30px_rgba(91,30,46,0.5)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                    Venue
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2a0d18]">
                    {retreatInfo.venue}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#5b1e2e]/10 bg-white/85 p-4 shadow-[0_40px_80px_-40px_rgba(91,30,46,0.45)] backdrop-blur-xl sm:p-6">
              {!savedAttendee ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/70">
                        Registration
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-[#220b13]">
                        Sign in quickly
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
                      className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
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
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b1e2e]/60" />
                      <input
                        value={form.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="080XXXXXXXX"
                        className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] py-3 pl-10 pr-4 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-[#5b1e2e]/10 bg-[#fffaf9] px-3 py-3 text-sm text-[#2c111d]">
                    <input
                      type="checkbox"
                      checked={form.is_visitor}
                      onChange={(event) =>
                        updateField("is_visitor", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-[#5b1e2e]/20 text-[#5b1e2e] focus:ring-[#5b1e2e]"
                    />
                    I am a visitor. Skip faculty, department, and level.
                  </label>

                  {!form.is_visitor && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
                          Faculty
                        </label>
                        <select
                          value={form.faculty}
                          onChange={(event) =>
                            updateField("faculty", event.target.value)
                          }
                          className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
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
                          className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
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
                          className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
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
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#471421] disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isSubmitting ? "Registering..." : "Register now"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f7eef1] p-3 text-[#2b0d18]">
                    <div className="rounded-full bg-[#5b1e2e]/10 p-2 text-[#5b1e2e]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/70">
                        Registration complete
                      </p>
                      <p className="text-sm font-bold">Welcome aboard</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#5b1e2e]/10 bg-[#fffaf9] p-4 text-center">
                    <div className="mx-auto mb-4 flex w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#5b1e2e]/10">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Registration QR Code"
                          className="h-48 w-48 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-48 w-48 animate-pulse rounded-xl bg-[#f3e6e8]" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/70">
                      Unique ID
                    </p>
                    <p className="mt-2 break-all text-base font-bold text-[#2a0d18]">
                      {savedAttendee?.qrcode}
                    </p>
                    <button
                      type="button"
                      onClick={downloadQr}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/15 bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#431724]"
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#5b1e2e]/10 bg-[#f9f1f3] p-4 text-sm leading-6 text-[#3d1d2b]">
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
                    className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm font-semibold text-[#2a0d18] transition hover:bg-[#f8ecee]"
                  >
                    Register another person
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-[#5b1e2e]/10 bg-white/75 py-6 text-center text-sm text-[#4f2a36] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 sm:flex-row sm:gap-4">
          <span className="font-semibold text-[#2a0d18]">
            Anglican Students’ Fellowship LASU OJO
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{retreatInfo.school}</span>
          <span className="hidden sm:inline">•</span>
          <span>{retreatInfo.motto}</span>
        </div>
      </footer>

      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-full border border-[#5b1e2e]/10 bg-white/90 px-3 py-2 shadow-[0_18px_42px_-30px_rgba(91,30,46,0.55)] backdrop-blur-lg">
        <img
          src="/okesh_tech.jpg"
          alt="Okesh Tech"
          className="h-9 w-9 rounded-full border border-[#5b1e2e]/10 object-cover"
        />
        <div className="leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
            Developed by
          </p>
          <p className="text-xs font-bold text-[#2a0d18]">Okechukwu Goodluck</p>
        </div>
      </div>
    </div>
  );
}
