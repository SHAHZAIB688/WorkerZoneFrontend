import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient from "../api/client";

const PrescriptionForm = ({ appointment, onClose, onSubmitSuccess }) => {
  const { t } = useTranslation();
  const tk = (key, opts) => t(`dash.serviceHandover.${key}`, opts);

  const [form, setForm] = useState({
    patientName: appointment?.patient?.name || "",
    age: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
    consultationType: "Service booking",
    symptoms: "",
    diagnosis: "",
    labTests: "",
    advice: "",
    followUpDate: "",
  });

  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: "", dosage: "", frequency: "Per visit", time: [], duration: "" },
  ]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { id: Date.now(), name: "", dosage: "", frequency: "Per visit", time: [], duration: "" },
    ]);
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const toggleTime = (id, timeOfDay) => {
    setMedicines(
      medicines.map((m) => {
        if (m.id === id) {
          const times = m.time.includes(timeOfDay) ? m.time.filter((x) => x !== timeOfDay) : [...m.time, timeOfDay];
          return { ...m, time: times };
        }
        return m;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patientName?.trim() || !form.diagnosis?.trim()) {
      toast.error(tk("validationClientWork"));
      return;
    }

    const medicinesPayload = medicines
      .filter((m) => String(m.name || "").trim() && String(m.dosage || "").trim())
      .map(({ name, dosage, frequency, time, duration }) => ({
        name: String(name).trim(),
        dosage: String(dosage).trim(),
        frequency: frequency || "Per visit",
        time: Array.isArray(time) ? time : [],
        duration: String(duration || "").trim(),
      }));

    const incompleteRows = medicines.some(
      (m) => (String(m.name || "").trim() && !String(m.dosage || "").trim()) || (!String(m.name || "").trim() && String(m.dosage || "").trim())
    );
    if (incompleteRows) {
      toast.error(tk("validationItems"));
      return;
    }

    const prescriptionData = {
      patientName: form.patientName.trim(),
      age: form.age,
      gender: form.gender,
      symptoms: form.symptoms,
      diagnosis: form.diagnosis.trim(),
      labTests: form.labTests,
      advice: form.advice,
      followUpDate: form.followUpDate,
      medicines: medicinesPayload,
      appointmentId: appointment?._id,
    };

    try {
      const { data } = await patient.post("/prescriptions", prescriptionData);
      toast.success(tk("toastSuccess"));
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || tk("toastFail"));
    }
  };

  const timeLabel = (slot) => {
    if (slot === "Morning") return tk("timeMorn");
    if (slot === "Afternoon") return tk("timeAft");
    return tk("timeNight");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{tk("modalTitle")}</h2>
            <p className="text-sm text-slate-500">{tk("modalSubtitle", { name: form.patientName || t("dash.shell.rolePatient") })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="custom-scrollbar max-h-[75vh] overflow-y-auto p-6">
          <form id="prescription-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{tk("sectionClient")}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {tk("clientName")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    name="patientName"
                    value={form.patientName}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={tk("clientNamePh")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">{tk("age")}</label>
                    <input
                      type="number"
                      name="age"
                      value={form.age}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder={tk("agePh")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">{tk("gender")}</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">{tk("genderSelect")}</option>
                      <option value="Male">{tk("genderMale")}</option>
                      <option value="Female">{tk("genderFemale")}</option>
                      <option value="Other">{tk("genderOther")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">{tk("date")}</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">{tk("serviceType")}</label>
                    <input
                      name="consultationType"
                      value={form.consultationType}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">{tk("sectionJob")}</h3>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{tk("issueDetails")}</label>
                  <textarea
                    name="symptoms"
                    value={form.symptoms}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder={tk("issueDetailsPh")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {tk("workSummary")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    name="diagnosis"
                    value={form.diagnosis}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder={tk("workSummaryPh")}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded bg-emerald-100 p-1">
                    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.5 20.5l-6-6a4.5 4.5 0 0 1 6.5-6.5l6 6a4.5 4.5 0 0 1-6.5 6.5z" />
                      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{tk("sectionMaterials")}</h3>
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-600">{tk("materialsHint")}</p>

              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={med.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300">
                    <div className="absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 transition-colors group-hover:border-emerald-200 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                      {index + 1}
                    </div>

                    <div className="ml-2 grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{tk("itemName")}</label>
                        <input
                          value={med.name}
                          onChange={(e) => updateMedicine(med.id, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder={tk("itemNamePh")}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{tk("qtySpec")}</label>
                        <input
                          value={med.dosage}
                          onChange={(e) => updateMedicine(med.id, "dosage", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder={tk("qtySpecPh")}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{tk("frequency")}</label>
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedicine(med.id, "frequency", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Per visit">{tk("freqPerVisit")}</option>
                          <option value="One-off">{tk("freqOneOff")}</option>
                          <option value="As needed">{tk("freqAsNeeded")}</option>
                          <option value="Scheduled return">{tk("freqScheduled")}</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{tk("time")}</label>
                        <div className="flex h-[38px] items-center gap-2">
                          {["Morning", "Afternoon", "Night"].map((slot) => (
                            <label
                              key={slot}
                              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                                med.time.includes(slot)
                                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <input type="checkbox" className="sr-only" checked={med.time.includes(slot)} onChange={() => toggleTime(med.id, slot)} />
                              {timeLabel(slot)}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">{tk("duration")}</label>
                        <input
                          value={med.duration}
                          onChange={(e) => updateMedicine(med.id, "duration", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder={tk("durationPh")}
                        />
                      </div>

                      <div className="flex items-end justify-end md:col-span-1">
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(med.id)}
                            className="mb-[2px] rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title={tk("removeRow")}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMedicine}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm font-bold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {tk("addRow")}
              </button>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {tk("recommendations")}
                </h3>
                <textarea
                  name="labTests"
                  value={form.labTests}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder={tk("recommendationsPh")}
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {tk("clientInstructions")}
                </h3>
                <textarea
                  name="advice"
                  value={form.advice}
                  onChange={handleFormChange}
                  rows="2"
                  className="mb-3 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder={tk("clientInstructionsPh")}
                />

                <div className="flex items-center gap-3">
                  <label className="whitespace-nowrap text-xs font-semibold text-slate-600">{tk("followUpDate")}</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={form.followUpDate}
                    onChange={handleFormChange}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white/90 px-6 py-4 backdrop-blur">
          <button type="button" onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100">
            {tk("cancel")}
          </button>
          <button
            type="submit"
            form="prescription-form"
            className="flex transform items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-200 transition-all hover:-translate-y-0.5 hover:from-brand-700 hover:to-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {tk("submit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionForm;
