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
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QrCodeScanner } from "../components/QrcodeComponent";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/axiosConfig";
// import { cn } from "../lib/utils";

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

type FilterStatus = "all" | "confirmed" | "pending";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

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
          "Registered",
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
        attendee.registered_on
          ? new Date(attendee.registered_on).toLocaleString("en-NG")
          : "N/A",
      ]),
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [91, 30, 46] },
    });
    doc.save("asf-retreat-attendees.pdf");
  };

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    let filtered = attendees;

    // Status filter
    if (statusFilter === "confirmed") {
      filtered = filtered.filter((a) => a.is_confirmed);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((a) => !a.is_confirmed);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.fullname.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.qrcode.toLowerCase().includes(q) ||
          (a.faculty && a.faculty.toLowerCase().includes(q)) ||
          (a.department && a.department.toLowerCase().includes(q)),
      );
    }

    return filtered;
  }, [attendees, statusFilter, search]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f0ee] px-4 py-6 text-[#2a0d18] sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5b1e2e] sm:gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to registration
            </Link>
            <div className="rounded-full bg-white/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5b1e2e] backdrop-blur-[8px]">
              Admin access
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4 rounded-2xl bg-white/70 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e]/5 p-2 text-[#5b1e2e]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/60">
                  Executive auth
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#220b13] sm:text-4xl">
                  Admin dashboard
                </h1>
              </div>
              <p className="text-base leading-7 text-[#4d2a35]">
                Log in to confirm attendance, manage registrations, and keep the
                retreat process smooth and professional.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/60 p-4 shadow-sm backdrop-blur-[8px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                    Fast check-in
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#2a0d18]">
                    QR scanning
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-4 shadow-sm backdrop-blur-[8px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                    Live stats
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#2a0d18]">
                    Attendance overview
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px]">
              <div className="mb-5 flex rounded-full bg-[#f8ecee] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
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
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "register"
                      ? "bg-[#5b1e2e] text-white shadow-md"
                      : "text-[#4b2a35]"
                  }`}
                >
                  Register
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 pr-11 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b1e2e]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isSubmitting ? "Checking in..." : "Login to dashboard"}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                        className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#2e1720]">
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
                      className="w-full rounded-xl border border-[#5b1e2e]/10 bg-white/80 px-4 py-3 text-sm text-[#290d1a] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b1e2e] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5b1e2e]/20 transition hover:bg-[#431724] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
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
    <div className="min-h-screen bg-[#f6f0ee] px-4 py-4 text-[#2a0d18] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <img
              src="/asflogo.png"
              alt="ASF Logo"
              className="h-12 w-12 rounded-full border border-white/50 object-cover bg-white shadow-sm"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5b1e2e]/60">
                Executive dashboard
              </p>
              <h1 className="text-xl font-black text-[#220b13]">
                ASF LASU OJO Retreat
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-[#f8ecee] px-3 py-1.5 text-sm font-medium text-[#5b1e2e]">
              {admin?.fullname || "Executive"}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#431724] active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="overflow-hidden rounded-xl bg-white/70 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px]"
              >
                <div className={`h-1 bg-gradient-to-r ${card.accent}`} />
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5b1e2e]/60">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#220b13] sm:text-3xl">
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
                  Attendance manager
                </p>
                <h2 className="text-2xl font-black text-[#220b13]">
                  Registered attendees
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportTableToExcel}
                  className="inline-flex items-center gap-2 rounded-full border border-[#5b1e2e]/10 bg-white/60 px-4 py-2 text-sm font-semibold text-[#2a0d18] transition hover:bg-white/80 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  Export XLSX
                </button>
                <button
                  type="button"
                  onClick={exportTableToPdf}
                  className="inline-flex items-center gap-2 rounded-full bg-[#5b1e2e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#431724] active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#2a0d18]">
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterStatus)
                  }
                  className="rounded-lg border border-[#5b1e2e]/10 bg-white/80 px-3 py-2 text-sm outline-none focus:border-[#5b1e2e]/30 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                >
                  <option value="all">All</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, faculty..."
                  className="w-full rounded-lg border border-[#5b1e2e]/10 bg-white/80 px-4 py-2 text-sm outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white/90 focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                />
              </div>
            </div>

            <div className="mb-4 flex justify-end">
              <QrCodeScanner
                label="Scan QR code to confirm attendance"
                onScan={handleConfirmAttendee}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2 text-sm min-w-[1200px]">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-[#5b1e2e]/60">
                    <th className="px-4 py-2">S/N</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Faculty</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Visitor</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Registered On</th>
                    <th className="px-3 py-2">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-[#4d2a35]"
                      >
                        Loading attendees...
                      </td>
                    </tr>
                  ) : filteredAttendees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-[#4d2a35]"
                      >
                        No attendees match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((attendee, index) => (
                      <tr
                        key={attendee.id}
                        className="rounded-xl bg-white/60 shadow-sm hover:bg-white/80 transition"
                      >
                        <td className="rounded-l-xl px-4 py-3 font-mono text-sm font-semibold text-[#5b1e2e]/60">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#2a0d18]">
                          {attendee.fullname}
                        </td>
                        <td className="px-3 py-3 text-sm">{attendee.phone}</td>
                        <td className="px-3 py-3 text-sm">
                          {attendee.faculty || "Visitor"}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {attendee.department || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {attendee.level || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          {attendee.is_visitor ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-3">
                          {attendee.is_confirmed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-semibold text-[#92400e]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-[#5b1e2e]/40" />
                            <span className="text-xs text-[#4d2a35]">
                              {formatDate(attendee.registered_on || null)}
                            </span>
                          </div>
                        </td>
                        <td className="rounded-r-xl px-3 py-3">
                          <span className="block max-w-[80px] truncate font-mono text-xs text-[#5b1e2e]">
                            {attendee.qrcode}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#5b1e2e]/10 pt-4 text-sm text-[#4d2a35]">
              <span>
                Showing {filteredAttendees.length} of {attendees.length}{" "}
                attendees
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
