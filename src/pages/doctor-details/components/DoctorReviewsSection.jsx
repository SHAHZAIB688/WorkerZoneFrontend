import { useTranslation } from "react-i18next";

const DoctorReviewsSection = ({ reviews }) => {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <h2 className="text-xl font-bold text-slate-900">{t("doctorReviews.title")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("doctorReviews.subtitle")}</p>

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{t("doctorReviews.empty")}</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {reviews.map((review) => (
            <li key={review._id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-slate-900">{review.patient?.name || t("doctorReviews.unnamedClient")}</p>
                <span className="shrink-0 text-sm font-bold text-brand-600">
                  {Number(review.rating || 0).toFixed(1)} / 5
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{review.patientComment || t("doctorReviews.noComment")}</p>
              {review.doctorResponse && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{t("doctorReviews.workerResponse")}</p>
                  <p className="mt-1 text-sm text-slate-700">{review.doctorResponse}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default DoctorReviewsSection;
