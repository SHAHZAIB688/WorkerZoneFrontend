import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../api/client";
import Loader from "../../components/Loader";
import DoctorBookingModal from "../../components/DoctorBookingModal";
import { useAuth } from "../../state/AuthContext";
import DoctorReviewsSection from "./components/DoctorReviewsSection";
import { translateWorkerTrade } from "../../utils/workerTradeLabels";

const DoctorDetailsPage = () => {
  const { t } = useTranslation();
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);

  const formatConsultationFee = (fee) => {
    if (!fee || fee === 0) return t("common.free");
    return `PKR ${fee}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: doctorData } = await patient.get(`/doctors/${doctorId}`);
        setDoctor(doctorData);

        const doctorUserId = doctorData?.user?._id;
        if (doctorUserId) {
          const { data: reviewsData } = await patient.get(`/reviews/doctor/${doctorUserId}`);
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } else {
          setReviews([]);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || t("doctorDetail.loadError"));
        navigate("/doctors");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [doctorId, navigate]);

  const openBooking = () => {
    if (!user) {
      toast(t("doctorDetail.loginToBook"));
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      toast.error(t("doctorDetail.onlyClientsBook"));
      return;
    }
    setBookingOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader />
      </div>
    );
  }

  if (!doctor) return null;

  const unnamed = t("common.unnamedWorker");

  return (
    <div className="space-y-8 pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <img
              src={
                doctor.image
                  ? buildBackendAssetUrl(doctor.image)
                  : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || unnamed)}`
              }
              alt={doctor.user?.name || unnamed}
              className="h-72 w-full rounded-2xl bg-slate-100 object-cover"
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{doctor.user?.name}</h1>
              <p className="mt-1 text-base font-semibold text-brand-700">{translateWorkerTrade(t, doctor.specialization)}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("doctorDetail.experience")}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{t("doctorDetail.years", { n: doctor.experienceYears || 0 })}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("doctorDetail.serviceRate")}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{formatConsultationFee(doctor.consultationFee)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("doctorDetail.avgRating")}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{Number(doctor.averageRating || 0).toFixed(1)} / 5.0</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("doctorDetail.totalReviews")}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{doctor.numReviews || 0}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-900">{t("doctorDetail.aboutTitle")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{doctor.bio || t("doctorDetail.noBio")}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openBooking}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {t("doctorDetail.bookService")}
              </button>
              <Link
                to="/doctors"
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("doctorDetail.backToList")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <DoctorReviewsSection reviews={reviews} />

      {bookingOpen && (
        <DoctorBookingModal
          doctor={doctor}
          onClose={() => setBookingOpen(false)}
          onBooked={() => navigate("/dashboard")}
        />
      )}
    </div>
  );
};

export default DoctorDetailsPage;
