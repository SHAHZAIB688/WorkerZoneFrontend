import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import patient, { buildBackendAssetUrl } from "../../../api/client";
import { translateWorkerTrade } from "../../../utils/workerTradeLabels";

const WorkerFeaturedSection = ({ profile, formatConsultationFee }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(7);
  const [quotePkr, setQuotePkr] = useState(null);

  const featuredUntil = profile?.featuredUntil ? new Date(profile.featuredUntil) : null;
  const boostActive = Boolean(featuredUntil && featuredUntil.getTime() > Date.now());

  const preview = useMemo(
    () => ({
      name: profile?.user?.name || t("common.unnamedWorker"),
      trade: profile?.specialization,
      fee: profile?.consultationFee,
      image: profile?.image,
      bio: profile?.bio,
    }),
    [profile, t]
  );

  useEffect(() => {
    if (boostActive) {
      setQuotePkr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await patient.get("/doctors/featured-listing/quote", { params: { days } });
        if (!cancelled && data?.amountPKR != null) setQuotePkr(Number(data.amountPKR));
      } catch {
        if (!cancelled) setQuotePkr(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, boostActive]);

  const startCheckout = async () => {
    if (boostActive) return;
    setBusy(true);
    try {
      const { data } = await patient.post("/doctors/featured-listing/checkout", { days });
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      toast.error(t("dash.doctor.featured.checkoutNoUrl"));
    } catch (err) {
      const untilRaw = err.response?.data?.featuredUntil;
      const untilStr = untilRaw ? new Date(untilRaw).toLocaleString() : "";
      if (err.response?.status === 403 && untilStr) {
        toast.error(t("dash.doctor.featured.checkoutBlockedToast", { until: untilStr }));
      } else {
        const msg = err.response?.data?.message || t("dash.doctor.featured.toastFail");
        const hint = err.response?.data?.hint;
        toast.error(hint ? `${msg} ${hint}` : msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">{t("dash.doctor.featured.yourListingTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("dash.doctor.featured.yourListingSubtitle")}</p>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 lg:w-56">
            <img
              src={
                preview.image
                  ? buildBackendAssetUrl(preview.image)
                  : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(preview.name)}`
              }
              alt=""
              className="h-44 w-full object-cover lg:h-full lg:min-h-[11rem]"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xl font-bold text-slate-900">{preview.name}</p>
            <p className="text-sm font-semibold text-brand-700">{translateWorkerTrade(t, preview.trade)}</p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{t("dash.doctor.serviceRateLabel")}:</span>{" "}
              {formatConsultationFee(preview.fee)}
            </p>
            <p className="text-sm leading-relaxed text-slate-600">{preview.bio || t("dash.doctor.noBio")}</p>
            <Link
              to={`/doctors/${profile?._id}`}
              className="inline-block text-sm font-semibold text-brand-600 underline hover:text-brand-700"
            >
              {t("dash.doctor.featured.openPublicPage")}
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t("dash.doctor.featured.boostTitle")}</h3>
            <p className="mt-1 max-w-xl text-sm text-slate-600">{t("dash.doctor.featured.boostBody")}</p>
          </div>
          {boostActive && (
            <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {t("dash.doctor.featured.badgeActive")}
            </span>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700">
          {boostActive && featuredUntil ? (
            <p>
              <span className="font-semibold">{t("dash.doctor.featured.activeUntil")}</span>{" "}
              {featuredUntil.toLocaleString()}
            </p>
          ) : (
            <p>{t("dash.doctor.featured.notActive")}</p>
          )}
        </div>

        {boostActive && featuredUntil && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">{t("dash.doctor.featured.payLockedHint")}</p>
            <p className="mt-1">{featuredUntil.toLocaleString()}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("dash.doctor.featured.durationLabel")}
            </label>
            <select
              disabled={boostActive}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70 sm:w-40"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {t("dash.doctor.featured.daysOption", { count: d })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {!boostActive && quotePkr != null && (
              <p className="text-sm font-semibold text-slate-800">
                {t("dash.doctor.featured.totalDue", { amount: quotePkr })}
              </p>
            )}
            <button
              type="button"
              disabled={busy || boostActive || quotePkr == null}
              onClick={() => void startCheckout()}
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? t("dash.doctor.featured.processing") : t("dash.doctor.featured.payStripe")}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">{t("dash.doctor.featured.stripeNote")}</p>
      </section>
    </div>
  );
};

export default WorkerFeaturedSection;
