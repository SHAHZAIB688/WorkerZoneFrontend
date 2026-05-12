import { useTranslation } from "react-i18next";
import { MailIcon, PhoneIcon, MapPinIcon, ClockIcon } from "../../../icons";

const ContactInfoCards = () => {
  const { t } = useTranslation();
  const items = [
    { icon: MailIcon, label: t("contact.cardEmail"), val: "workerzone@gmail.com" },
    { icon: PhoneIcon, label: t("contact.cardPhone"), val: "+92 308 6423719" },
    { icon: MapPinIcon, label: t("contact.cardVisit"), val: "Tufail Road Saddar Lahore Cantt." },
    { icon: ClockIcon, label: t("contact.cardHours"), val: t("contact.hoursValue") },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-xl"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
            <item.icon className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">{item.label}</h4>
          <p className="mt-2 font-bold text-slate-900">{item.val}</p>
        </div>
      ))}
    </div>
  );
};

export default ContactInfoCards;
