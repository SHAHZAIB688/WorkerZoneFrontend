import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ContactInfoCards from "./components/ContactInfoCards";

const ContactPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const onSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const whatsappMsg = `Hi ${t("brand.name")} team! \n\nI am *${form.name}*.\n*Email:* ${form.email}\n*Subject:* ${form.subject}\n\n*Message:* ${form.message}`;
    const whatsappUrl = `https://wa.me/923081830956?text=${encodeURIComponent(whatsappMsg)}`;

    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
      toast.success(t("contact.whatsappToast"));
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 px-8 py-24 text-white shadow-2xl lg:px-16">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-brand-300 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400" />
            {t("contact.badge")}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">{t("contact.title")}</h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300 md:text-xl">{t("contact.lead")}</p>
        </div>
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{t("contact.helpTitle")}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{t("contact.helpText")}</p>
          </div>

          <ContactInfoCards />

          <div className="group relative h-72 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215707164172!2d-73.9878436!3d40.7579747!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1714144444444"
              className="h-full w-full grayscale-[0.5] transition-all duration-700 contrast-[1.1] group-hover:grayscale-0"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("contact.mapTitle")}
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-black/5" />
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl md:p-12">
          <h3 className="mb-8 text-2xl font-bold text-slate-900">{t("contact.formTitle")}</h3>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ms-1 text-xs font-bold uppercase tracking-widest text-slate-400">{t("contact.fullName")}</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder={t("contact.namePh")}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                />
              </div>
              <div className="space-y-2">
                <label className="ms-1 text-xs font-bold uppercase tracking-widest text-slate-400">{t("contact.email")}</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder={t("contact.emailPh")}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="ms-1 text-xs font-bold uppercase tracking-widest text-slate-400">{t("contact.subject")}</label>
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder={t("contact.subjectPh")}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              />
            </div>
            <div className="space-y-2">
              <label className="ms-1 text-xs font-bold uppercase tracking-widest text-slate-400">{t("contact.message")}</label>
              <textarea
                name="message"
                rows={5}
                value={form.message}
                onChange={onChange}
                placeholder={t("contact.messagePh")}
                required
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-2xl bg-brand-600 py-5 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? t("contact.sending") : t("contact.send")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
