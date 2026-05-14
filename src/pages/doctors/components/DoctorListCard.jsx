import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildBackendAssetUrl } from "../../../api/client";
import { translateWorkerTrade } from "../../../utils/workerTradeLabels";

const DoctorListCard = ({ doctor }) => {
  const { t } = useTranslation();
  const years = doctor.experienceYears || 5;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
      <div className="relative h-60 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50">
        {doctor.isFeatured && (
          <div className="absolute start-3 top-3 z-10 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            {t("doctors.card.featured")}
          </div>
        )}
        <img
          src={
            doctor.image
              ? buildBackendAssetUrl(doctor.image)
              : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || t("common.unnamedWorker"))}`
          }
          alt={doctor.user?.name || t("common.unnamedWorker")}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute start-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-emerald-600 shadow-sm backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {t("doctors.card.verified")}
        </div>
      </div>
      <div className="mt-8 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-brand-600">{doctor.user?.name}</h3>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-500">{translateWorkerTrade(t, doctor.specialization)}</p>
            {doctor.distanceKm != null && (
              <p className="mt-1 text-xs font-medium text-slate-500">{t("dash.patient.doctors.distanceAway", { km: doctor.distanceKm })}</p>
            )}
            {(doctor.locationCity || doctor.locationAddress) && (
              <p className="mt-0.5 text-xs text-slate-400">{[doctor.locationCity, doctor.locationAddress].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
            ★ {Number(doctor.averageRating || 0).toFixed(1)}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("doctors.card.experience")}</p>
            <p className="text-sm font-bold text-slate-700">{t("doctors.card.yearsPlus", { n: years })}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("doctors.card.availability")}</p>
            <p className="text-sm font-bold text-emerald-600">{t("doctors.card.weekdays")}</p>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Link
            to={`/doctors/${doctor._id}`}
            className="group-hover:shadow-brand-200 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-brand-700 active:scale-[0.98]"
          >
            {t("doctors.card.viewDetails")}
            <span className="transition-transform group-hover:translate-x-1 rtl:rotate-180">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default DoctorListCard;
