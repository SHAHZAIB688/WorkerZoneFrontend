import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient from "../../api/client";
import WhyChooseUsSection from "../../components/WhyChooseUsSection";
import HeroSection from "./components/HeroSection";

import TopSpecialitiesSection from "./components/TopSpecialitiesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FeaturedDoctorsSection from "./components/FeaturedDoctorsSection";
import TestimonialsSection from "./components/TestimonialsSection";
import FaqSection from "./components/FaqSection";
import CtaSection from "./components/CtaSection";
import { HERO_IMAGES, TOP_SPECIALITIES, TESTIMONIALS } from "./components/HomeConstants";
import { translateWorkerTrade } from "../../utils/workerTradeLabels";

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const formatConsultationFee = (fee) => (!fee || fee === 0 ? t("common.free") : `PKR ${fee}`);

  const howSteps = useMemo(() => {
    const v = t("home.howSteps", { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language]);
  const faqItems = useMemo(() => {
    const v = t("home.faqItems", { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language]);
  const testimonialTexts = useMemo(() => {
    const v = t("home.testimonials", { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language]);

  const testimonials = useMemo(
    () =>
      Array.isArray(testimonialTexts)
        ? testimonialTexts.map((item, i) => ({
            ...item,
            image: TESTIMONIALS[i]?.image,
            rating: TESTIMONIALS[i]?.rating ?? 5,
          }))
        : [],
    [testimonialTexts]
  );

  const topSpecialityItems = useMemo(
    () =>
      TOP_SPECIALITIES.map((queryValue) => ({
        queryValue,
        label: translateWorkerTrade(t, queryValue),
      })),
    [t, i18n.language]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await patient.get("/doctors");
        setDoctors(Array.isArray(data) ? data : []);
      } catch {
        toast.error(t("home.loadDoctorsError"));
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
    const intervalId = setInterval(fetchDoctors, 30000);
    return () => clearInterval(intervalId);
  }, [t]);

  const featuredDoctors = useMemo(() => doctors.slice(0, 3), [doctors]);



  return (
    <div className="space-y-16 pb-8">
      <HeroSection heroImages={HERO_IMAGES} currentImage={currentImage} />

      <TopSpecialitiesSection specialities={topSpecialityItems} />
      <WhyChooseUsSection />
      <HowItWorksSection steps={howSteps} />
      <FeaturedDoctorsSection
        loadingDoctors={loadingDoctors}
        featuredDoctors={featuredDoctors}
        formatConsultationFee={formatConsultationFee}
      />
      <TestimonialsSection testimonials={testimonials} />
      <FaqSection items={faqItems} openIndex={openFaqIndex} setOpenIndex={setOpenFaqIndex} />
      <CtaSection />
    </div>
  );
};

export default HomePage;
