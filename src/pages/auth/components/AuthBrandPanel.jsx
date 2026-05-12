import { useTranslation } from "react-i18next";

const AuthBrandPanel = ({ logoSrc }) => {
  const { t } = useTranslation();
  return (
    <div className="relative flex w-full flex-col justify-between bg-[#2e324d] p-6 text-white sm:p-8 md:w-[40%] lg:p-10">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="" className="h-10 w-10 rounded-xl bg-white/10 p-1" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t("brand.name")}</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{t("auth.careFirst")}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 my-10 space-y-4">
        <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {t("auth.startJourneyLine1")} <br /> {t("auth.startJourneyLine2")}
        </h1>
        <p className="text-[10px] leading-relaxed text-slate-400 sm:text-xs">{t("auth.brandSubtitle")}</p>
      </div>

      <div className="relative z-10">
        <div className="h-1 w-12 rounded-full bg-brand-500" />
      </div>

      <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-brand-500/10 blur-[100px]" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
    </div>
  );
};

export default AuthBrandPanel;
