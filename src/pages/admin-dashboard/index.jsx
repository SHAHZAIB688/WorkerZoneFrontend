import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../api/client";
import DashboardShell from "../../components/DashboardShell";
import AccountProfileForm from "../../components/AccountProfileForm";
import { AppointmentIcon, DashboardIcon, DoctorIcon, FileIcon, SettingsIcon, UsersIcon } from "../../components/icons";
import Loader from "../../components/Loader";
import { useAuth } from "../../state/AuthContext";
import AdminStatsCards from "./components/AdminStatsCards";
import { appointmentStatusLabel } from "../../utils/statusLabel";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea"];

const roleLabel = (role, t) => {
  const r = String(role || "").toLowerCase();
  if (r === "patient") return t("dash.shell.rolePatient");
  if (r === "doctor") return t("dash.shell.roleDoctor");
  if (r === "admin") return t("dash.shell.roleAdmin");
  return role || "—";
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [
        { data: statData },
        { data: usersData },
        { data: applicationsData },
        { data: approvedDoctorsData },
        { data: appointmentsData },
      ] = await Promise.all([
        patient.get("/admin/stats"),
        patient.get("/admin/users"),
        patient.get("/admin/doctor-applications"),
        patient.get("/admin/approved-doctors"),
        patient.get("/admin/appointments"),
      ]);
      setStats(statData);
      setUsers(usersData);
      setApplications(applicationsData);
      setApprovedDoctors(approvedDoctorsData);
      setAppointments(appointmentsData);
      setChartKey((prev) => prev + 1);
    } catch (error) {
      toast.error(t("dash.admin.toast.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateApplicationStatus = async (id, status) => {
    const confirmMsg = status === "approved" ? t("dash.admin.toast.confirmApprove") : t("dash.admin.toast.confirmReject");
    if (!window.confirm(confirmMsg)) return;
    await patient.patch(`/admin/doctor-applications/${id}/status`, { status });
    toast.success(status === "approved" ? t("dash.admin.toast.applicationApproved") : t("dash.admin.toast.applicationRejected"));
    load();
  };

  const blockDoctor = async (id) => {
    if (!window.confirm(t("dash.admin.toast.blockConfirm"))) return;
    await patient.patch(`/admin/approved-doctors/${id}/block`);
    toast.success(t("dash.admin.toast.doctorBlocked"));
    load();
  };

  const suspendDoctor = async (id) => {
    const hoursRaw = window.prompt(t("dash.admin.toast.suspendPrompt"), "24");
    if (hoursRaw === null) return;
    const hours = Number(hoursRaw);
    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error(t("dash.admin.toast.invalidHours"));
      return;
    }
    const reason = window.prompt(t("dash.admin.toast.suspendReason"), t("dash.admin.toast.suspendReasonDefault"));
    await patient.patch(`/admin/approved-doctors/${id}/suspend`, { hours, reason: reason || "" });
    toast.success(t("dash.admin.toast.doctorSuspended"));
    load();
  };

  const unsuspendDoctor = async (id) => {
    if (!window.confirm(t("dash.admin.toast.unsuspendConfirm"))) return;
    await patient.patch(`/admin/approved-doctors/${id}/unsuspend`);
    toast.success(t("dash.admin.toast.suspensionRemoved"));
    load();
  };

  const statusBadge = (status) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const verificationChartData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const months = Array.from({ length: 5 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        month: monthFormatter.format(date).toUpperCase(),
        approved: 0,
        rejected: 0,
      };
    });
    const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));

    [...applications, ...approvedDoctors].forEach((item) => {
      if (!item?.createdAt) return;
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) return;
      if (item.status === "approved") monthMap[key].approved += 1;
      if (item.status === "rejected") monthMap[key].rejected += 1;
    });

    return months;
  }, [applications, approvedDoctors]);

  const coreStatsCards = useMemo(() => {
    const pct = stats?.commissionRatePercent ?? 20;
    return [
      { label: t("dash.admin.stats.totalRevenue"), value: `PKR ${stats?.totalRevenue ?? 0}`, icon: FileIcon },
      { label: t("dash.admin.stats.commission", { pct }), value: `PKR ${stats?.platformCommission ?? 0}`, icon: FileIcon },
      { label: t("dash.admin.stats.activeDoctors"), value: stats?.activeDoctors ?? 0, icon: DoctorIcon },
      { label: t("dash.admin.stats.inactiveDoctors"), value: stats?.inactiveDoctors ?? 0, icon: DoctorIcon },
    ];
  }, [stats, t]);

  const appointmentDonutData = useMemo(() => {
    const base = stats?.statusAnalytics || [];
    if (!base.length) return [{ status: "_none", displayName: t("dash.admin.charts.noData"), count: 1, fill: "#cbd5e1" }];
    return base.map((item, index) => ({
      ...item,
      displayName: appointmentStatusLabel(item.status, t),
      fill: COLORS[index % COLORS.length],
    }));
  }, [stats, t]);

  const attendanceData = useMemo(() => {
    const approved = approvedDoctors.length;
    const rejected = applications.filter((app) => app.status === "rejected").length;
    const total = approved + rejected;
    const present = total > 0 ? Math.round((approved / total) * 100) : 0;
    return {
      percent: present,
      chart: [
        { name: t("dash.admin.charts.present"), value: present, fill: "#5B3F99" },
        { name: t("dash.admin.charts.absent"), value: 100 - present, fill: "#F1692F" },
      ],
    };
  }, [approvedDoctors, applications, t]);

  return (
    <DashboardShell
      title={t("dash.admin.title")}
      subtitle={t("dash.admin.subtitle")}
      navItems={[
        { id: "dashboard", label: t("dash.admin.nav.dashboard"), icon: DashboardIcon },
        {
          id: "applications",
          label: t("dash.admin.nav.applications"),
          icon: FileIcon,
          hasNotification: applications.some((a) => a.status === "pending"),
        },
        { id: "approved", label: t("dash.admin.nav.approved"), icon: DoctorIcon },
        { id: "users", label: t("dash.admin.nav.users"), icon: UsersIcon },
        { id: "appointments", label: t("dash.admin.nav.appointments"), icon: AppointmentIcon },
        { id: "settings", label: t("dash.admin.nav.settings"), icon: SettingsIcon },
      ]}
    >
      {(activeTab) => (
        <>
          {loading && (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
              <Loader />
            </div>
          )}

          {!loading && activeTab === "dashboard" && (
            <div className="grid gap-4">
              {stats && <AdminStatsCards items={coreStatsCards} />}

              <section className="grid gap-4 lg:grid-cols-3">
                <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">{t("dash.admin.charts.bookings")}</h3>
                  <div className="relative flex-1" style={{ minHeight: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart key={`status-${chartKey}`}>
                        <Pie
                          data={appointmentDonutData}
                          dataKey="count"
                          nameKey="displayName"
                          outerRadius={95}
                          innerRadius={65}
                          isAnimationActive
                          animationDuration={900}
                          stroke="none"
                        >
                          {appointmentDonutData.map((entry, index) => (
                            <Cell key={`${entry.displayName || entry.status}-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.charts.verificationRatio")}</h3>
                  </div>
                  <div className="mb-4 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#5B3F99]" />
                      {t("dash.admin.charts.present")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F1692F]" />
                      {t("dash.admin.charts.absent")}
                    </span>
                  </div>
                  <div className="relative flex-1" style={{ minHeight: 235 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceData.chart}
                          dataKey="value"
                          outerRadius={95}
                          innerRadius={65}
                          isAnimationActive
                          animationDuration={1000}
                          stroke="none"
                        >
                          {attendanceData.chart.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-slate-900">{attendanceData.percent}%</span>
                    </div>
                  </div>
                </article>

                <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-slate-900">{t("dash.admin.charts.performance")}</h3>
                  <div className="relative flex-1" style={{ minHeight: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={verificationChartData} margin={{ left: -18, right: 0, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "transparent" }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Bar dataKey="approved" name={t("dash.admin.charts.approved")} fill="#5B3F99" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="rejected" name={t("dash.admin.charts.rejected")} fill="#F1692F" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.patientAnalytics")}</h3>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.newPatientsToday")}</span>
                      <b>{stats.patientAnalytics?.newPatientsToday ?? 0}</b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.newPatientsMonth")}</span>
                      <b>{stats.patientAnalytics?.newPatientsMonth ?? 0}</b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.returningPatients")}</span>
                      <b>{stats.patientAnalytics?.returningPatients ?? 0}</b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.growthRate")}</span>
                      <b>{stats.patientAnalytics?.growthRate ?? 0}%</b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.genderDistribution")}</span>
                      <b>
                        {t("dash.admin.maleFemale", {
                          m: stats.patientAnalytics?.genderDistribution?.male ?? 0,
                          f: stats.patientAnalytics?.genderDistribution?.female ?? 0,
                        })}
                      </b>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.doctorPerformance")}</h3>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.averageRating")}</span>
                      <b>{stats.doctorPerformance?.averageDoctorRating ?? 0}</b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.availability")}</span>
                      <b>
                        {t("dash.admin.doctorsAvailable", {
                          n: stats.doctorPerformance?.doctorAvailabilityStatus?.availableDoctors ?? 0,
                        })}
                      </b>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{t("dash.admin.pendingVerifications")}</span>
                      <b>{stats.doctorPerformance?.pendingDoctorVerifications ?? 0}</b>
                    </div>
                    {(stats.doctorPerformance?.topPerformingDoctors || []).slice(0, 3).map((doc) => (
                      <div key={doc.doctorId} className="flex justify-between rounded-lg bg-slate-100 p-2">
                        <span>{doc.name}</span>
                        <b>{t("dash.admin.jobsCount", { count: doc.count })}</b>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.monthlyTrend")}</h3>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={stats.monthlyAppointmentTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="appointments" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.revenueGrowth")}</h3>
                  <div style={{ width: "100%", height: 250 }}>
                    <ResponsiveContainer>
                      <AreaChart data={stats.monthlyEarningsTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="#86efac" fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{t("dash.admin.bookingInsights")}</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.peakHours")} <b>{stats.appointmentInsights?.peakBookingHour || "N/A"}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.mostBooked")} <b>{stats.appointmentInsights?.mostBookedSpecialization || "N/A"}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.avgDuration")}{" "}
                      <b>{t("dash.admin.mins", { n: stats.appointmentInsights?.averageAppointmentDuration || 0 })}</b>
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{t("dash.admin.financialStats")}</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.totalBookingRevenue")} <b>PKR {stats?.totalRevenue ?? 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.platformCommissionLine", { pct: stats?.commissionRatePercent ?? 20 })}{" "}
                      <b>PKR {stats.financialStats?.platformCommission ?? stats?.platformCommission ?? 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.doctorPayouts", { pct: 100 - (stats?.commissionRatePercent ?? 20) })}{" "}
                      <b>PKR {stats.financialStats?.doctorPayoutTotal ?? stats?.doctorPayoutTotal ?? 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.dailyRevenue")} <b>PKR {stats.financialStats?.dailyEarnings || 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.monthlyRevenue")} <b>PKR {stats.financialStats?.monthlyEarnings || 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.cashOnline")}{" "}
                      <b>
                        {stats.financialStats?.paymentMethods?.cash || 0}/{stats.financialStats?.paymentMethods?.online || 0}
                      </b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.pendingPayments")} <b>{stats.financialStats?.pendingPayments || 0}</b>
                    </p>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{t("dash.admin.systemActivity")}</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.loginsToday")} <b>{stats.systemActivity?.totalLoginsToday || 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.activeUsers")} <b>{stats.systemActivity?.activeUsersRightNow || 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.failedLogins")} <b>{stats.systemActivity?.failedLoginAttempts || 0}</b>
                    </p>
                    <p className="rounded-lg bg-slate-100 p-2">
                      {t("dash.admin.notificationsSent")} <b>{stats.systemActivity?.notificationsSent || 0}</b>
                    </p>
                  </div>
                </article>
              </section>
            </div>
          )}

          {!loading && activeTab === "applications" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.applicationsTitle")}</h3>
              {applications.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{t("dash.admin.noApplications")}</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-start text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3">{t("dash.admin.tableName")}</th>
                        <th className="px-4 py-3">{t("dash.admin.tableEmail")}</th>
                        <th className="px-4 py-3">{t("dash.admin.tableCategory")}</th>
                        <th className="px-4 py-3">{t("dash.admin.tableCert")}</th>
                        <th className="px-4 py-3">{t("dash.admin.tableStatus")}</th>
                        <th className="px-4 py-3">{t("dash.admin.tableActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((item) => (
                        <tr key={item._id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3">{item.user?.name}</td>
                          <td className="px-4 py-3">{item.user?.email}</td>
                          <td className="px-4 py-3">{item.specialization}</td>
                          <td className="px-4 py-3">
                            <a className="text-brand-700 underline" href={buildBackendAssetUrl(item.degreeFile)} target="_blank" rel="noreferrer">
                              {t("dash.admin.tableView")}
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                              {appointmentStatusLabel(item.status, t)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button type="button" className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => updateApplicationStatus(item._id, "approved")}>
                                {t("dash.admin.approve")}
                              </button>
                              <button type="button" className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => updateApplicationStatus(item._id, "rejected")}>
                                {t("dash.admin.reject")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === "approved" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.approvedTitle")}</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-start text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">{t("dash.admin.tableName")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableEmail")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableCategory")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableStatus")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedDoctors.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{item.user?.name}</td>
                        <td className="px-4 py-3">{item.user?.email}</td>
                        <td className="px-4 py-3">{item.specialization}</td>
                        <td className="px-4 py-3">
                          {item.user?.status === "suspended" ? (
                            <div className="space-y-1">
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                {appointmentStatusLabel("temporarily_suspended", t)}
                              </span>
                              {item.user?.suspendedUntil && (
                                <p className="text-[11px] text-slate-500">
                                  {t("dash.admin.until")} {new Date(item.user.suspendedUntil).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {appointmentStatusLabel("approved", t)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {item.user?.status === "suspended" ? (
                              <button
                                type="button"
                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                                onClick={() => unsuspendDoctor(item._id)}
                              >
                                {t("dash.admin.removeSuspend")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded bg-amber-600 px-2 py-1 text-xs font-semibold text-white"
                                onClick={() => suspendDoctor(item._id)}
                              >
                                {t("dash.admin.tempBlock")}
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() => blockDoctor(item._id)}
                            >
                              {t("dash.admin.permBlock")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === "users" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.usersTitle")}</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-start text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">{t("dash.admin.tableName")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableEmail")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableRole")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">{roleLabel(u.role, t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && activeTab === "settings" && (
            <AccountProfileForm
              refreshUser={refreshUser}
              title={t("dash.admin.settingsTitle")}
              description={t("dash.admin.settingsDesc")}
              idPrefix="admin-acct"
              resolveAddressFromCoords={false}
            />
          )}

          {!loading && activeTab === "appointments" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{t("dash.admin.appointmentsTitle")}</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-start text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">{t("dash.admin.tablePatient")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableDoctor")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableDateTime")}</th>
                      <th className="px-4 py-3">{t("dash.admin.tableStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{a.patient?.name}</td>
                        <td className="px-4 py-3">{a.doctor?.name}</td>
                        <td className="px-4 py-3">
                          {a.date} {a.timeSlot}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>
                            {appointmentStatusLabel(a.status, t)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
