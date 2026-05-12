import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildBackendAssetUrl } from "../../../api/client";
import Loader from "../../../components/Loader";
import { translateWorkerTrade } from "../../../utils/workerTradeLabels";

const FeaturedDoctorsSection = ({ loadingDoctors, featuredDoctors, formatConsultationFee }) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{t("home.featuredTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("home.featuredSubtitle")}</p>
      </div>
      {loadingDoctors ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredDoctors.map((doctor) => (
            <article
              key={doctor._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <img
                src={
                  doctor.image
                    ? buildBackendAssetUrl(doctor.image)
                    : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || t("common.unnamedWorker"))}`
                }
                alt={doctor.user?.name || t("common.unnamedWorker")}
                className="h-44 w-full rounded-xl bg-slate-100 object-cover"
              />
              <h3 className="mt-4 text-lg font-bold text-slate-900">{doctor.user?.name}</h3>
              <p className="text-sm text-brand-700">{translateWorkerTrade(t, doctor.specialization)}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  {t("home.experience")}: {t("home.years", { n: doctor.experienceYears || 0 })}
                </p>
                <p>
                  {t("home.rating")}: {Number(doctor.averageRating || 0).toFixed(1)} / 5.0
                </p>
                <p className="font-semibold text-brand-600">
                  {t("home.startingRate")}: {formatConsultationFee(doctor.consultationFee)}
                </p>
              </div>
              <Link
                to={`/doctors/${doctor._id}`}
                className="mt-4 inline-block w-full rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                {t("home.viewDetails")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedDoctorsSection;
