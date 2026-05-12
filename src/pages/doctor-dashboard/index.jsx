import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import patient from "../../api/client";
import i18n from "../../i18n/config";
import { appointmentStatusLabel } from "../../utils/statusLabel";
import DashboardShell from "../../components/DashboardShell";
import VerificationModal from "../../components/VerificationModal";
import PrescriptionForm from "../../components/PrescriptionForm";
import AccountProfileForm from "../../components/AccountProfileForm";
import { DashboardIcon, AppointmentIcon, FileIcon, ProfileIcon, IconWrapper } from "../../components/icons";
import Loader from "../../components/Loader";
import { useAuth } from "../../state/AuthContext";
import { useBrowserLocation } from "../../state/BrowserLocationContext";
import DoctorReplyModal from "./components/DoctorReplyModal";
import VideoCall from "../../components/VideoCall";
import Dropdown from "../../components/Dropdown";
import { DOCTOR_SIGNUP_SPECIALIZATIONS } from "../home/components/HomeConstants";
import { translateWorkerTrade } from "../../utils/workerTradeLabels";
import { resolveDeviceLocationForForm } from "../../utils/reverseGeocode";

const WEEKDAY_OPTIONS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DEFAULT_SLOT = { start: "09:00", end: "17:00" };
const PLATFORM_COMMISSION_RATE = 0.2;

const apptStatus = (a) => String(a?.status ?? "").toLowerCase();
const canUseVideo = (a) => {
  const s = apptStatus(a);
  return s === "accepted" || s === "in-progress";
};

const convertTo12Hour = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
};

const normalizeSingleAvailability = (slots = []) => {
  const matched = slots.find((slot) => WEEKDAY_OPTIONS.includes((slot?.day || "").trim().toLowerCase()));
  const matchedRange = slots.find(
    (slot) =>
      WEEKDAY_OPTIONS.includes((slot?.startDay || "").trim().toLowerCase()) &&
      WEEKDAY_OPTIONS.includes((slot?.endDay || "").trim().toLowerCase())
  );
  return [
    {
      startDay: (matchedRange?.startDay || matched?.day || "monday").toLowerCase(),
      endDay: (matchedRange?.endDay || matched?.day || "friday").toLowerCase(),
      start: matched?.start || DEFAULT_SLOT.start,
      end: matched?.end || DEFAULT_SLOT.end,
    },
  ];
};

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const { selectPresetLocation } = useBrowserLocation();

  const formatConsultationFee = useCallback(
    (fee) => {
      if (!fee || fee === 0) return t("common.free");
      return `PKR ${fee}`;
    },
    [t]
  );
  const [availability, setAvailability] = useState(normalizeSingleAvailability());
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    consultationFee: 0,
    bio: "",
    experienceYears: 0,
    specialization: "General Handyman",
    locationCity: "",
    locationAddress: "",
    locationLat: "",
    locationLng: "",
  });
  const [doctorSpecializations, setDoctorSpecializations] = useState(DOCTOR_SIGNUP_SPECIALIZATIONS);
  const [reviews, setReviews] = useState([]);
  const [replyModal, setReplyModal] = useState({ isOpen: false, reviewId: null, response: "" });
  const [prescriptionModal, setPrescriptionModal] = useState({ isOpen: false, appointment: null });
  const [videoCall, setVideoCall] = useState({ open: false, roomId: null });
  const [practiceGeoWorking, setPracticeGeoWorking] = useState(false);
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const { data } = await patient.get("/doctors/profile");
      setProfile(data);
      // Fetch latest specializations list
      try {
        const { data: specData } = await patient.get("/meta/doctor-specializations");
        if (Array.isArray(specData?.specializations) && specData.specializations.length > 0) {
          setDoctorSpecializations(specData.specializations);
        }
      } catch {
        // Keep bundled specializations
      }
      setEditForm({
        consultationFee: data.consultationFee || 0,
        bio: data.bio || "",
        experienceYears: data.experienceYears || 0,
        specialization: data.specialization || "General Handyman",
        locationCity: data.locationCity || "",
        locationAddress: data.locationAddress || "",
        locationLat: data.locationLat != null && data.locationLat !== "" ? String(data.locationLat) : "",
        locationLng: data.locationLng != null && data.locationLng !== "" ? String(data.locationLng) : "",
      });
      setAvailability(normalizeSingleAvailability(data.availability || []));
    } catch (error) {
      toast.error(error.response?.data?.message || i18n.t("dash.doctor.toast.loadProfileFail"));
    }
  };

  const fillPracticeLocationFromBrowser = async () => {
    if (!navigator.geolocation) {
      toast.error(t("auth.geoNotSupported"));
      return;
    }
    setPracticeGeoWorking(true);
    const toastId = toast.loading(t("auth.geoResolving"));
    try {
      const result = await resolveDeviceLocationForForm(i18n.language);
      toast.dismiss(toastId);
      if (!result) {
        toast.error(t("auth.geoDenied"));
        return;
      }
      setEditForm((p) => ({
        ...p,
        locationLat: String(result.lat),
        locationLng: String(result.lng),
        locationCity: result.locationCity || p.locationCity,
        locationAddress: result.locationAddress || p.locationAddress,
      }));
      toast.success(t("auth.geoSuccess"));
    } catch {
      toast.dismiss(toastId);
      toast.error(t("auth.geoDenied"));
    } finally {
      setPracticeGeoWorking(false);
    }
  };

  const saveProfile = async () => {
    try {
      const payload = {
        consultationFee: Number(editForm.consultationFee) || 0,
        bio: String(editForm.bio || "").trim(),
        experienceYears: Number(editForm.experienceYears) || 0,
        specialization: String(editForm.specialization || "").trim(),
        locationCity: String(editForm.locationCity || "").trim(),
        locationAddress: String(editForm.locationAddress || "").trim(),
        locationLat: editForm.locationLat === "" ? null : Number(editForm.locationLat),
        locationLng: editForm.locationLng === "" ? null : Number(editForm.locationLng),
      };
      if (payload.locationLat !== null && !Number.isFinite(payload.locationLat)) delete payload.locationLat;
      if (payload.locationLng !== null && !Number.isFinite(payload.locationLng)) delete payload.locationLng;
      
      await patient.put("/doctors/profile", payload);
      toast.success(t("dash.doctor.toast.profileUpdated"));
      if (payload.locationLat != null && payload.locationLng != null) {
        const line = [payload.locationCity, payload.locationAddress].filter(Boolean).join(", ");
        selectPresetLocation(payload.locationLat, payload.locationLng, line || undefined);
      }
      setEditMode(false);
      await loadProfile();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || t("dash.doctor.toast.profileUpdateFail");
      toast.error(errorMsg);
      console.error("Profile update error:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await patient.get("/doctors/appointments");
      setAppointments(data);
    } catch (error) {
      toast.error(error.response?.data?.message || i18n.t("dash.doctor.toast.loadBookingsFail"));
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await patient.get(`/reviews/doctor/${profile?.user?._id || "me"}`);
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews");
    }
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    try {
      await patient.put(`/reviews/${replyModal.reviewId}/respond`, { response: replyModal.response });
      toast.success(t("dash.doctor.toast.responseSent"));
      setReplyModal({ isOpen: false, reviewId: null, response: "" });
      fetchReviews();
    } catch (error) {
      toast.error(t("dash.doctor.toast.responseFail"));
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadProfile();
      await fetchAppointments();
      setLoading(false);
    };
    init();

    const interval = setInterval(fetchAppointments, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) fetchReviews();
  }, [profile]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return {
      today: appointments.filter((a) => {
        const appDate = new Date(a.date);
        return (
          appDate.getFullYear() === now.getFullYear() &&
          appDate.getMonth() === now.getMonth() &&
          appDate.getDate() === now.getDate()
        );
      }).length,
      week: appointments.filter((a) => new Date(a.date) >= startOfWeek).length,
      cancelled: appointments.filter((a) => a.status === "cancelled" || a.status === "rejected").length,
      completed: appointments.filter((a) => a.status === "completed").length,
    };
  }, [appointments]);

  const revenueStats = useMemo(() => {
    const fee = Number(profile?.consultationFee ?? 0);
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const gross = completedCount * fee;
    const yourShare = Math.round(gross * (1 - PLATFORM_COMMISSION_RATE) * 100) / 100;
    return { totalRevenue: gross, yourEarnings: yourShare };
  }, [appointments, profile]);

  const statCards = useMemo(
    () => [
      { label: t("dash.doctor.stats.totalRevenue"), value: `PKR ${revenueStats.totalRevenue}`, icon: FileIcon },
      { label: t("dash.doctor.stats.yourEarnings"), value: `PKR ${revenueStats.yourEarnings}`, icon: FileIcon },
      { label: t("dash.doctor.stats.todayBookings"), value: stats.today, icon: AppointmentIcon },
      { label: t("dash.doctor.stats.weekBookings"), value: stats.week, icon: AppointmentIcon },
      { label: t("dash.doctor.stats.cancelled"), value: stats.cancelled, icon: AppointmentIcon },
      { label: t("dash.doctor.stats.completed"), value: stats.completed, icon: AppointmentIcon },
    ],
    [t, revenueStats.totalRevenue, revenueStats.yourEarnings, stats.today, stats.week, stats.cancelled, stats.completed]
  );

  const videoReadyAppointments = useMemo(
    () => appointments.filter((a) => canUseVideo(a)).sort((x, y) => `${x.date} ${x.timeSlot}`.localeCompare(`${y.date} ${y.timeSlot}`)),
    [appointments]
  );

  const notifications = useMemo(() => {
    const list = [];
    appointments.forEach((a) => {
      if (a.status === "pending") {
        list.push({
          id: `new-${a._id}`,
          title: t("dash.doctor.notif.newBookingTitle"),
          message: t("dash.doctor.notif.newBookingBody", { name: a.patient?.name || "—" }),
          type: "alert",
          linkTab: "appointments",
        });
      }
    });
    reviews.forEach((r) => {
      if (!r.doctorResponse) {
        list.push({
          id: `rev-${r._id}`,
          title: t("dash.doctor.notif.newFeedbackTitle"),
          message: t("dash.doctor.notif.newFeedbackBody", { name: r.patient?.name || "—", rating: r.rating }),
          type: "info",
          linkTab: "reviews",
        });
      }
    });
    return list;
  }, [appointments, reviews, t]);

  const saveAvailability = async () => {
    try {
      await patient.put("/doctors/availability", { availability });
      toast.success(t("dash.doctor.toast.availabilityUpdated"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("dash.doctor.toast.availabilityFail"));
    }
  };

  const updateStatus = async (id, status) => {
    await patient.put(`/doctors/appointments/${id}/status`, { status });
    toast.success(t("dash.doctor.toast.bookingUpdated"));
    fetchAppointments();
  };

  const handleVideoCall = async (appointment) => {
    try {
      if (apptStatus(appointment) === "accepted") {
        await updateStatus(appointment._id, "in-progress");
      }
      setVideoCall({ open: true, roomId: appointment._id });
    } catch (error) {
      toast.error(error.response?.data?.message || t("dash.doctor.toast.videoFail"));
    }
  };

  const statusBadge = (status) => {
    if (status === "approved" || status === "accepted") return "bg-emerald-100 text-emerald-700";
    if (status === "in-progress") return "bg-indigo-100 text-indigo-700";
    if (status === "awaiting-payment") return "bg-orange-100 text-orange-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  if (profile?.user?.status === "suspended") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-amber-900">{t("dash.doctor.suspendedTitle")}</h2>
          <p className="mt-2 text-sm text-amber-800">{t("dash.doctor.suspendedBody")}</p>
          {profile?.user?.suspendedUntil && (
            <p className="mt-3 text-xs text-amber-700">
              {t("dash.doctor.suspensionEnds")}{" "}
              <span className="font-semibold">{new Date(profile.user.suspendedUntil).toLocaleString()}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (profile?.user?.status === "blocked") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-rose-900">{t("dash.doctor.blockedTitle")}</h2>
          <p className="mt-2 text-sm text-rose-800">{t("dash.doctor.blockedBody")}</p>
        </div>
      </div>
    );
  }

  if (profile?.status !== "approved") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <VerificationModal isOpen={true} onAction={() => navigate("/")} />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-400">{t("dash.doctor.accessRestricted")}</h2>
          <p className="mt-2 text-sm text-slate-400">{t("dash.doctor.waitApproval")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardShell
        title={t("dash.doctor.title")}
        subtitle={t("dash.doctor.subtitle")}
        notifications={notifications}
        navItems={[
          { id: "dashboard", label: t("dash.doctor.nav.dashboard"), icon: DashboardIcon },
          {
            id: "appointments",
            label: t("dash.doctor.nav.appointments"),
            icon: AppointmentIcon,
            hasNotification: appointments.some((a) => apptStatus(a) === "pending" || canUseVideo(a)),
          },
          { id: "reviews", label: t("dash.doctor.nav.reviews"), icon: FileIcon },
          { id: "profile", label: t("dash.doctor.nav.profile"), icon: ProfileIcon },
        ]}
      >
        {(activeTab) => (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {statCards.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <IconWrapper>
                          <item.icon />
                        </IconWrapper>
                        <div>
                          <p className="text-2xl font-bold text-cyan-700">{item.value}</p>
                          <p className="text-xs text-slate-600">{item.label}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>

                {videoReadyAppointments.length > 0 && (
                  <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900">{t("dash.doctor.videoSectionTitle")}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t("dash.doctor.videoSectionHint")}</p>
                    <ul className="mt-4 space-y-3">
                      {videoReadyAppointments.map((a) => (
                        <li
                          key={a._id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{a.patient?.name || t("dash.doctor.tablePatient")}</p>
                            <p className="text-xs text-slate-500">
                              {a.date} {a.timeSlot} · <span className="capitalize">{appointmentStatusLabel(apptStatus(a), t)}</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                              onClick={() => handleVideoCall(a)}
                            >
                              {apptStatus(a) === "in-progress" ? t("dash.doctor.rejoinVideo") : t("dash.doctor.videoCall")}
                            </button>
                            <button
                              type="button"
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${apptStatus(a) === "in-progress" ? "bg-rose-600 hover:bg-rose-500" : "bg-brand-600 hover:bg-brand-500"}`}
                              onClick={() => updateStatus(a._id, "awaiting-payment")}
                            >
                              {apptStatus(a) === "in-progress" ? t("dash.doctor.endCall") : t("dash.doctor.complete")}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">{t("dash.doctor.availabilityTitle")}</h3>
                    <div className="text-xs text-slate-500">{t("dash.doctor.availabilityHint")}</div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{t("dash.doctor.workingDays")}</label>
                      <div className="flex flex-wrap items-center gap-3">
                        <Dropdown
                          options={WEEKDAY_OPTIONS.map((d) => ({ value: d, label: t(`dash.doctor.weekdays.${d}`) }))}
                          value={availability[0]?.startDay || "monday"}
                          onChange={(val) => setAvailability((p) => [{ ...(p[0] || DEFAULT_SLOT), startDay: val.toLowerCase() }])}
                          className="w-32 h-10 capitalize"
                        />

                        <span className="text-slate-400 font-medium">{t("dash.doctor.to")}</span>

                        <Dropdown
                          options={WEEKDAY_OPTIONS.map((d) => ({ value: d, label: t(`dash.doctor.weekdays.${d}`) }))}
                          value={availability[0]?.endDay || "friday"}
                          onChange={(val) => setAvailability((p) => [{ ...(p[0] || DEFAULT_SLOT), endDay: val.toLowerCase() }])}
                          className="w-32 h-10 capitalize"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{t("dash.doctor.workingHours")}</label>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={availability[0]?.start || DEFAULT_SLOT.start}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all"
                            onChange={(e) => setAvailability((p) => [{ ...(p[0] || { day: "monday" }), start: e.target.value }])}
                          />
                          <span className="text-slate-400 font-medium">{t("dash.doctor.to")}</span>
                          <input
                            type="time"
                            value={availability[0]?.end || DEFAULT_SLOT.end}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all"
                            onChange={(e) => setAvailability((p) => [{ ...(p[0] || { day: "monday" }), end: e.target.value }])}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-sm font-medium text-slate-700 mb-2">{t("dash.doctor.currentSchedule")}</div>
                      <div className="text-sm text-slate-600">
                        {t(`dash.doctor.weekdays.${availability[0]?.startDay || "monday"}`)} {t("dash.doctor.to")}{" "}
                        {t(`dash.doctor.weekdays.${availability[0]?.endDay || "friday"}`)}, {convertTo12Hour(availability[0]?.start)} -{" "}
                        {convertTo12Hour(availability[0]?.end)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-sm font-bold text-white hover:from-brand-700 hover:to-brand-600 transition-all shadow-lg shadow-brand-100 active:scale-95"
                    onClick={saveAvailability}
                  >
                    {t("dash.doctor.saveAvailability")}
                  </button>
                </section>
              </div>
            )}

            {activeTab === "appointments" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{t("dash.doctor.bookingsTitle")}</h3>
                {appointments.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">{t("dash.doctor.noBookings")}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-start text-sm">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="px-4 py-3">{t("dash.doctor.tablePatient")}</th>
                          <th className="px-4 py-3">{t("dash.doctor.tableDateTime")}</th>
                          <th className="px-4 py-3">{t("dash.doctor.tableStatus")}</th>
                          <th className="px-4 py-3">{t("dash.doctor.tableActions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a._id} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3">{a.patient?.name}</td>
                            <td className="px-4 py-3">
                              {a.date} {a.timeSlot}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>
                                {appointmentStatusLabel(a.status, t)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {apptStatus(a) === "pending" && (
                                  <>
                                    <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "accepted")}>
                                      {t("dash.doctor.accept")}
                                    </button>
                                    <button className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "rejected")}>
                                      {t("dash.doctor.reject")}
                                    </button>
                                  </>
                                )}
                                {canUseVideo(a) && (
                                  <>
                                    <button
                                      className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                                      type="button"
                                      onClick={() => handleVideoCall(a)}
                                    >
                                      {apptStatus(a) === "in-progress" ? t("dash.doctor.rejoinVideo") : t("dash.doctor.videoCall")}
                                    </button>
                                    <button
                                      className={`rounded px-2 py-1 text-xs font-semibold text-white ${apptStatus(a) === "in-progress" ? "bg-rose-600" : "bg-brand-600"}`}
                                      type="button"
                                      onClick={() => updateStatus(a._id, "awaiting-payment")}
                                    >
                                      {apptStatus(a) === "in-progress" ? t("dash.doctor.endCall") : t("dash.doctor.complete")}
                                    </button>
                                    <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => setPrescriptionModal({ isOpen: true, appointment: a })}>
                                      {t("dash.doctor.prescription")}
                                    </button>
                                  </>
                                )}
                                {apptStatus(a) === "completed" && (
                                  <>
                                    <button className="cursor-default rounded bg-emerald-100 border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700" type="button">
                                      ✓ {t("dash.doctor.paymentReceived")}
                                    </button>
                                    <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => setPrescriptionModal({ isOpen: true, appointment: a })}>
                                      {t("dash.doctor.prescription")}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <AccountProfileForm
                  refreshUser={refreshUser}
                  onSaved={loadProfile}
                  idPrefix="doctor-acct"
                  title={t("dash.doctor.accountSectionTitle")}
                  description={t("dash.doctor.accountSectionDesc")}
                />
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{t("dash.doctor.listingTitle")}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t("dash.doctor.listingSubtitle")}</p>
                  </div>
                  {!editMode ? (
                    <button onClick={() => setEditMode(true)} className="rounded-lg bg-indigo-50 text-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-100 transition-colors shrink-0">
                      {t("dash.doctor.editListing")}
                    </button>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setEditForm({
                            consultationFee: profile?.consultationFee || 0,
                            bio: profile?.bio || "",
                            experienceYears: profile?.experienceYears || 0,
                            specialization: profile?.specialization || "General Handyman",
                            locationCity: profile?.locationCity || "",
                            locationAddress: profile?.locationAddress || "",
                            locationLat: profile?.locationLat != null ? String(profile.locationLat) : "",
                            locationLng: profile?.locationLng != null ? String(profile.locationLng) : "",
                          });
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {t("dash.doctor.cancel")}
                      </button>
                      <button onClick={saveProfile} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
                        {t("dash.doctor.saveListing")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t("dash.doctor.verification")}</h4>
                      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                        {!editMode ? (
                          <>
                            <p className="text-sm">
                              <span className="font-semibold text-slate-700">{t("dash.doctor.specialization")}:</span>{" "}
                              {translateWorkerTrade(t, profile?.specialization)}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className="font-semibold text-slate-700 text-sm me-2">{t("dash.doctor.accountStatus")}:</span>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(profile?.status)}`}>
                                {appointmentStatusLabel(profile?.status, t)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("dash.doctor.specialization")}</label>
                              <Dropdown
                                options={doctorSpecializations.map((spec) => ({
                                  value: spec,
                                  label: translateWorkerTrade(t, spec),
                                }))}
                                value={editForm.specialization || "General Handyman"}
                                onChange={(val) => setEditForm({ ...editForm, specialization: val })}
                                className="w-full h-10"
                              />
                            </div>
                            <div className="flex items-center mt-2">
                              <span className="font-semibold text-slate-700 text-sm me-2">{t("dash.doctor.accountStatus")}:</span>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(profile?.status)}`}>
                                {appointmentStatusLabel(profile?.status, t)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t("dash.doctor.serviceDetails")}</h4>
                      <div className="rounded-xl border border-slate-200 p-4">
                        {!editMode ? (
                          <>
                            <p className="text-sm">
                              <span className="font-semibold text-slate-700">{t("dash.doctor.experienceLabel")}:</span> {profile?.experienceYears}{" "}
                              {t("dash.doctor.yearsUnit")}
                            </p>
                            <p className="text-sm mt-2">
                              <span className="font-semibold text-slate-700">{t("dash.doctor.serviceRateLabel")}:</span> {formatConsultationFee(profile?.consultationFee)}
                            </p>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("dash.doctor.experienceYears")}</label>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={editForm.experienceYears}
                                onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">{t("dash.doctor.serviceRate")}</label>
                              <input
                                type="number"
                                className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={editForm.consultationFee}
                                onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("dash.doctor.practiceLocationTitle")}</h4>
                      <div className="rounded-xl border border-slate-200 p-4">
                        {!editMode ? (
                          <div className="text-sm text-slate-600">
                            <p>
                              {[profile?.locationCity, profile?.locationAddress].filter(Boolean).join(" · ") ||
                                t("dash.doctor.practiceLocationUnset")}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700">{t("dash.accountForm.locationCity")}</label>
                              <input
                                type="text"
                                className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={editForm.locationCity}
                                onChange={(e) => setEditForm({ ...editForm, locationCity: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700">{t("dash.accountForm.locationAddress")}</label>
                              <input
                                type="text"
                                className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                value={editForm.locationAddress}
                                onChange={(e) => setEditForm({ ...editForm, locationAddress: e.target.value })}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => void fillPracticeLocationFromBrowser()}
                              disabled={practiceGeoWorking}
                              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {practiceGeoWorking ? t("auth.geoResolving") : t("auth.useMyLocation")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{t("dash.doctor.bioTitle")}</h4>
                    <div className="h-[calc(100%-1.5rem)] rounded-xl border border-slate-200 p-4">
                      {!editMode ? (
                        <p className="whitespace-pre-wrap text-sm text-slate-600">{profile?.bio || t("dash.doctor.noBio")}</p>
                      ) : (
                        <textarea
                          className="h-full min-h-[150px] w-full resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          placeholder={t("dash.doctor.bioPlaceholder")}
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>
              </div>
            )}

            {activeTab === "reviews" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">{t("dash.doctor.reviewsTitle")}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-amber-500">★ {profile?.averageRating?.toFixed(1) || "5.0"}</span>
                    <span className="text-sm text-slate-500">({t("dash.doctor.reviewsCountOnly", { count: profile?.numReviews || 0 })})</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  {reviews.length === 0 ? (
                    <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500 shadow-sm border border-slate-200">{t("dash.doctor.noReviews")}</div>
                  ) : (
                    reviews.map((rev) => (
                      <article key={rev._id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900">{rev.patient?.name}</h4>
                            <div className="flex text-amber-400 text-xs mt-0.5">
                              {[...Array(rev.rating)].map((_, i) => (
                                <span key={i}>★</span>
                              ))}
                              {[...Array(5 - rev.rating)].map((_, i) => (
                                <span key={i} className="text-slate-200">
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>

                        <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl">
                          &quot;{rev.patientComment || t("dash.doctor.noComment")}&quot;
                        </p>

                        {rev.doctorResponse ? (
                          <div className="mt-4 ms-6 border-s-2 border-brand-200 ps-4 py-1">
                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">{t("dash.doctor.yourResponse")}</p>
                            <p className="text-sm text-slate-700">{rev.doctorResponse}</p>
                          </div>
                        ) : (
                          <button onClick={() => setReplyModal({ isOpen: true, reviewId: rev._id, response: "" })} className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                            {t("dash.doctor.writeResponse")}
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </DashboardShell>

      <DoctorReplyModal replyModal={replyModal} setReplyModal={setReplyModal} onSubmit={submitResponse} />

      {prescriptionModal.isOpen && (
        <PrescriptionForm
          appointment={prescriptionModal.appointment}
          onClose={() => setPrescriptionModal({ isOpen: false, appointment: null })}
          onSubmitSuccess={() => {
            setPrescriptionModal({ isOpen: false, appointment: null });
          }}
        />
      )}

      <VideoCall
        open={videoCall.open}
        roomId={videoCall.roomId}
        role="doctor"
        onClose={() => setVideoCall({ open: false, roomId: null })}
      />
    </>
  );
};

export default DoctorDashboard;
