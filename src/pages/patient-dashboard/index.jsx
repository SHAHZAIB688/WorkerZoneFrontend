import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import patient from "../../api/client";
import i18n from "../../i18n/config";
import DashboardShell from "../../components/DashboardShell";
import { DashboardIcon, DoctorIcon, AppointmentIcon, FileIcon, PaymentIcon, SettingsIcon } from "../../components/icons";
import Loader from "../../components/Loader";
import { useAuth } from "../../state/AuthContext";
import PatientBookingModal from "./components/PatientBookingModal";
import PatientReviewModal from "./components/PatientReviewModal";
import PatientDashboardOverviewSection from "./components/PatientDashboardOverviewSection";
import PatientHealthSummarySection from "./components/PatientHealthSummarySection";
import PatientDoctorsSection from "./components/PatientDoctorsSection";
import PatientHistorySection from "./components/PatientHistorySection";
import PatientPaymentHistorySection from "./components/PatientPaymentHistorySection";
import PatientSettingsSection from "./components/PatientSettingsSection";
import VideoCall from "../../components/VideoCall";

const normalizeTimeSlot = (timeSlot) => {
  if (!timeSlot) return "";
  const [hours, minutes] = String(timeSlot).split(":");
  if (hours === undefined || minutes === undefined) return "";
  return `${String(Number(hours)).padStart(2, "0")}:${String(Number(minutes)).padStart(2, "0")}`;
};

const DEFAULT_HEALTH_SUMMARY = {
  bloodGroup: "",
  allergies: "",
  chronicDiseases: "",
  lastCheckup: "",
};

const PatientDashboard = () => {
  const { t } = useTranslation();

  const formatServiceFee = useCallback(
    (fee) => {
      if (!fee || fee === 0) return t("common.free");
      return `PKR ${fee}`;
    },
    [t]
  );

  const doctorLabel = useCallback((appointment) => appointment?.doctor?.name || t("dash.patient.yourDoctor"), [t]);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState({
    search: "",
    specialization: "all",
    nearMe: false,
    nearLat: null,
    nearLng: null,
  });
  const doctorFilterRef = useRef(doctorFilter);
  const [form, setForm] = useState({ doctorProfileId: "", date: "", timeSlot: "", reason: "" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, appointmentId: null, doctorName: "" });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, appointmentId: null, doctorName: "", rating: 5, comment: "" });
  const [videoCall, setVideoCall] = useState({ open: false, roomId: null });
  const [healthSummary, setHealthSummary] = useState(DEFAULT_HEALTH_SUMMARY);
  const [savingHealthSummary, setSavingHealthSummary] = useState(false);
  const prevAppointmentsRef = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    doctorFilterRef.current = doctorFilter;
  }, [doctorFilter]);

  const fetchDoctors = useCallback(async () => {
    const f = doctorFilterRef.current;
    const params = {};
    if (f.nearMe && f.nearLat != null && f.nearLng != null) {
      params.lat = f.nearLat;
      params.lng = f.nearLng;
      params.radiusKm = 100;
    }
    const { data } = await patient.get("/doctors", { params });
    setDoctors(data);
  }, []);

  const fetchHealthSummary = async () => {
    try {
      const { data } = await patient.get("/auth/me");
      const summary = data?.healthSummary || {};
      setHealthSummary({
        bloodGroup: summary.bloodGroup || "",
        allergies: summary.allergies || "",
        chronicDiseases: summary.chronicDiseases || "",
        lastCheckup: summary.lastCheckup || "",
      });
    } catch (error) {
      toast.error(i18n.t("dash.patient.toast.loadSummaryFail"));
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await patient.get("/appointments/my");

      if (prevAppointmentsRef.current.length > 0) {
        data.forEach((newAppt) => {
          const oldAppt = prevAppointmentsRef.current.find((a) => a._id === newAppt._id);
          if (oldAppt && oldAppt.status !== "in-progress" && newAppt.status === "in-progress") {
            toast.success(
              i18n.t("dash.patient.toast.inProgress", {
                doctor: newAppt.doctor?.name || i18n.t("dash.patient.yourDoctor"),
              }),
              { duration: 8000 }
            );
          }
        });
      }
      prevAppointmentsRef.current = data;
      setAppointments(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch appointments");
      return [];
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors, doctorFilter.nearMe, doctorFilter.nearLat, doctorFilter.nearLng]);

  useEffect(() => {
    fetchAppointments();
    fetchHealthSummary();

    const appointmentIntervalId = setInterval(fetchAppointments, 10000);
    const doctorIntervalId = setInterval(fetchDoctors, 30000);
    return () => {
      clearInterval(appointmentIntervalId);
      clearInterval(doctorIntervalId);
    };
  }, [fetchDoctors]);

  useEffect(() => {
    const verifyPaymentOnReturn = async () => {
      const params = new URLSearchParams(location.search);
      const paymentStatus = params.get("payment");
      const sessionId = params.get("session_id");
      const appointmentId = params.get("appointmentId");

      if (!paymentStatus) return;

      if (paymentStatus === "cancelled") {
        toast(i18n.t("dash.patient.toast.paymentCancelled"));
        navigate("/dashboard", { replace: true });
        return;
      }

      if (paymentStatus !== "success" || !sessionId || !appointmentId) {
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        await patient.post("/appointments/verify-payment", { sessionId, appointmentId });
        toast.success(i18n.t("dash.patient.toast.paymentVerified"));
        const refreshedAppointments = await fetchAppointments();
        const paidAppointment = refreshedAppointments.find((appt) => appt._id === appointmentId);
        if (paidAppointment) {
          setReviewModal({
            isOpen: true,
            appointmentId: paidAppointment._id,
            doctorName: paidAppointment.doctor?.name || i18n.t("dash.patient.unnamedDoctor"),
            rating: 5,
            comment: "",
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || i18n.t("dash.patient.toast.verifyFail"));
      } finally {
        navigate("/dashboard", { replace: true });
      }
    };

    verifyPaymentOnReturn();
  }, [location.search, navigate]);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!form.doctorProfileId || !form.date) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        // Format date to ensure YYYY-MM-DD format from input
        const dateStr = form.date;
        console.log(`Fetching slots for doctor ${form.doctorProfileId} on date ${dateStr}`);
        
        const { data } = await patient.get(`/doctors/available-slots/${form.doctorProfileId}`, {
          params: { date: dateStr },
        });
        
        console.log(`Received ${data.length} available slots:`, data);
        setAvailableSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching slots:", error);
        setAvailableSlots([]);
        const errorMsg = error.response?.data?.message || "Failed to load available time slots";
        toast.error(errorMsg);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [form.doctorProfileId, form.date]);

  const book = async (e) => {
    e.preventDefault();
    const normalizedTimeSlot = normalizeTimeSlot(form.timeSlot);
    if (!normalizedTimeSlot) {
      toast.error(t("dash.patient.toast.invalidSlot"));
      return;
    }

    const payload = {
      doctorProfileId: form.doctorProfileId,
      date: form.date,
      timeSlot: normalizedTimeSlot,
      reason: form.reason,
    };

    try {
      await patient.post("/appointments", payload);
      toast.success(t("dash.patient.toast.booked"));
      setForm({ doctorProfileId: "", date: "", timeSlot: "", reason: "" });
      setAvailableSlots([]);
      setBookingModalOpen(false);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || t("dash.patient.toast.bookingFail"));
    }
  };

  const cancel = async (id) => {
    await patient.put(`/appointments/${id}/cancel`);
    fetchAppointments();
  };

  const reschedule = async (id) => {
    const date = window.prompt(t("dash.patient.history.promptDate"));
    const timeSlot = window.prompt(t("dash.patient.history.promptTime"));
    if (!date || !timeSlot) return;
    await patient.put(`/appointments/${id}/reschedule`, { date, timeSlot });
    fetchAppointments();
  };

  const handleVideoCall = (appointment) => {
    if (appointment.status !== "in-progress") {
      const appointmentTime = new Date(`${appointment.date}T${appointment.timeSlot}:00`);
      const diffMins = (appointmentTime - new Date()) / (1000 * 60);
      if (diffMins > 5) {
        toast.error(t("dash.patient.toast.joinTooEarly"));
        return;
      }
    }
    setVideoCall({ open: true, roomId: appointment._id });
  };

  const openPaymentModal = async (id) => {
    try {
      const { data } = await patient.post(`/appointments/${id}/create-checkout-session`);
      if (!data?.url) {
        toast.error(t("dash.patient.toast.stripeInitFail"));
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.patient.toast.paymentFail"));
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await patient.post(`/appointments/${paymentModal.appointmentId}/create-checkout-session`);
      if (!data?.url) {
        toast.error(t("dash.patient.toast.stripeInitFail"));
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.patient.toast.paymentFail"));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await patient.post("/reviews", {
        appointmentId: reviewModal.appointmentId,
        rating: reviewModal.rating,
        comment: reviewModal.comment,
      });
      toast.success(t("dash.patient.toast.thankReview"));
      setReviewModal({ isOpen: false, appointmentId: null, doctorName: "", rating: 5, comment: "" });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.patient.toast.reviewFail"));
    }
  };

  const saveHealthSummary = async (e) => {
    e.preventDefault();
    setSavingHealthSummary(true);
    try {
      const payload = {
        bloodGroup: healthSummary.bloodGroup,
        allergies: healthSummary.allergies,
        chronicDiseases: healthSummary.chronicDiseases,
        lastCheckup: healthSummary.lastCheckup,
      };
      await patient.put("/auth/health-summary", payload);
      toast.success(t("dash.patient.toast.summaryUpdated"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("dash.patient.toast.summaryFail"));
    } finally {
      setSavingHealthSummary(false);
    }
  };

  const notifications = useMemo(() => {
    const list = [];
    appointments.forEach((a) => {
      if (a.status === "accepted") {
        list.push({
          id: `accepted-${a._id}`,
          title: t("dash.patient.notif.acceptedTitle"),
          message: t("dash.patient.notif.acceptedBody", { doctor: doctorLabel(a) }),
          type: "info",
          linkTab: "history",
        });
      }
      if (a.status === "in-progress") {
        list.push({
          id: `call-${a._id}`,
          title: t("dash.patient.notif.callTitle"),
          message: t("dash.patient.notif.callBody", { doctor: doctorLabel(a) }),
          type: "alert",
          linkTab: "history",
        });
      }
      if (a.status === "awaiting-payment") {
        list.push({
          id: `pay-${a._id}`,
          title: t("dash.patient.notif.payTitle"),
          message: t("dash.patient.notif.payBody", { fee: formatServiceFee(a.doctorProfile?.consultationFee || 2000) }),
          type: "info",
          linkTab: "payments",
        });
      }
      if (a.prescription) {
        list.push({
          id: `rx-${a._id}`,
          title: t("dash.patient.notif.rxTitle"),
          message: t("dash.patient.notif.rxBody", { doctor: doctorLabel(a) }),
          type: "info",
          linkTab: "history",
        });
      }
      if (a.review?.doctorResponse) {
        list.push({
          id: `rev-${a._id}`,
          title: t("dash.patient.notif.replyTitle"),
          message: t("dash.patient.notif.replyBody", { doctor: doctorLabel(a) }),
          type: "info",
          linkTab: "history",
        });
      }
    });
    return list;
  }, [appointments, t, formatServiceFee, doctorLabel]);

  const dashboardStats = useMemo(() => {
    const upcomingCount = appointments.filter((a) =>
      ["pending", "accepted", "in-progress", "awaiting-payment"].includes(a.status)
    ).length;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const serviceNotesCount = appointments.filter((a) => a.status === "completed" || Boolean(a.prescription)).length;

    return [
      { id: "upcoming", label: t("dash.patient.stats.upcoming"), value: upcomingCount, icon: AppointmentIcon },
      { id: "completed", label: t("dash.patient.stats.completed"), value: completedCount, icon: DashboardIcon },
      { id: "reports", label: t("dash.patient.stats.reports"), value: serviceNotesCount, icon: DoctorIcon },
    ];
  }, [appointments, t]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => ["pending", "accepted", "in-progress", "awaiting-payment"].includes(a.status))
      .sort((a, b) => new Date(`${a.date}T${a.timeSlot || "00:00"}:00`) - new Date(`${b.date}T${b.timeSlot || "00:00"}:00`))
      .find((a) => new Date(`${a.date}T${a.timeSlot || "00:00"}:00`) >= now);
  }, [appointments]);

  const doctorCategories = useMemo(() => {
    const categories = new Set(doctors.map((d) => d.specialization).filter(Boolean));
    return ["all", ...Array.from(categories)];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const searchText = doctorFilter.search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesCategory = doctorFilter.specialization === "all" || d.specialization === doctorFilter.specialization;
      const matchesSearch =
        !searchText ||
        d.user?.name?.toLowerCase().includes(searchText) ||
        d.specialization?.toLowerCase().includes(searchText);
      return matchesCategory && matchesSearch;
    });
  }, [doctors, doctorFilter]);

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <DashboardShell
        title={t("dash.patient.title")}
        subtitle={t("dash.patient.subtitle")}
        notifications={notifications}
        navItems={[
          { id: "dashboard", label: t("dash.patient.nav.dashboard"), icon: DashboardIcon },
          { id: "doctors", label: t("dash.patient.nav.doctors"), icon: DoctorIcon },
          { id: "health-summary", label: t("dash.patient.nav.healthSummary"), icon: AppointmentIcon },
          {
            id: "payments",
            label: t("dash.patient.nav.payments"),
            icon: PaymentIcon,
            hasNotification: appointments.some((a) => a.status === "awaiting-payment"),
          },
          {
            id: "history",
            label: t("dash.patient.nav.history"),
            icon: FileIcon,
            hasNotification: appointments.some((a) => a.status === "accepted" || a.status === "in-progress"),
          },
          { id: "settings", label: t("dash.patient.nav.settings"), icon: SettingsIcon },
        ]}
      >
        {(activeTab) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeTab === "dashboard" && (
              <PatientDashboardOverviewSection
                dashboardStats={dashboardStats}
                nextAppointment={nextAppointment}
                openPaymentModal={openPaymentModal}
                healthSummary={healthSummary}
              />
            )}

            {activeTab === "health-summary" && (
              <PatientHealthSummarySection
                healthSummary={healthSummary}
                setHealthSummary={setHealthSummary}
                saveHealthSummary={saveHealthSummary}
                savingHealthSummary={savingHealthSummary}
              />
            )}

            {activeTab === "doctors" && (
              <PatientDoctorsSection
                doctorFilter={doctorFilter}
                setDoctorFilter={setDoctorFilter}
                doctorCategories={doctorCategories}
                filteredDoctors={filteredDoctors}
                formatServiceFee={formatServiceFee}
                setForm={setForm}
                setBookingModalOpen={setBookingModalOpen}
              />
            )}

            {activeTab === "payments" && (
              <PatientPaymentHistorySection appointments={appointments} openPaymentModal={openPaymentModal} />
            )}

            {activeTab === "history" && (
              <PatientHistorySection
                appointments={appointments}
                openPaymentModal={openPaymentModal}
                handleVideoCall={handleVideoCall}
                reschedule={reschedule}
                cancel={cancel}
              />
            )}

            {activeTab === "settings" && <PatientSettingsSection refreshUser={refreshUser} />}
          </div>
        )}
      </DashboardShell>

      <PatientBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSubmit={book}
        form={form}
        setForm={setForm}
        doctors={doctors}
        availableSlots={availableSlots}
        loadingSlots={loadingSlots}
        normalizeTimeSlot={normalizeTimeSlot}
        setAvailableSlots={setAvailableSlots}
      />

      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t("dash.patient.stripeModal.title")}</h3>
            <p className="text-sm text-slate-500 mb-6">{t("dash.patient.stripeModal.subtitle", { name: paymentModal.doctorName })}</p>

            <form onSubmit={processPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("dash.patient.stripeModal.processor")}</label>
                <input
                  type="text"
                  value="Stripe"
                  disabled
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2 text-sm font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("dash.patient.stripeModal.cardInfo")}</label>
                <input
                  type="text"
                  placeholder={t("dash.patient.stripeModal.cardPh")}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t("dash.patient.stripeModal.expPh")}
                  className="rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <input
                  type="text"
                  placeholder={t("dash.patient.stripeModal.cvcPh")}
                  className="rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ isOpen: false, appointmentId: null, doctorName: "" })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t("dash.patient.stripeModal.cancel")}
                </button>
                <button type="submit" className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  {t("dash.patient.stripeModal.pay")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PatientReviewModal reviewModal={reviewModal} setReviewModal={setReviewModal} onSubmit={submitReview} />

      <VideoCall
        open={videoCall.open}
        roomId={videoCall.roomId}
        role="patient"
        onClose={() => setVideoCall({ open: false, roomId: null })}
      />
    </>
  );
};

export default PatientDashboard;
