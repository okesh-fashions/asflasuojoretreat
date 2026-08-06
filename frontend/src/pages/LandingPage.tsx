// // src/pages/LandingPage.tsx
// import { useState } from "react";
// import QRCode from "qrcode";
// import toast from "react-hot-toast";
// import {
//   ArrowRight,
//   CheckCircle2,
//   Download,
//   Phone,
//   ShieldCheck,
//   Sparkles,
//   UserRound,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import api from "../utils/axiosConfig";

// type AttendeeFormState = {
//   fullname: string;
//   phone: string;
//   faculty: string;
//   department: string;
//   level: string;
//   is_visitor: boolean;
// };

// type AttendeeRecord = {
//   id: string;
//   fullname: string;
//   phone: string;
//   faculty?: string | null;
//   department?: string | null;
//   level?: string | null;
//   qrcode: string;
//   is_visitor: boolean;
//   is_confirmed: boolean;
//   registered_on?: string | null;
// };

// const retreatInfo = {
//   name: "Anglican Students' Fellowship LASU OJO Retreat Registration",
//   motto: "Arise...Shine! (Isaiah 60 vs 1)",
//   hail: "ASF Arise...Shine!",
//   slogan: "ASF...Restoring the Ancient Landmark!",
//   school: "LASU Ojo Campus",
//   date: "Friday, 13th - Sunday, 15th November 2026",
//   venue: "Bishop James Johnson Memorial Anglican Church (BJJMAC), PPL, Okoko.",
// };

// const initialForm: AttendeeFormState = {
//   fullname: "",
//   phone: "",
//   faculty: "",
//   department: "",
//   level: "",
//   is_visitor: false,
// };

// const facultyOptions = [
//   "Art",
//   "Education",
//   "Engineering",
//   "Law",
//   "Management Sciences",
//   "Science",
//   "Social Sciences",
//   "Communication and Media Studies",
//   "Agriculture",
//   "Other",
// ];

// const levelOptions = ["100", "200", "300", "400", "500", "Graduate", "Staff"];

// export function LandingPage() {
//   const [form, setForm] = useState<AttendeeFormState>(initialForm);
//   const [errors, setErrors] = useState<
//     Partial<Record<keyof AttendeeFormState, string>>
//   >({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [savedAttendee, setSavedAttendee] = useState<AttendeeRecord | null>(
//     null,
//   );
//   const [qrDataUrl, setQrDataUrl] = useState("");

//   const updateField = (
//     field: keyof AttendeeFormState,
//     value: string | boolean,
//   ) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     setErrors((prev) => ({ ...prev, [field]: "" }));
//   };

//   const validateForm = () => {
//     const nextErrors: Partial<Record<keyof AttendeeFormState, string>> = {};

//     if (!form.fullname.trim()) {
//       nextErrors.fullname = "Please enter your full name.";
//     }

//     const phone = form.phone.replace(/\D/g, "");
//     if (phone.length !== 11) {
//       nextErrors.phone = "Phone number must be exactly 11 digits.";
//     }

//     if (!form.is_visitor) {
//       if (!form.faculty.trim()) {
//         nextErrors.faculty = "Faculty is required for members.";
//       }
//       if (!form.department.trim()) {
//         nextErrors.department = "Department is required for members.";
//       }
//       if (!form.level.trim()) {
//         nextErrors.level = "Level is required for members.";
//       }
//     }

//     setErrors(nextErrors);
//     return Object.keys(nextErrors).length === 0;
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const payload = {
//         fullname: form.fullname.trim(),
//         phone: form.phone.replace(/\D/g, ""),
//         faculty: form.is_visitor ? undefined : form.faculty.trim(),
//         department: form.is_visitor ? undefined : form.department.trim(),
//         level: form.is_visitor ? undefined : form.level.trim(),
//         is_visitor: form.is_visitor,
//       };

//       const { data } = await api.post("/attendees/register", payload);
//       const attendee = data.attendee as AttendeeRecord;

//       setSavedAttendee(attendee);

//       const qrUrl = await QRCode.toDataURL(attendee.qrcode, {
//         width: 1024,
//         margin: 2,
//         color: {
//           dark: "#2b0d18",
//           light: "#ffffff",
//         },
//       });

//       setQrDataUrl(qrUrl);
//       toast.success("Registration successful! Your QR code is ready.");
//     } catch (error: unknown) {
//       const message =
//         (error as { response?: { data?: { message?: string } } })?.response
//           ?.data?.message || "Registration failed. Please try again.";
//       toast.error(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleReset = () => {
//     setSavedAttendee(null);
//     setQrDataUrl("");
//     setForm(initialForm);
//     setErrors({});
//   };

//   const downloadQr = () => {
//     if (!qrDataUrl) {
//       return;
//     }

//     const link = document.createElement("a");
//     link.href = qrDataUrl;
//     link.download = `ASF-${savedAttendee?.qrcode || "attendee"}-qr.png`;
//     link.click();
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f7f1ef] via-[#f0e8e6] to-[#e8ddda]">
//       {/* Prism Background Effects */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         {/* Prism 1 - Top Left */}
//         <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[#5b1e2e]/10 via-purple-500/5 to-cyan-500/5 blur-3xl animate-pulse" />

//         {/* Prism 2 - Top Right */}
//         <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-bl from-pink-500/10 via-[#5b1e2e]/5 to-blue-500/5 blur-3xl animate-pulse delay-1000" />

//         {/* Prism 3 - Bottom Left */}
//         <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-500/5 via-[#5b1e2e]/10 to-purple-500/5 blur-3xl animate-pulse delay-700" />

//         {/* Prism 4 - Bottom Right */}
//         <div className="absolute -bottom-20 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-[#5b1e2e]/5 via-pink-500/5 to-amber-500/5 blur-3xl animate-pulse delay-500" />

//         {/* Prism 5 - Center */}
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-[#5b1e2e]/5 via-purple-500/5 to-cyan-500/5 blur-3xl animate-pulse delay-300" />

//         {/* Prism Light Rays */}
//         <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#5b1e2e]/5 to-transparent opacity-30" />

//         {/* Glass Prism Refractions */}
//         <div className="absolute top-1/4 left-1/4 h-32 w-32 rotate-45 bg-gradient-to-br from-white/20 via-transparent to-white/5 blur-2xl" />
//         <div className="absolute bottom-1/4 right-1/4 h-40 w-40 -rotate-12 bg-gradient-to-tl from-white/15 via-transparent to-white/5 blur-2xl" />
//       </div>

//       {/* Main Content with Glassmorphism */}
//       <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
//         <header className="relative mb-10 flex items-center justify-between rounded-2xl border border-white/20 bg-white/30 px-4 py-3 shadow-[0_8px_32px_rgba(91,30,46,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[20px] backdrop-saturate-[180%] sm:px-6">
//           <div className="flex items-center gap-3">
//             <div className="relative">
//               <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#5b1e2e]/20 via-purple-500/20 to-cyan-500/20 blur-xl" />
//               <img
//                 src="/asflogo.png"
//                 alt="ASF LASU OJO Logo"
//                 className="relative h-11 w-11 rounded-full border border-white/30 object-cover bg-white/50 shadow-[0_8px_32px_rgba(91,30,46,0.15)]"
//               />
//             </div>
//             <div>
//               <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/70">
//                 ASF LASU OJO
//               </p>
//               <p className="text-sm font-bold text-[#2a0d18]">
//                 Retreat Registration
//               </p>
//             </div>
//           </div>

//           <Link
//             to="/admin"
//             className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(91,30,46,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:shadow-[0_12px_40px_rgba(91,30,46,0.35)] active:scale-95"
//           >
//             <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
//             Admin portal
//             <ArrowRight className="h-4 w-4" />
//           </Link>
//         </header>

//         <main className="space-y-8">
//           <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
//             <div className="space-y-5 py-2">
//               <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#5b1e2e] shadow-[0_4px_16px_rgba(91,30,46,0.08)] backdrop-blur-sm">
//                 <Sparkles className="h-3.5 w-3.5" />
//                 1st Semester's Retreat
//               </div>

//               <div className="space-y-4">
//                 <h1 className="max-w-xl text-4xl font-black leading-tight tracking-[-0.06em] text-[#220b13] sm:text-5xl bg-gradient-to-r from-[#220b13] via-[#5b1e2e] to-[#220b13] bg-clip-text text-transparent">
//                   {retreatInfo.name}
//                 </h1>
//                 <p className="max-w-xl text-base leading-7 text-[#5b1e2e]/80 sm:text-lg backdrop-blur-sm">
//                   A simple, secure registration experience for fellows and
//                   guests preparing for a spiritually refreshing retreat.
//                 </p>
//               </div>

//               <div className="flex flex-wrap items-center gap-3 text-sm text-[#3e1d2b]">
//                 <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-3 py-2 shadow-[0_4px_16px_rgba(91,30,46,0.06)] backdrop-blur-sm">
//                   <ShieldCheck className="h-4 w-4 text-[#5b1e2e]" />
//                   {retreatInfo.motto}
//                 </div>
//                 <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-3 py-2 shadow-[0_4px_16px_rgba(91,30,46,0.06)] backdrop-blur-sm">
//                   <Sparkles className="h-4 w-4 text-[#5b1e2e]" />
//                   {retreatInfo.slogan}
//                 </div>
//               </div>

//               <div className="grid gap-3 sm:grid-cols-2">
//                 <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/40 p-4 shadow-[0_8px_32px_rgba(91,30,46,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md">
//                   <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-gradient-to-br from-[#5b1e2e]/10 to-purple-500/10 blur-2xl" />
//                   <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
//                     Date
//                   </p>
//                   <p className="relative mt-2 text-sm font-semibold text-[#2a0d18]">
//                     {retreatInfo.date}
//                   </p>
//                 </div>
//                 <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/40 p-4 shadow-[0_8px_32px_rgba(91,30,46,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md">
//                   <div className="absolute -bottom-10 -left-10 h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-500/10 to-[#5b1e2e]/10 blur-2xl" />
//                   <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
//                     Venue
//                   </p>
//                   <p className="relative mt-2 text-sm font-semibold text-[#2a0d18]">
//                     {retreatInfo.venue}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="relative rounded-[28px] border border-white/30 bg-white/30 p-4 shadow-[0_8px_32px_rgba(91,30,46,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[20px] backdrop-saturate-[180%] sm:p-6">
//               {/* Glass highlight */}
//               <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
//               <div className="absolute -top-px left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm" />

//               {!savedAttendee ? (
//                 <form onSubmit={handleSubmit} className="relative space-y-4">
//                   <div className="mb-2 flex items-center justify-between">
//                     <div>
//                       <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/70">
//                         Registration
//                       </p>
//                       <h2 className="mt-1 text-2xl font-bold text-[#220b13]">
//                         Sign in quickly
//                       </h2>
//                     </div>
//                     <div className="rounded-full bg-[#5b1e2e]/10 p-2 text-[#5b1e2e] shadow-[0_4px_16px_rgba(91,30,46,0.1)] backdrop-blur-sm">
//                       <UserRound className="h-5 w-5" />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
//                       Full name
//                     </label>
//                     <input
//                       value={form.fullname}
//                       onChange={(event) =>
//                         updateField("fullname", event.target.value)
//                       }
//                       placeholder="Enter your full name"
//                       className="w-full rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-[#290d1a] outline-none transition-all placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/50 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                     />
//                     {errors.fullname && (
//                       <p className="mt-1 text-xs text-[#b42318]">
//                         {errors.fullname}
//                       </p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
//                       Phone number
//                     </label>
//                     <div className="relative">
//                       <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b1e2e]/60" />
//                       <input
//                         value={form.phone}
//                         onChange={(event) =>
//                           updateField("phone", event.target.value)
//                         }
//                         inputMode="numeric"
//                         maxLength={11}
//                         placeholder="080XXXXXXXX"
//                         className="w-full rounded-2xl border border-white/30 bg-white/50 py-3 pl-10 pr-4 text-sm text-[#290d1a] outline-none transition-all placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/50 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                       />
//                     </div>
//                     {errors.phone && (
//                       <p className="mt-1 text-xs text-[#b42318]">
//                         {errors.phone}
//                       </p>
//                     )}
//                   </div>

//                   <label className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/40 px-3 py-3 text-sm text-[#2c111d] shadow-[0_4px_16px_rgba(91,30,46,0.04)] backdrop-blur-sm transition-all hover:bg-white/60">
//                     <input
//                       type="checkbox"
//                       checked={form.is_visitor}
//                       onChange={(event) =>
//                         updateField("is_visitor", event.target.checked)
//                       }
//                       className="h-4 w-4 rounded border-[#5b1e2e]/20 text-[#5b1e2e] focus:ring-[#5b1e2e]"
//                     />
//                     I am an invitee. Skip faculty, department, and level.
//                   </label>

//                   {!form.is_visitor && (
//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div className="sm:col-span-2">
//                         <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
//                           Faculty
//                         </label>
//                         <select
//                           value={form.faculty}
//                           onChange={(event) =>
//                             updateField("faculty", event.target.value)
//                           }
//                           className="w-full rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-[#290d1a] outline-none transition-all focus:border-[#5b1e2e]/50 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                         >
//                           <option value="">Select faculty</option>
//                           {facultyOptions.map((faculty) => (
//                             <option key={faculty} value={faculty}>
//                               {faculty}
//                             </option>
//                           ))}
//                         </select>
//                         {errors.faculty && (
//                           <p className="mt-1 text-xs text-[#b42318]">
//                             {errors.faculty}
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
//                           Department
//                         </label>
//                         <input
//                           value={form.department}
//                           onChange={(event) =>
//                             updateField("department", event.target.value)
//                           }
//                           placeholder="Department"
//                           className="w-full rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-[#290d1a] outline-none transition-all placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/50 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                         />
//                         {errors.department && (
//                           <p className="mt-1 text-xs text-[#b42318]">
//                             {errors.department}
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="mb-1.5 block text-sm font-medium text-[#3a1825]">
//                           Level
//                         </label>
//                         <select
//                           value={form.level}
//                           onChange={(event) =>
//                             updateField("level", event.target.value)
//                           }
//                           className="w-full rounded-2xl border border-white/30 bg-white/50 px-4 py-3 text-sm text-[#290d1a] outline-none transition-all focus:border-[#5b1e2e]/50 focus:bg-white/70 focus:shadow-[0_0_0_4px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                         >
//                           <option value="">Select level</option>
//                           {levelOptions.map((level) => (
//                             <option key={level} value={level}>
//                               {level}
//                             </option>
//                           ))}
//                         </select>
//                         {errors.level && (
//                           <p className="mt-1 text-xs text-[#b42318]">
//                             {errors.level}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className="relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-[0_8px_32px_rgba(91,30,46,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(91,30,46,0.35)] disabled:cursor-not-allowed disabled:opacity-75 active:scale-95"
//                   >
//                     <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
//                     {isSubmitting ? "Registering..." : "Register now"}
//                     {!isSubmitting && <ArrowRight className="h-4 w-4" />}
//                   </button>
//                 </form>
//               ) : (
//                 <div className="relative space-y-5">
//                   <div className="flex items-center gap-3 rounded-2xl bg-white/50 p-3 text-[#2b0d18] shadow-[0_4px_16px_rgba(91,30,46,0.06)] backdrop-blur-sm">
//                     <div className="rounded-full bg-[#5b1e2e]/10 p-2 text-[#5b1e2e] shadow-[0_4px_16px_rgba(91,30,46,0.08)]">
//                       <CheckCircle2 className="h-5 w-5" />
//                     </div>
//                     <div>
//                       <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/70">
//                         Registration complete
//                       </p>
//                       <p className="text-sm font-bold">Welcome aboard</p>
//                     </div>
//                   </div>

//                   <div className="relative overflow-hidden rounded-[24px] border border-white/30 bg-white/50 p-4 text-center shadow-[0_8px_32px_rgba(91,30,46,0.08)] backdrop-blur-sm">
//                     <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#5b1e2e]/5 to-purple-500/5 blur-2xl" />
//                     <div className="mx-auto mb-4 flex w-48 items-center justify-center rounded-2xl bg-white/50 p-3 shadow-[0_8px_32px_rgba(91,30,46,0.1)] ring-1 ring-white/30 backdrop-blur-sm">
//                       {qrDataUrl ? (
//                         <img
//                           src={qrDataUrl}
//                           alt="Registration QR Code"
//                           className="h-48 w-48 rounded-xl object-cover"
//                         />
//                       ) : (
//                         <div className="h-48 w-48 animate-pulse rounded-xl bg-white/30" />
//                       )}
//                     </div>
//                     <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/70">
//                       Unique ID
//                     </p>
//                     <p className="mt-2 break-all text-base font-bold text-[#2a0d18]">
//                       {savedAttendee?.qrcode}
//                     </p>
//                     <button
//                       type="button"
//                       onClick={downloadQr}
//                       className="relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/30 bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(91,30,46,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:shadow-[0_8px_24px_rgba(91,30,46,0.3)] active:scale-95"
//                     >
//                       <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
//                       <Download className="h-4 w-4" />
//                       Download QR
//                     </button>
//                   </div>

//                   <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-white/40 p-4 text-sm leading-6 text-[#3d1d2b] shadow-[0_4px_16px_rgba(91,30,46,0.04)] backdrop-blur-sm">
//                     <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500/5 to-[#5b1e2e]/5 blur-2xl" />
//                     <p className="relative font-semibold text-[#2a0d18]">
//                       You have registered for the {retreatInfo.name}.
//                     </p>
//                     <p className="relative mt-1">Date: {retreatInfo.date}</p>
//                     <p className="relative">Venue: {retreatInfo.venue}</p>
//                     <p className="relative">School: {retreatInfo.school}</p>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={handleReset}
//                     className="w-full rounded-2xl border border-white/30 bg-white/40 px-4 py-3 text-sm font-semibold text-[#2a0d18] transition-all hover:bg-white/60 hover:shadow-[0_4px_16px_rgba(91,30,46,0.08)] backdrop-blur-sm"
//                   >
//                     Register another person
//                   </button>
//                 </div>
//               )}
//             </div>
//           </section>
//         </main>
//       </div>

//       <footer className="relative z-10 border-t border-white/20 bg-white/30 py-6 text-center text-sm text-[#4f2a36] backdrop-blur-[20px] backdrop-saturate-[180%]">
//         <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 sm:flex-row sm:gap-4">
//           <span className="font-semibold text-[#2a0d18]">
//             Anglican Students’ Fellowship LASU OJO
//           </span>
//           <span className="hidden sm:inline">•</span>
//           <span>{retreatInfo.school}</span>
//           <span className="hidden sm:inline">•</span>
//           <span>{retreatInfo.hail}</span>
//           <span>{retreatInfo.slogan}</span>
//         </div>
//       </footer>

//       <div className="fixed bottom-3 right-3 z-40 flex items-center gap-3 rounded-full border border-white/30 bg-gradient-to-br from-white/30 via-pink-500/5 to-cyan-500/10 px-3 py-2 shadow-[0_8px_32px_rgba(91,30,46,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-3xl backdrop-saturate-[180%] transform scale-85 origin-bottom-right">
//         <img
//           src="/okesh_tech.jpg"
//           alt="Okesh Tech"
//           className="h-9 w-9 rounded-full border border-white/30 object-cover shadow-[0_4px_16px_rgba(91,30,46,0.15)]"
//         />
//         <div className="leading-tight">
//           <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/70">
//             Developed by
//           </p>
//           <p className="text-xs font-bold text-[#2a0d18]">Okechukwu Goodluck</p>
//         </div>
//       </div>
//     </div>
//   );
// }


// src/pages/LandingPage.tsx
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
  hail: "ASF Arise...Shine!",
  slogan: "ASF...Restoring the Ancient Landmark!",
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
    <div className="min-h-screen bg-[#f6f0ee]">
      {/* Optimized Prism Effects - Telegram style (lightweight) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-[#5b1e2e]/5 blur-2xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-purple-500/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        {/* Header - Telegram style glass */}
        <header className="mb-6 flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/asflogo.png"
              alt="ASF LASU OJO Logo"
              className="h-9 w-9 rounded-full border border-white/50 object-cover bg-white shadow-sm sm:h-11 sm:w-11"
            />
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.28em]">
                ASF LASU OJO
              </p>
              <p className="text-[10px] font-bold text-[#2a0d18] sm:text-sm">
                Retreat Registration
              </p>
            </div>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-full bg-[#5b1e2e] px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            Admin
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </header>

        <main className="space-y-6 sm:space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Content - Mobile First */}
            <div className="space-y-4 px-1 sm:space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e] shadow-sm backdrop-blur-[8px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.26em]">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                1st Semester's Retreat
              </div>

              <div className="space-y-2 sm:space-y-4">
                <h1 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#220b13] sm:text-3xl md:text-4xl lg:text-5xl">
                  {retreatInfo.name}
                </h1>
                <p className="text-sm leading-6 text-[#5b1e2e]/80 sm:text-base sm:leading-7">
                  A simple, secure registration experience for fellows and
                  guests preparing for a spiritually refreshing retreat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#3e1d2b] sm:gap-3 sm:text-sm">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1.5 shadow-sm backdrop-blur-[8px] sm:gap-2 sm:px-3 sm:py-2">
                  <ShieldCheck className="h-3 w-3 text-[#5b1e2e] sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs">{retreatInfo.motto}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1.5 shadow-sm backdrop-blur-[8px] sm:gap-2 sm:px-3 sm:py-2">
                  <Sparkles className="h-3 w-3 text-[#5b1e2e] sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs">{retreatInfo.slogan}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <div className="rounded-xl bg-white/60 p-3 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.22em]">
                    Date
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#2a0d18] sm:mt-2 sm:text-sm">
                    {retreatInfo.date}
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-3 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.22em]">
                    Venue
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#2a0d18] sm:mt-2 sm:text-sm">
                    {retreatInfo.venue}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card - Telegram style glass */}
            <div className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-5 md:p-6">
              {!savedAttendee ? (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.25em]">
                        Registration
                      </p>
                      <h2 className="text-lg capitalize font-bold text-[#220b13] sm:text-xl md:text-2xl">
                        Join the train of Light Bearers!
                      </h2>
                    </div>
                    <div className="rounded-full bg-[#5b1e2e]/5 p-1.5 text-[#5b1e2e] sm:p-2">
                      <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#3a1825] sm:text-sm">
                      Full name
                    </label>
                    <input
                      value={form.fullname}
                      onChange={(event) =>
                        updateField("fullname", event.target.value)
                      }
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                    />
                    {errors.fullname && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.fullname}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#3a1825] sm:text-sm">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5b1e2e]/60 sm:h-4 sm:w-4" />
                      <input
                        value={form.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="080XXXXXXXX"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:py-3 sm:pl-10 sm:pr-4"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-[#b42318]">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-2 rounded-xl border border-[#5b1e2e]/10 bg-white/60 px-3 py-2.5 text-xs text-[#2c111d] transition hover:bg-white/80 sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_visitor}
                      onChange={(event) =>
                        updateField("is_visitor", event.target.checked)
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-[#5b1e2e]/20 text-[#5b1e2e] focus:ring-[#5b1e2e] sm:mt-0 sm:h-4 sm:w-4"
                    />
                    <span>I am an invitee. Skip faculty, department, and level.</span>
                  </label>

                  {!form.is_visitor && (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#3a1825] sm:text-sm">
                          Faculty
                        </label>
                        <select
                          value={form.faculty}
                          onChange={(event) =>
                            updateField("faculty", event.target.value)
                          }
                          className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
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

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#3a1825] sm:text-sm">
                            Department
                          </label>
                          <input
                            value={form.department}
                            onChange={(event) =>
                              updateField("department", event.target.value)
                            }
                            placeholder="Department"
                            className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                          />
                          {errors.department && (
                            <p className="mt-1 text-xs text-[#b42318]">
                              {errors.department}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#3a1825] sm:text-sm">
                            Level
                          </label>
                          <select
                            value={form.level}
                            onChange={(event) =>
                              updateField("level", event.target.value)
                            }
                            className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
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
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:rounded-2xl sm:py-3.5 sm:text-base"
                  >
                    {isSubmitting ? "Registering..." : "Register now"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl bg-white/60 p-2.5 text-[#2b0d18] backdrop-blur-[8px] sm:gap-3 sm:rounded-2xl sm:p-3">
                    <div className="rounded-full bg-[#5b1e2e]/5 p-1.5 text-[#5b1e2e] sm:p-2">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[9px] sm:tracking-[0.22em]">
                        Registration complete
                      </p>
                      <p className="text-sm font-bold sm:text-base">Welcome aboard</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#5b1e2e]/10 bg-white/60 p-3 text-center backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                    <div className="mx-auto mb-3 flex w-32 items-center justify-center rounded-xl bg-white/60 p-2 shadow-sm ring-1 ring-[#5b1e2e]/10 sm:w-40 sm:p-3">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Registration QR Code"
                          className="h-32 w-32 rounded-lg object-cover sm:h-40 sm:w-40"
                        />
                      ) : (
                        <div className="h-32 w-32 animate-pulse rounded-lg bg-white/30 sm:h-40 sm:w-40" />
                      )}
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.25em]">
                      Unique ID
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-[#2a0d18] sm:mt-2 sm:text-base">
                      {savedAttendee?.qrcode}
                    </p>
                    <button
                      type="button"
                      onClick={downloadQr}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#5b1e2e] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431724] active:scale-95 sm:mt-4 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      Download QR
                    </button>
                  </div>

                  <div className="rounded-xl bg-white/60 p-3 text-xs leading-5 text-[#3d1d2b] backdrop-blur-[8px] sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
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
                    className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#2a0d18] transition hover:bg-white/80 active:scale-[0.98] sm:rounded-2xl sm:py-3"
                  >
                    Register another person
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-white/20 bg-white/60 py-4 text-center text-xs text-[#4f2a36] backdrop-blur-[12px] sm:py-6 sm:text-sm">
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

      <div className="fixed bottom-2 right-2 z-40 flex items-center gap-2 rounded-full bg-white/70 px-2.5 py-1.5 shadow-lg backdrop-blur-[12px] sm:bottom-3 sm:right-3 sm:gap-3 sm:px-3 sm:py-2">
        <img
          src="/okesh_tech.jpg"
          alt="Okesh Tech"
          className="h-7 w-7 rounded-full border border-white/50 object-cover shadow-sm sm:h-9 sm:w-9"
        />
        <div className="leading-tight">
          <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[8px] sm:tracking-[0.22em]">
            Developed by
          </p>
          <p className="text-[9px] font-bold text-[#2a0d18] sm:text-xs">Okechukwu Goodluck</p>
        </div>
      </div>
    </div>
  );
}