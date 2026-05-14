import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../api/client";
import Loader from "./Loader";
import DoctorBookingModal from "./DoctorBookingModal";
import { useAuth } from "../state/AuthContext";
import DoctorReviewsSection from "../pages/doctor-details/components/DoctorReviewsSection";
import { translateWorkerTrade } from "../utils/workerTradeLabels";

const DoctorDetailsModal = ({ doctorId, isOpen, onClose }) => {
  const { t } = useTranslation();
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
    if (!isOpen) return;

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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, doctorId, t]);

  const openBooking = () => {
    if (!user) {
      toast(t("doctorDetail.loginToBook"));
      return;
    }
    if (user.role !== "patient") {
      toast.error(t("doctorDetail.onlyClientsBook"));
      return;
    }
    setBookingOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-slate-100"
        >
          <svg className="h-6 w-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="max-h-[90vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader />
            </div>
          ) : doctor ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="relative">
                    {doctor.isFeatured && (
                      <div className="absolute start-3 top-3 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                        {t("doctorDetail.featuredBadge")}
                      </div>
                    )}
                    <img
                      src={
                        doctor.image
                          ? buildBackendAssetUrl(doctor.image)
                          : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || "")}`
                      }
                      alt={doctor.user?.name || ""}
                      className="h-72 w-full rounded-2xl bg-slate-100 object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{doctor.user?.name}</h1>
                    <p className="mt-1 text-base font-semibold text-brand-700">
                      {translateWorkerTrade(t, doctor.specialization)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <h3 className="text-sm font-bold text-slate-900">{t("doctorDetail.contactTitle")}</h3>
                    <p className="mt-2 text-sm text-slate-700">
                      {doctor.user?.phone ? (
                        <a
                          href={`tel:${String(doctor.user.phone).replace(/\s+/g, "")}`}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {doctor.user.phone}
                        </a>
                      ) : (
                        <span className="text-slate-500">{t("doctorDetail.noPhone")}</span>
                      )}
                    </p>
                  </div>

                  {(doctor.locationCity || doctor.locationAddress) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <h3 className="text-sm font-bold text-slate-900">{t("doctorDetail.locationTitle")}</h3>
                      <p className="mt-2 text-sm text-slate-700">
                        {[doctor.locationCity, doctor.locationAddress].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("doctorDetail.experience")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {t("doctorDetail.years", { n: doctor.experienceYears || 0 })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("doctorDetail.serviceRate")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatConsultationFee(doctor.consultationFee)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("doctorDetail.avgRating")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {Number(doctor.averageRating || 0).toFixed(1)} / 5.0
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {t("doctorDetail.totalReviews")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{doctor.numReviews || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-sm font-bold text-slate-900">{t("doctorDetail.aboutTitle")}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {doctor.bio || t("doctorDetail.noBio")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openBooking}
                    className="w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    {t("doctorDetail.bookService")}
                  </button>
                </div>
              </div>

              <DoctorReviewsSection reviews={reviews} />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-slate-700">{t("doctorDetail.loadError")}</p>
            </div>
          )}
        </div>
      </div>

      {bookingOpen && (
        <DoctorBookingModal
          doctor={doctor}
          onClose={() => setBookingOpen(false)}
          onBooked={() => {
            onClose();
            toast.success(t("doctorDetail.bookingSuccess"));
          }}
        />
      )}
    </div>
  );
};

export default DoctorDetailsModal;
