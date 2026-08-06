// // src/pages/AuthPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   ArrowRight,
//   CheckCircle2,
//   Download,
//   Eye,
//   EyeOff,
//   LogOut,
//   ShieldCheck,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import { QrCodeScanner } from "../components/QrcodeComponent";
// import { useAuth } from "../contexts/AuthContext";
// import api from "../utils/axiosConfig";

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

// type AuthMode = "login" | "register";

// type DashboardStats = {
//   total_attendees: number;
//   confirmed_attendees: number;
//   awaiting_confirmation: number;
//   visitor_count: number;
// };

// const statsDefaults: DashboardStats = {
//   total_attendees: 0,
//   confirmed_attendees: 0,
//   awaiting_confirmation: 0,
//   visitor_count: 0,
// };

// export function AuthPage() {
//   const { login, register, logout, isAuthenticated, admin } = useAuth();
//   const [mode, setMode] = useState<AuthMode>("login");
//   const [showPassword, setShowPassword] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
//   const [stats, setStats] = useState<DashboardStats>(statsDefaults);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loginValues, setLoginValues] = useState({ email: "", password: "" });
//   const [registerValues, setRegisterValues] = useState({
//     admin_id: "",
//     fullname: "",
//     email: "",
//     phone: "",
//     password: "",
//   });

//   const loadDashboard = async () => {
//     setIsLoading(true);
//     try {
//       const [attendeesResponse, statsResponse] = await Promise.all([
//         api.get("/attendees", { params: { page: 1, per_page: 200 } }),
//         api.get("/attendees/stats"),
//       ]);

//       setAttendees(attendeesResponse.data.attendees || []);
//       setStats(statsResponse.data.stats || statsDefaults);
//     } catch (error) {
//       console.error("Failed to load admin dashboard data:", error);
//       toast.error("Unable to load attendee records right now.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isAuthenticated) {
//       void loadDashboard();
//     }
//   }, [isAuthenticated]);

//   const summaryCards = useMemo(
//     () => [
//       {
//         label: "Total registered",
//         value: stats.total_attendees,
//         accent: "from-[#5b1e2e] to-[#7b2a3b]",
//       },
//       {
//         label: "Confirmed",
//         value: stats.confirmed_attendees,
//         accent: "from-[#0f766e] to-[#14b8a6]",
//       },
//       {
//         label: "Awaiting",
//         value: stats.awaiting_confirmation,
//         accent: "from-[#d97706] to-[#f59e0b]",
//       },
//       {
//         label: "Visitors",
//         value: stats.visitor_count,
//         accent: "from-[#4338ca] to-[#6366f1]",
//       },
//     ],
//     [stats],
//   );

//   const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);

//     try {
//       await login(loginValues.email, loginValues.password);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsSubmitting(true);

//     try {
//       await register({
//         admin_id: registerValues.admin_id,
//         fullname: registerValues.fullname,
//         email: registerValues.email,
//         phone: registerValues.phone,
//         password: registerValues.password,
//       });
//       setMode("login");
//       setRegisterValues({
//         admin_id: "",
//         fullname: "",
//         email: "",
//         phone: "",
//         password: "",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleLogout = async () => {
//     await logout();
//   };

//   const handleConfirmAttendee = async (qrString: string) => {
//     await api.post("/attendees/confirm", { qrcode: qrString });
//     await loadDashboard();
//     toast.success("Attendee confirmed successfully.");
//   };

//   const exportTableToExcel = () => {
//     const rows = attendees.map((attendee) => ({
//       Name: attendee.fullname,
//       Phone: attendee.phone,
//       Faculty: attendee.faculty || "Visitor",
//       Department: attendee.department || "N/A",
//       Level: attendee.level || "N/A",
//       Visitor: attendee.is_visitor ? "Yes" : "No",
//       Confirmed: attendee.is_confirmed ? "Yes" : "No",
//       QR: attendee.qrcode,
//       Registered: attendee.registered_on
//         ? new Date(attendee.registered_on).toLocaleString("en-NG")
//         : "N/A",
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(rows);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
//     XLSX.writeFile(workbook, "asf-retreat-attendees.xlsx");
//   };

//   const exportTableToPdf = () => {
//     const doc = new jsPDF();
//     autoTable(doc, {
//       head: [
//         [
//           "Name",
//           "Phone",
//           "Faculty",
//           "Department",
//           "Level",
//           "Visitor",
//           "Confirmed",
//         ],
//       ],
//       body: attendees.map((attendee) => [
//         attendee.fullname,
//         attendee.phone,
//         attendee.faculty || "Visitor",
//         attendee.department || "N/A",
//         attendee.level || "N/A",
//         attendee.is_visitor ? "Yes" : "No",
//         attendee.is_confirmed ? "Yes" : "No",
//       ]),
//       startY: 20,
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [91, 30, 46] },
//     });
//     doc.save("asf-retreat-attendees.pdf");
//   };

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-[#f6f0ee] px-4 py-10 text-[#2a0d18]">
//         <div className="mx-auto max-w-6xl">
//           <div className="mb-8 flex items-center justify-between">
//             <Link
//               to="/"
//               className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b1e2e]"
//             >
//               <ArrowRight className="h-4 w-4 rotate-180" />
//               Back to registration
//             </Link>
//             <div className="rounded-full border border-[#5b1e2e]/10 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]">
//               Admin access
//             </div>
//           </div>

//           <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
//             <div className="space-y-6 rounded-[30px] border border-[#5b1e2e]/10 bg-white/80 p-6 shadow-[0_28px_70px_-40px_rgba(91,30,46,0.5)] backdrop-blur-xl">
//               <div className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e]/5 p-2 text-[#5b1e2e]">
//                 <ShieldCheck className="h-5 w-5" />
//                 Secure executive portal
//               </div>
//               <div>
//                 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/70">
//                   Executive auth
//                 </p>
//                 <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-[#220b13]">
//                   Admin dashboard
//                 </h1>
//               </div>
//               <p className="max-w-md text-base leading-7 text-[#4d2a35]">
//                 Log in to confirm attendance, manage registrations, and keep the
//                 retreat process smooth and professional.
//               </p>
//               <div className="grid gap-3 sm:grid-cols-2">
//                 <div className="rounded-2xl border border-[#5b1e2e]/10 bg-[#fffaf9] p-4">
//                   <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/65">
//                     Fast check-in
//                   </p>
//                   <p className="mt-2 text-base font-bold text-[#2a0d18]">
//                     QR scanning
//                   </p>
//                 </div>
//                 <div className="rounded-2xl border border-[#5b1e2e]/10 bg-[#fffaf9] p-4">
//                   <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/65">
//                     Live stats
//                   </p>
//                   <p className="mt-2 text-base font-bold text-[#2a0d18]">
//                     Attendance overview
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-[30px] border border-[#5b1e2e]/10 bg-white/90 p-5 shadow-[0_28px_70px_-40px_rgba(91,30,46,0.5)] backdrop-blur-xl sm:p-6">
//               <div className="mb-5 flex rounded-full bg-[#f8ecee] p-1">
//                 <button
//                   type="button"
//                   onClick={() => setMode("login")}
//                   className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
//                     mode === "login"
//                       ? "bg-[#5b1e2e] text-white shadow-md"
//                       : "text-[#4b2a35]"
//                   }`}
//                 >
//                   Login
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setMode("register")}
//                   className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
//                     mode === "register"
//                       ? "bg-[#5b1e2e] text-white shadow-md"
//                       : "text-[#4b2a35]"
//                   }`}
//                 >
//                   Register
//                 </button>
//               </div>

//               {mode === "login" ? (
//                 <form onSubmit={handleLogin} className="space-y-4">
//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                       Email address
//                     </label>
//                     <input
//                       value={loginValues.email}
//                       onChange={(event) =>
//                         setLoginValues((prev) => ({
//                           ...prev,
//                           email: event.target.value,
//                         }))
//                       }
//                       type="email"
//                       placeholder="admin@asf.com"
//                       className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                     />
//                   </div>

//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                       Password
//                     </label>
//                     <div className="relative">
//                       <input
//                         value={loginValues.password}
//                         onChange={(event) =>
//                           setLoginValues((prev) => ({
//                             ...prev,
//                             password: event.target.value,
//                           }))
//                         }
//                         type={showPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 pr-11 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword((prev) => !prev)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b1e2e]"
//                       >
//                         {showPassword ? (
//                           <EyeOff className="h-4 w-4" />
//                         ) : (
//                           <Eye className="h-4 w-4" />
//                         )}
//                       </button>
//                     </div>
//                   </div>

//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] disabled:cursor-not-allowed disabled:opacity-75"
//                   >
//                     {isSubmitting ? "Checking in..." : "Login to dashboard"}
//                     {!isSubmitting && <ArrowRight className="h-4 w-4" />}
//                   </button>
//                 </form>
//               ) : (
//                 <form onSubmit={handleRegister} className="space-y-4">
//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                       Access code
//                     </label>
//                     <input
//                       value={registerValues.admin_id}
//                       onChange={(event) =>
//                         setRegisterValues((prev) => ({
//                           ...prev,
//                           admin_id: event.target.value,
//                         }))
//                       }
//                       placeholder="Enter admin code"
//                       className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                     />
//                   </div>

//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                       Full name
//                     </label>
//                     <input
//                       value={registerValues.fullname}
//                       onChange={(event) =>
//                         setRegisterValues((prev) => ({
//                           ...prev,
//                           fullname: event.target.value,
//                         }))
//                       }
//                       placeholder="Okechukwu Goodluck"
//                       className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                     />
//                   </div>

//                   <div className="grid gap-4 sm:grid-cols-2">
//                     <div>
//                       <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                         Email
//                       </label>
//                       <input
//                         value={registerValues.email}
//                         onChange={(event) =>
//                           setRegisterValues((prev) => ({
//                             ...prev,
//                             email: event.target.value,
//                           }))
//                         }
//                         type="email"
//                         placeholder="admin@asf.com"
//                         className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                       />
//                     </div>
//                     <div>
//                       <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                         Phone
//                       </label>
//                       <input
//                         value={registerValues.phone}
//                         onChange={(event) =>
//                           setRegisterValues((prev) => ({
//                             ...prev,
//                             phone: event.target.value,
//                           }))
//                         }
//                         inputMode="numeric"
//                         maxLength={11}
//                         placeholder="080XXXXXXXX"
//                         className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                       />
//                     </div>
//                   </div>

//                   <div>
//                     <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
//                       Password
//                     </label>
//                     <input
//                       value={registerValues.password}
//                       onChange={(event) =>
//                         setRegisterValues((prev) => ({
//                           ...prev,
//                           password: event.target.value,
//                         }))
//                       }
//                       type="password"
//                       placeholder="Create a password"
//                       className="w-full rounded-2xl border border-[#5b1e2e]/15 bg-[#fffaf9] px-4 py-3 text-sm text-[#290d1a] outline-none transition focus:border-[#5b1e2e] focus:ring-2 focus:ring-[#5b1e2e]/10"
//                     />
//                   </div>

//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] disabled:cursor-not-allowed disabled:opacity-75"
//                   >
//                     {isSubmitting
//                       ? "Creating account..."
//                       : "Create executive profile"}
//                     {!isSubmitting && <ArrowRight className="h-4 w-4" />}
//                   </button>
//                 </form>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#f6f0ee] px-4 py-6 text-[#2a0d18] sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <header className="mb-6 flex flex-col gap-4 rounded-[26px] border border-[#5b1e2e]/10 bg-white/80 p-4 shadow-[0_28px_70px_-40px_rgba(91,30,46,0.5)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-3">
//             <img
//               src="/asflogo.png"
//               alt="ASF Logo"
//               className="h-12 w-12 rounded-full border border-[#5b1e2e]/15 object-cover bg-white"
//             />
//             <div>
//               <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/70">
//                 Executive dashboard
//               </p>
//               <h1 className="text-xl font-black text-[#220b13]">
//                 ASF LASU OJO Retreat
//               </h1>
//             </div>
//           </div>

//           <div className="flex flex-wrap items-center gap-3">
//             <div className="rounded-full bg-[#f8ecee] px-3 py-1.5 text-xs font-medium text-[#5b1e2e]">
//               {admin?.fullname || "Executive"}
//             </div>
//             <button
//               type="button"
//               onClick={handleLogout}
//               className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#431724]"
//             >
//               <LogOut className="h-4 w-4" />
//               Logout
//             </button>
//           </div>
//         </header>

//         <main className="space-y-6">
//           <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             {summaryCards.map((card) => (
//               <div
//                 key={card.label}
//                 className="overflow-hidden rounded-[26px] border border-[#5b1e2e]/10 bg-white/80 shadow-[0_22px_50px_-35px_rgba(91,30,46,0.6)]"
//               >
//                 <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} />
//                 <div className="p-5">
//                   <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5b1e2e]/65">
//                     {card.label}
//                   </p>
//                   <p className="mt-4 text-3xl font-black tracking-[-0.06em] text-[#220b13]">
//                     {card.value}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </section>

//           <section className="rounded-[28px] border border-[#5b1e2e]/10 bg-white/80 p-4 shadow-[0_28px_70px_-40px_rgba(91,30,46,0.5)] sm:p-6">
//             <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/70">
//                   Attendance manager
//                 </p>
//                 <h2 className="mt-1 text-2xl font-black text-[#220b13]">
//                   Registered attendees
//                 </h2>
//               </div>

//               <div className="flex flex-wrap gap-3">
//                 <button
//                   type="button"
//                   onClick={exportTableToExcel}
//                   className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-[#fffaf9] px-4 py-2 text-sm font-semibold text-[#2a0d18] transition hover:bg-[#f8ecee]"
//                 >
//                   <Download className="h-4 w-4" />
//                   Export XLSX
//                 </button>
//                 <button
//                   type="button"
//                   onClick={exportTableToPdf}
//                   className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#431724]"
//                 >
//                   <Download className="h-4 w-4" />
//                   Export PDF
//                 </button>
//               </div>
//             </div>

//             <div className="mb-5 flex justify-end">
//               <QrCodeScanner
//                 label="Scan QR code to confirm attendance"
//                 onScan={handleConfirmAttendee}
//               />
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full border-separate border-spacing-y-2">
//                 <thead>
//                   <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/65">
//                     <th className="px-3 py-2">Name</th>
//                     <th className="px-3 py-2">Phone</th>
//                     <th className="px-3 py-2">Faculty</th>
//                     <th className="px-3 py-2">Department</th>
//                     <th className="px-3 py-2">Level</th>
//                     <th className="px-3 py-2">Visitor</th>
//                     <th className="px-3 py-2">Status</th>
//                     <th className="px-3 py-2">QR</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {isLoading ? (
//                     <tr>
//                       <td
//                         colSpan={8}
//                         className="px-3 py-10 text-center text-sm text-[#4d2a35]"
//                       >
//                         Loading attendees...
//                       </td>
//                     </tr>
//                   ) : attendees.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={8}
//                         className="px-3 py-10 text-center text-sm text-[#4d2a35]"
//                       >
//                         No attendees have registered yet.
//                       </td>
//                     </tr>
//                   ) : (
//                     attendees.map((attendee) => (
//                       <tr
//                         key={attendee.id}
//                         className="rounded-2xl bg-[#fdf7f8] text-sm text-[#2a0d18] shadow-sm"
//                       >
//                         <td className="rounded-l-2xl px-3 py-3 font-semibold">
//                           {attendee.fullname}
//                         </td>
//                         <td className="px-3 py-3">{attendee.phone}</td>
//                         <td className="px-3 py-3">
//                           {attendee.faculty || "Visitor"}
//                         </td>
//                         <td className="px-3 py-3">
//                           {attendee.department || "—"}
//                         </td>
//                         <td className="px-3 py-3">{attendee.level || "—"}</td>
//                         <td className="px-3 py-3">
//                           {attendee.is_visitor ? "Yes" : "No"}
//                         </td>
//                         <td className="px-3 py-3">
//                           {attendee.is_confirmed ? (
//                             <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]">
//                               <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11px] font-semibold text-[#92400e]">
//                               Pending
//                             </span>
//                           )}
//                         </td>
//                         <td className="rounded-r-2xl px-3 py-3 font-mono text-xs text-[#5b1e2e]">
//                           {attendee.qrcode}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }


// src/pages/AuthPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QrCodeScanner } from "../components/QrcodeComponent";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/axiosConfig";

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

type AuthMode = "login" | "register";

type DashboardStats = {
  total_attendees: number;
  confirmed_attendees: number;
  awaiting_confirmation: number;
  visitor_count: number;
};

const statsDefaults: DashboardStats = {
  total_attendees: 0,
  confirmed_attendees: 0,
  awaiting_confirmation: 0,
  visitor_count: 0,
};

export function AuthPage() {
  const { login, register, logout, isAuthenticated, admin } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>(statsDefaults);
  const [isLoading, setIsLoading] = useState(false);
  const [loginValues, setLoginValues] = useState({ email: "", password: "" });
  const [registerValues, setRegisterValues] = useState({
    admin_id: "",
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [attendeesResponse, statsResponse] = await Promise.all([
        api.get("/attendees", { params: { page: 1, per_page: 200 } }),
        api.get("/attendees/stats"),
      ]);

      setAttendees(attendeesResponse.data.attendees || []);
      setStats(statsResponse.data.stats || statsDefaults);
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
      toast.error("Unable to load attendee records right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboard();
    }
  }, [isAuthenticated]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total registered",
        value: stats.total_attendees,
        accent: "from-[#5b1e2e] to-[#7b2a3b]",
      },
      {
        label: "Confirmed",
        value: stats.confirmed_attendees,
        accent: "from-[#0f766e] to-[#14b8a6]",
      },
      {
        label: "Awaiting",
        value: stats.awaiting_confirmation,
        accent: "from-[#d97706] to-[#f59e0b]",
      },
      {
        label: "Visitors",
        value: stats.visitor_count,
        accent: "from-[#4338ca] to-[#6366f1]",
      },
    ],
    [stats],
  );

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login(loginValues.email, loginValues.password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register({
        admin_id: registerValues.admin_id,
        fullname: registerValues.fullname,
        email: registerValues.email,
        phone: registerValues.phone,
        password: registerValues.password,
      });
      setMode("login");
      setRegisterValues({
        admin_id: "",
        fullname: "",
        email: "",
        phone: "",
        password: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleConfirmAttendee = async (qrString: string) => {
    await api.post("/attendees/confirm", { qrcode: qrString });
    await loadDashboard();
    toast.success("Attendee confirmed successfully.");
  };

  const exportTableToExcel = () => {
    const rows = attendees.map((attendee) => ({
      Name: attendee.fullname,
      Phone: attendee.phone,
      Faculty: attendee.faculty || "Visitor",
      Department: attendee.department || "N/A",
      Level: attendee.level || "N/A",
      Visitor: attendee.is_visitor ? "Yes" : "No",
      Confirmed: attendee.is_confirmed ? "Yes" : "No",
      QR: attendee.qrcode,
      Registered: attendee.registered_on
        ? new Date(attendee.registered_on).toLocaleString("en-NG")
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
    XLSX.writeFile(workbook, "asf-retreat-attendees.xlsx");
  };

  const exportTableToPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          "Name",
          "Phone",
          "Faculty",
          "Department",
          "Level",
          "Visitor",
          "Confirmed",
        ],
      ],
      body: attendees.map((attendee) => [
        attendee.fullname,
        attendee.phone,
        attendee.faculty || "Visitor",
        attendee.department || "N/A",
        attendee.level || "N/A",
        attendee.is_visitor ? "Yes" : "No",
        attendee.is_confirmed ? "Yes" : "No",
      ]),
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [91, 30, 46] },
    });
    doc.save("asf-retreat-attendees.pdf");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f0ee] px-4 py-6 text-[#2a0d18] sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5b1e2e] sm:gap-2 sm:text-sm"
            >
              <ArrowRight className="h-3 w-3 rotate-180 sm:h-4 sm:w-4" />
              Back to registration
            </Link>
            <div className="rounded-full bg-white/60 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e] backdrop-blur-[8px] sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.28em]">
              Admin access
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            {/* Left Content - Mobile First */}
            <div className="space-y-4 rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:rounded-3xl sm:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e]/5 p-1.5 text-[#5b1e2e] sm:p-2">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.28em]">
                  Executive auth
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#220b13] sm:mt-3 sm:text-3xl md:text-4xl">
                  Admin dashboard
                </h1>
              </div>
              <p className="text-sm leading-6 text-[#4d2a35] sm:text-base sm:leading-7">
                Log in to confirm attendance, manage registrations, and keep the
                retreat process smooth and professional.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl bg-white/60 p-3 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[9px] sm:tracking-[0.22em]">
                    Fast check-in
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#2a0d18] sm:mt-2 sm:text-sm">QR scanning</p>
                </div>
                <div className="rounded-xl bg-white/60 p-3 shadow-sm backdrop-blur-[8px] sm:rounded-2xl sm:p-4">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[9px] sm:tracking-[0.22em]">
                    Live stats
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#2a0d18] sm:mt-2 sm:text-sm">Attendance overview</p>
                </div>
              </div>
            </div>

            {/* Auth Form - Mobile First */}
            <div className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:rounded-3xl sm:p-6">
              <div className="mb-4 flex rounded-full bg-[#f8ecee] p-1 sm:mb-5">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2.5 sm:text-sm ${
                    mode === "login"
                      ? "bg-[#5b1e2e] text-white shadow-md"
                      : "text-[#4b2a35]"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2.5 sm:text-sm ${
                    mode === "register"
                      ? "bg-[#5b1e2e] text-white shadow-md"
                      : "text-[#4b2a35]"
                  }`}
                >
                  Register
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                      Email address
                    </label>
                    <input
                      value={loginValues.email}
                      onChange={(event) =>
                        setLoginValues((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      type="email"
                      placeholder="admin@asf.com"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        value={loginValues.password}
                        onChange={(event) =>
                          setLoginValues((prev) => ({
                            ...prev,
                            password: event.target.value,
                          }))
                        }
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 pr-10 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3 sm:pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b1e2e]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:rounded-2xl sm:py-3.5 sm:text-base"
                  >
                    {isSubmitting ? "Checking in..." : "Login to dashboard"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                      Access code
                    </label>
                    <input
                      value={registerValues.admin_id}
                      onChange={(event) =>
                        setRegisterValues((prev) => ({
                          ...prev,
                          admin_id: event.target.value,
                        }))
                      }
                      placeholder="Enter admin code"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                      Full name
                    </label>
                    <input
                      value={registerValues.fullname}
                      onChange={(event) =>
                        setRegisterValues((prev) => ({
                          ...prev,
                          fullname: event.target.value,
                        }))
                      }
                      placeholder="Okechukwu Goodluck"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                        Email
                      </label>
                      <input
                        value={registerValues.email}
                        onChange={(event) =>
                          setRegisterValues((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        type="email"
                        placeholder="admin@asf.com"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                        Phone
                      </label>
                      <input
                        value={registerValues.phone}
                        onChange={(event) =>
                          setRegisterValues((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="080XXXXXXXX"
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2e1720] sm:text-sm">
                      Password
                    </label>
                    <input
                      value={registerValues.password}
                      onChange={(event) =>
                        setRegisterValues((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      type="password"
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-3 py-2.5 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] sm:rounded-2xl sm:px-4 sm:py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:rounded-2xl sm:py-3.5 sm:text-base"
                  >
                    {isSubmitting
                      ? "Creating account..."
                      : "Create executive profile"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f0ee] px-3 py-3 text-[#2a0d18] sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-white/70 p-3 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/asflogo.png"
              alt="ASF Logo"
              className="h-10 w-10 rounded-full border border-white/50 object-cover bg-white shadow-sm sm:h-12 sm:w-12"
            />
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[9px] sm:tracking-[0.28em]">
                Executive dashboard
              </p>
              <h1 className="text-base font-black text-[#220b13] sm:text-lg md:text-xl">
                ASF LASU OJO Retreat
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="rounded-full bg-[#f8ecee] px-2.5 py-1 text-[10px] font-medium text-[#5b1e2e] sm:px-3 sm:py-1.5 sm:text-xs">
              {admin?.fullname || "Executive"}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5b1e2e] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#431724] active:scale-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="space-y-4 sm:space-y-6">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 sm:gap-3 md:gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="overflow-hidden rounded-xl bg-white/70 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:rounded-2xl"
              >
                <div className={`h-1 bg-gradient-to-r ${card.accent}`} />
                <div className="p-2.5 sm:p-4 md:p-5">
                  <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[8px] sm:tracking-[0.24em]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-lg font-black tracking-[-0.04em] text-[#220b13] sm:mt-2 sm:text-2xl md:text-3xl">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white/70 p-3 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-4 md:p-6">
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between md:mb-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[10px] sm:tracking-[0.25em]">
                  Attendance manager
                </p>
                <h2 className="text-lg font-black text-[#220b13] sm:text-xl md:text-2xl">
                  Registered attendees
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={exportTableToExcel}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#5b1e2e]/10 bg-white/60 px-3 py-1.5 text-xs font-semibold text-[#2a0d18] transition hover:bg-white/80 active:scale-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export XLSX</span>
                  <span className="sm:hidden">XLSX</span>
                </button>
                <button
                  type="button"
                  onClick={exportTableToPdf}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#5b1e2e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#431724] active:scale-95 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>

            <div className="mb-3 flex justify-end sm:mb-4">
              <QrCodeScanner
                label="Scan QR code to confirm attendance"
                onScan={handleConfirmAttendee}
              />
            </div>

            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
              <div className="inline-block min-w-full px-3 sm:px-4 md:px-0">
                <table className="min-w-full border-separate border-spacing-y-1.5 sm:border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-[8px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e]/60 sm:text-[9px] sm:tracking-[0.22em]">
                      <th className="px-1.5 py-1.5 sm:px-2 sm:py-2">Name</th>
                      <th className="px-1.5 py-1.5 sm:px-2 sm:py-2">Phone</th>
                      <th className="hidden px-1.5 py-1.5 sm:table-cell sm:px-2 sm:py-2">Faculty</th>
                      <th className="hidden px-1.5 py-1.5 md:table-cell sm:px-2 sm:py-2">Dept</th>
                      <th className="hidden px-1.5 py-1.5 lg:table-cell sm:px-2 sm:py-2">Level</th>
                      <th className="px-1.5 py-1.5 sm:px-2 sm:py-2">Visitor</th>
                      <th className="px-1.5 py-1.5 sm:px-2 sm:py-2">Status</th>
                      <th className="hidden px-1.5 py-1.5 sm:table-cell sm:px-2 sm:py-2">QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-xs text-[#4d2a35] sm:py-10 sm:text-sm"
                        >
                          Loading attendees...
                        </td>
                      </tr>
                    ) : attendees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-8 text-center text-xs text-[#4d2a35] sm:py-10 sm:text-sm"
                        >
                          No attendees have registered yet.
                        </td>
                      </tr>
                    ) : (
                      attendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          className="rounded-xl bg-white/60 text-xs text-[#2a0d18] shadow-sm sm:text-sm"
                        >
                          <td className="rounded-l-xl px-1.5 py-2 font-semibold sm:px-2 sm:py-3">
                            <span className="block max-w-[60px] truncate sm:max-w-[100px]">
                              {attendee.fullname}
                            </span>
                          </td>
                          <td className="px-1.5 py-2 sm:px-2 sm:py-3">
                            <span className="text-[10px] sm:text-xs">
                              {attendee.phone}
                            </span>
                          </td>
                          <td className="hidden px-1.5 py-2 sm:table-cell sm:px-2 sm:py-3">
                            <span className="text-[10px] sm:text-xs">
                              {attendee.faculty || "Visitor"}
                            </span>
                          </td>
                          <td className="hidden px-1.5 py-2 md:table-cell sm:px-2 sm:py-3">
                            <span className="text-[10px] sm:text-xs">
                              {attendee.department || "—"}
                            </span>
                          </td>
                          <td className="hidden px-1.5 py-2 lg:table-cell sm:px-2 sm:py-3">
                            <span className="text-[10px] sm:text-xs">
                              {attendee.level || "—"}
                            </span>
                          </td>
                          <td className="px-1.5 py-2 sm:px-2 sm:py-3">
                            <span className="text-[10px] sm:text-xs">
                              {attendee.is_visitor ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-1.5 py-2 sm:px-2 sm:py-3">
                            {attendee.is_confirmed ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[8px] font-semibold text-[#166534] sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[10px]">
                                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3.5" />
                                <span className="hidden xs:inline">Confirmed</span>
                                <span className="xs:hidden">✓</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fef3c7] px-1.5 py-0.5 text-[8px] font-semibold text-[#92400e] sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[10px]">
                                <span className="hidden xs:inline">Pending</span>
                                <span className="xs:hidden">⏳</span>
                              </span>
                            )}
                          </td>
                          <td className="hidden rounded-r-xl px-1.5 py-2 sm:table-cell sm:px-2 sm:py-3">
                            <span className="block max-w-[60px] truncate font-mono text-[8px] text-[#5b1e2e] sm:max-w-[80px] sm:text-[9px]">
                              {attendee.qrcode}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}