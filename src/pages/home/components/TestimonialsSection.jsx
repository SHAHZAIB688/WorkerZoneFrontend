import { useTranslation } from "react-i18next";

const TestimonialsSection = ({ testimonials }) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-12 py-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t("home.testimonialsTitle")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{t("home.testimonialsSubtitle")}</p>
      </div>
      <div className="relative overflow-hidden before:absolute before:start-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-slate-50 before:to-transparent after:absolute after:end-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-slate-50 after:to-transparent rtl:before:bg-gradient-to-l rtl:after:bg-gradient-to-r">
        <div className="animate-marquee flex gap-8 py-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-8">
              {testimonials.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="group relative flex w-[350px] flex-shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="absolute -end-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-2xl text-white opacity-0 transition-opacity group-hover:opacity-100">
                    &quot;
                  </div>
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      width={128}
                      height={128}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-brand-50 transition-transform group-hover:scale-105"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                      <p className="text-sm font-medium text-brand-600">{item.role}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-1 text-amber-400">
                    {[...Array(item.rating)].map((__, starIndex) => (
                      <span key={starIndex} className="text-xl">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 leading-relaxed text-slate-600">&quot;{item.content}&quot;</p>
                  <div className="mt-6 h-1 w-12 rounded-full bg-brand-100 transition-all group-hover:w-full group-hover:bg-brand-600" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
