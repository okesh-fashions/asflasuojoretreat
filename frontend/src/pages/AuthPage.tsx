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
  Phone,
  Receipt,
  ExternalLink,
  X,
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
  payment_method: string;
  receipt_url?: string | null;
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
  // New payment stats
  paid_transfer: number; // bank_transfer and verified
  pending_verification: number; // bank_transfer but not verified
  cash_payment: number; // cash, unpaid
  expected_revenue: number; // sum of verified + pending amounts
};

type FilterStatus = "all" | "confirmed" | "pending";

const statsDefaults: DashboardStats = {
  total_attendees: 0,
  confirmed_attendees: 0,
  awaiting_confirmation: 0,
  visitor_count: 0,
  paid_transfer: 0,
  pending_verification: 0,
  cash_payment: 0,
  expected_revenue: 0,
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
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  );

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
      {
        label: "Paid transfer",
        value: stats.paid_transfer,
        accent: "from-[#059669] to-[#34d399]",
      },
      {
        label: "Pending verify",
        value: stats.pending_verification,
        accent: "from-[#ca8a04] to-[#facc15]",
      },
      {
        label: "Cash at venue",
        value: stats.cash_payment,
        accent: "from-[#b91c1c] to-[#ef4444]",
      },
      {
        label: "Expected ₦",
        value: stats.expected_revenue.toLocaleString("en-NG"),
        accent: "from-[#7c3aed] to-[#a855f7]",
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

  // Handle QR scan - this is where the confirmation happens
  const handleQrScan = async (qrString: string) => {
    try {
      // Add a small delay to ensure the QR code is properly processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Confirm the attendee
      const response = await api.post("/attendees/confirm", {
        qrcode: qrString,
      });

      const data = response.data;

      // Backend returns attendee in data.data, not data.attendee
      if (data.data) {
        const attendee = data.data;

        // Show success toast
        toast.success(`✓ ${attendee.fullname} confirmed!`);

        // Reload dashboard to reflect changes
        await loadDashboard();

        // Return attendee data for display in success modal
        return {
          fullname: attendee.fullname,
          phone: attendee.phone,
          is_visitor: attendee.is_visitor,
          is_confirmed: attendee.is_confirmed,
        };
      } else {
        const errorMsg = data.message || "Failed to confirm attendee";
        toast.error(errorMsg);
        return null;
      }
    } catch (error: any) {
      console.error("QR verification failed:", error);

      // Extract and show detailed error message
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify attendee. Please try again.";
      toast.error(errorMsg);

      // Return null on error - the component will handle error display
      return null;
    }
  };

  const exportTableToExcel = () => {
    const rows = attendees.map((attendee, index) => ({
      "S/N": index + 1,
      Name: attendee.fullname,
      Phone: attendee.phone,
      Faculty: attendee.faculty || "Visitor",
      Department: attendee.department || "N/A",
      Level: attendee.level || "N/A",
      Visitor: attendee.is_visitor ? "Yes" : "No",
      Status: attendee.is_confirmed ? "Confirmed" : "Pending",
      "Registered On": attendee.registered_on
        ? new Date(attendee.registered_on).toLocaleString("en-NG")
        : "N/A",
      "QR Code": attendee.qrcode,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set nice column widths so the file opens up readable
    worksheet["!cols"] = [
      { wch: 6 }, // S/N
      { wch: 28 }, // Name
      { wch: 15 }, // Phone
      { wch: 30 }, // Faculty
      { wch: 28 }, // Department
      { wch: 8 }, // Level
      { wch: 10 }, // Visitor
      { wch: 12 }, // Status
      { wch: 24 }, // Registered On
      { wch: 20 }, // QR Code
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
    XLSX.writeFile(workbook, "asf-retreat-attendees.xlsx");
  };

  const exportTableToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(91, 30, 46);
    doc.text("ASF LASU OJO Retreat — Attendees", 40, 40);

    // Subtitle with generated date
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-NG")}  •  Total: ${attendees.length}`,
      40,
      58,
    );

    autoTable(doc, {
      head: [
        [
          "S/N",
          "Name",
          "Phone",
          "Faculty",
          "Department",
          "Level",
          "Visitor",
          "Status",
          "Registered On",
        ],
      ],
      body: attendees.map((attendee, index) => [
        index + 1,
        attendee.fullname,
        attendee.phone,
        attendee.faculty || "Visitor",
        attendee.department || "N/A",
        attendee.level || "N/A",
        attendee.is_visitor ? "Yes" : "No",
        attendee.is_confirmed ? "Confirmed" : "Pending",
        attendee.registered_on
          ? new Date(attendee.registered_on).toLocaleString("en-NG")
          : "N/A",
      ]),
      startY: 80,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [91, 30, 46],
        textColor: 255,
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [248, 236, 238],
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" },
        1: { cellWidth: 110 },
        2: { cellWidth: 70 },
        3: { cellWidth: 100 },
        4: { cellWidth: 100 },
        5: { cellWidth: 40, halign: "center" },
        6: { cellWidth: 45, halign: "center" },
        7: { cellWidth: 65, halign: "center" },
        8: { cellWidth: 90 },
      },
      margin: { left: 40, right: 40 },
      didParseCell: (data) => {
        // Color the Status column
        if (data.section === "body" && data.column.index === 7) {
          if (data.cell.raw === "Confirmed") {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // Footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}  •  ASF LASU OJO Retreat Registration`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" },
      );
    }

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
    const date = new Date(dateString);
    // Fix timezone offset by subtracting 1 hour (3600000 ms) to correct UTC+1 issue
    const correctedDate = new Date(date.getTime() - 3600000);
    return correctedDate.toLocaleDateString("en-US", {
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
                      placeholder="Your name"
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
          {/* KPI Cards */}
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

          {/* QR Scanner Section */}
          <section className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
            <div className="mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
                Quick Check-in
              </p>
              <h3 className="text-lg font-bold text-[#220b13]">
                Confirm Attendee by QR
              </h3>
            </div>
            <QrCodeScanner onScan={handleQrScan} />
          </section>

          {/* Attendance Manager */}
          <section className="rounded-2xl bg-white/70 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-[12px] sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5b1e2e]/60">
                  Attendance manager
                </p>
                <h2 className="text-xl font-black text-[#220b13] sm:text-2xl">
                  Registered attendees
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportTableToExcel}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#5b1e2e]/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#2a0d18] transition hover:bg-white hover:border-[#5b1e2e]/25 active:scale-95 sm:text-sm"
                  title="Export as Excel spreadsheet"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>XLSX</span>
                </button>
                <button
                  type="button"
                  onClick={exportTableToPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b1e2e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#431724] active:scale-95 sm:text-sm"
                  title="Export as PDF document"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterStatus)
                  }
                  className="appearance-none rounded-lg border border-[#5b1e2e]/10 bg-white/80 py-2 pl-3 pr-8 text-sm font-medium text-[#2a0d18] outline-none transition focus:border-[#5b1e2e]/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)] cursor-pointer"
                >
                  <option value="all">All status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5b1e2e]/60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className="relative flex-1 min-w-[200px]">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5b1e2e]/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, faculty..."
                  className="w-full rounded-lg border border-[#5b1e2e]/10 bg-white/80 py-2 pl-9 pr-3 text-sm text-[#2a0d18] outline-none transition placeholder:text-[#5b1e2e]/40 focus:border-[#5b1e2e]/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(91,30,46,0.05)]"
                />
              </div>

              {(statusFilter !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearch("");
                  }}
                  className="rounded-lg border border-[#5b1e2e]/10 bg-white/60 px-3 py-2 text-xs font-semibold text-[#5b1e2e] transition hover:bg-white active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-[#5b1e2e]/60 bg-[#5b1e2e]/5">
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">
                      S/N
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Phone
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Faculty
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Department
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Level
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Visitor
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Payment Method
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Registered On
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      QR
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">
                      Receipt
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-10 text-center text-sm text-[#4d2a35]"
                      >
                        Loading attendees...
                      </td>
                    </tr>
                  ) : filteredAttendees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-10 text-center text-sm text-[#4d2a35]"
                      >
                        No attendees match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((attendee, index) => (
                      <tr
                        key={attendee.id}
                        className="border-t border-[#5b1e2e]/10 hover:bg-[#5b1e2e]/[0.03] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#5b1e2e]/60">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#2a0d18] whitespace-nowrap">
                          {attendee.fullname}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.phone}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.faculty || "Visitor"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.department || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.level || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.is_visitor ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {attendee.is_confirmed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#dcfce7] px-2 py-1 text-[11px] font-bold text-[#166534]">
                              <CheckCircle2 className="h-3 w-3" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fef3c7] px-2 py-1 text-[11px] font-bold text-[#92400e]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          {attendee.payment_method === "bank_transfer"
                            ? "Bank Transfer"
                            : "Cash"}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4d2a35] whitespace-nowrap">
                          <div className="leading-tight">
                            <div className="font-semibold text-[#2a0d18]">
                              {
                                formatDate(
                                  attendee.registered_on || null,
                                ).split(",")[0]
                              }
                            </div>
                            <div className="text-[11px] text-[#5b1e2e]/60">
                              {formatDate(attendee.registered_on || null).split(
                                ",",
                              )[1] || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="block max-w-[100px] truncate font-mono text-[11px] text-[#5b1e2e]">
                            {attendee.qrcode}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {attendee.receipt_url ? (
                            <button
                              type="button"
                              onClick={() =>
                                setReceiptPreviewUrl(attendee.receipt_url!)
                              }
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#5b1e2e]/10 px-2.5 py-1 text-[11px] font-bold text-[#5b1e2e] transition hover:bg-[#5b1e2e]/20 active:scale-95"
                              title="View receipt"
                            >
                              <Receipt className="h-3 w-3" />
                              View
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#5b1e2e]/40">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <a
                            href={`tel:${attendee.phone}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5b1e2e] text-white transition hover:bg-[#431724] hover:scale-110 active:scale-95"
                            title={`Call ${attendee.fullname}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
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
      {/* Receipt Viewer Modal */}
      {receiptPreviewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#220b13]/90 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReceiptPreviewUrl(null);
            }
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between bg-[#5b1e2e] px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">Payment Receipt</h3>
                <p className="text-xs text-white/75">
                  Attendee's transfer proof
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative max-h-[70vh] overflow-auto rounded-xl bg-slate-50 p-2">
                <img
                  src={receiptPreviewUrl}
                  alt="Payment receipt"
                  className="mx-auto h-auto w-full rounded-lg object-contain"
                />
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href={receiptPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#5b1e2e]/15 bg-white px-4 py-3 text-sm font-semibold text-[#2a0d18] transition hover:bg-[#5b1e2e]/5 active:scale-[0.98]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Full
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptPreviewUrl(null)}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#5b1e2e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#431724] active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
