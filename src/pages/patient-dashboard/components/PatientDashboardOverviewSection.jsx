import { useTranslation } from "react-i18next";
import { IconWrapper } from "../../../components/icons";
import { appointmentStatusLabel } from "../../../utils/statusLabel";

const PatientDashboardOverviewSection = ({
  dashboardStats,
  nextAppointment,
  openPaymentModal,
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-5 lg:col-span-2">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((stat) => (
          <article key={stat.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <IconWrapper>
                <stat.icon />
              </IconWrapper>
              <div>
                <p className="text-2xl font-bold text-cyan-700">{stat.value}</p>
                <p className="text-xs text-slate-600">{stat.label}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{t("dash.patient.overview.nextBooking")}</h3>
          {nextAppointment ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-600 text-lg font-bold text-white">
                  {(nextAppointment.doctor?.name || "W").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{nextAppointment.doctor?.name || t("dash.patient.unnamedDoctor")}</p>
                  <p className="text-sm text-slate-500">
                    {nextAppointment.doctorProfile?.specialization || t("dash.patient.overview.generalService")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {nextAppointment.date} - {nextAppointment.timeSlot}
                  </p>
                </div>
              </div>
              {nextAppointment.status === "awaiting-payment" ? (
                <button
                  type="button"
                  onClick={() => openPaymentModal(nextAppointment._id)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {t("dash.patient.overview.payNow")}
                </button>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                  {appointmentStatusLabel(nextAppointment.status, t)}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">{t("dash.patient.overview.noUpcoming")}</p>
          )}
        </article>
      </div>
    </section>
  );
};

export default PatientDashboardOverviewSection;
