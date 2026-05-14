import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = ({ heroImages, currentImage }) => {
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-cyan-600 px-4 py-10 text-white shadow-xl sm:px-6 sm:py-12 lg:px-12">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-100">{t("home.heroBadge")}</p>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">{t("home.heroTitle")}</h1>
          <p className="mt-4 max-w-xl text-base text-cyan-50 md:text-lg">{t("home.heroSubtitle")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/doctors"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow hover:bg-cyan-50"
            >
              {t("home.findDoctors")}
            </Link>
            <Link
              to="/dashboard"
              className="rounded-xl border border-white/60 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t("home.bookAppointment")}
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="relative h-72 w-full max-w-md">
            {heroImages.map((img, index) => (
              <img
                key={img}
                src={img}
                alt={`${t("home.heroImgAlt")} ${index + 1}`}
                width={900}
                height={600}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "low"}
                referrerPolicy="no-referrer-when-downgrade"
                className={`absolute left-0 top-0 h-full w-full rounded-2xl object-cover shadow-2xl ring-4 ring-white/20 transition-opacity duration-1000 ${
                  index === currentImage ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
