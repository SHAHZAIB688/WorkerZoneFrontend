import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { buildBackendAssetUrl } from "../../../api/client";
import Dropdown from "../../../components/Dropdown";
import { MapPinIcon, XMarkIcon } from "../../../icons";
import { useBrowserLocation } from "../../../state/BrowserLocationContext";
import { translateWorkerTrade } from "../../../utils/workerTradeLabels";

const PatientDoctorsSection = ({
  doctorFilter,
  setDoctorFilter,
  doctorCategories,
  filteredDoctors,
  formatServiceFee,
  setForm,
  setBookingModalOpen,
  onSelectDoctor,
}) => {
  const { t } = useTranslation();
  const geo = useBrowserLocation();

  const enableNearMe = async () => {
    let lat = geo.lat;
    let lng = geo.lng;
    if (geo.status !== "ready" || lat == null || lng == null) {
      const loc = await geo.requestLocation();
      if (!loc) {
        toast.error(!navigator.geolocation ? t("auth.geoNotSupported") : t("auth.geoDenied"));
        return;
      }
      lat = loc.lat;
      lng = loc.lng;
    }
    setDoctorFilter((p) => ({
      ...p,
      nearMe: true,
      nearLat: lat,
      nearLng: lng,
    }));
    toast.success(t("dash.patient.doctors.nearMeOn"));
  };

  const clearNearMe = () => {
    setDoctorFilter((p) => ({ ...p, nearMe: false, nearLat: null, nearLng: null }));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
      <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{t("dash.patient.doctors.title")}</h3>
      <p className="mt-1 text-sm text-slate-600">{t("dash.patient.doctors.subtitle")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center">
        <Dropdown
          options={doctorCategories.map((category) => ({
            value: category,
            label: category === "all" ? t("dash.patient.doctors.allCategories") : translateWorkerTrade(t, category),
          }))}
          value={doctorFilter.specialization}
          onChange={(val) => setDoctorFilter((p) => ({ ...p, specialization: val }))}
          className="h-10 w-full shrink-0 sm:w-52"
        />
        <input
          placeholder={t("dash.patient.doctors.searchPh")}
          value={doctorFilter.search}
          onChange={(e) => setDoctorFilter((p) => ({ ...p, search: e.target.value }))}
          className="h-10 min-w-0 w-full flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:min-w-[8rem]"
        />
        <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1.5 sm:ms-auto">
          <button
            type="button"
            onClick={() => void enableNearMe()}
            title={t("dash.patient.doctors.nearMe")}
            aria-label={t("dash.patient.doctors.nearMe")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
              doctorFilter.nearMe
                ? "border-brand-600 bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
          {doctorFilter.nearMe && (
            <button
              type="button"
              onClick={clearNearMe}
              title={t("dash.patient.doctors.clearNearMe")}
              aria-label={t("dash.patient.doctors.clearNearMe")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredDoctors.map((doctor) => (
          <article key={doctor._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <img
              src={
                doctor.image
                  ? buildBackendAssetUrl(doctor.image)
                  : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || t("dash.patient.unnamedDoctor"))}`
              }
              alt={doctor.user?.name || t("dash.patient.unnamedDoctor")}
              className="h-44 w-full rounded-xl bg-slate-100 object-cover"
            />
            <h3 className="mt-4 text-lg font-bold text-slate-900">{doctor.user?.name}</h3>
            <p className="text-sm text-brand-700">{translateWorkerTrade(t, doctor.specialization)}</p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>
                {t("dash.patient.doctors.experience")}: {t("dash.patient.doctors.yearsPlus", { n: doctor.experienceYears || 5 })}
              </p>
              <p>
                {t("dash.patient.doctors.rating")}: 4.8 / 5.0
              </p>
              <p className="font-semibold text-brand-600">
                {t("dash.patient.doctors.serviceFee")}: {formatServiceFee(doctor.consultationFee)}
              </p>
              {doctor.distanceKm != null && (
                <p className="text-sm text-slate-500">
                  {t("dash.patient.doctors.distanceAway", { km: doctor.distanceKm })}
                </p>
              )}
              {(doctor.locationCity || doctor.locationAddress) && (
                <p className="text-xs text-slate-500">
                  {[doctor.locationCity, doctor.locationAddress].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setForm((p) => ({ ...p, doctorProfileId: doctor._id }));
                setBookingModalOpen(true);
              }}
              className="mt-4 inline-block w-full rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("dash.patient.doctors.bookNow")}
            </button>
            {onSelectDoctor && (
              <button
                type="button"
                onClick={() => onSelectDoctor(doctor._id)}
                className="mt-2 inline-block w-full rounded-xl border border-brand-600 px-4 py-2 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                View Details
              </button>
            )}
          </article>
        ))}
        {filteredDoctors.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">{t("dash.patient.doctors.empty")}</p>
        )}
      </div>
    </section>
  );
};

export default PatientDoctorsSection;
