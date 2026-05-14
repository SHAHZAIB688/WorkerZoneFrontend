import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import LogoImg from "../../assets/logo2.jpeg";
import api from "../../api/client";
import { auth } from "../../firebase";
import { useAuth } from "../../state/AuthContext";
import VerificationModal from "../../components/VerificationModal";
import Dropdown from "../../components/Dropdown";
import AuthBrandPanel from "../auth/components/AuthBrandPanel";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import PasswordInput from "../../components/PasswordInput";
import { DOCTOR_SIGNUP_SPECIALIZATIONS } from "../home/components/HomeConstants";
import { translateWorkerTrade } from "../../utils/workerTradeLabels";
import { resolveDeviceLocationForForm } from "../../utils/reverseGeocode";

const SignupPage = () => {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
    specialization: "General Handyman",
    experience: "",
    degreeFile: null,
    locationCity: "",
    locationAddress: "",
    locationLat: "",
    locationLng: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [geoWorking, setGeoWorking] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [doctorSpecializations, setDoctorSpecializations] = useState(DOCTOR_SIGNUP_SPECIALIZATIONS);
  const { register, authWithGoogle } = useAuth();
  const navigate = useNavigate();

  const rolesOptions = useMemo(
    () => [
      { value: "patient", label: t("auth.joinPatient") },
      { value: "doctor", label: t("auth.joinDoctor") },
    ],
    [t, i18n.language]
  );

  const specializationOptions = useMemo(
    () =>
      doctorSpecializations.map((spec) => ({
        value: spec,
        label: translateWorkerTrade(t, spec),
      })),
    [doctorSpecializations, t, i18n.language]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/meta/doctor-specializations");
        const list = data?.specializations;
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setDoctorSpecializations(list);
          setForm((p) => ({
            ...p,
            specialization: list.includes(p.specialization) ? p.specialization : list[0],
          }));
        }
      } catch {
        /* keep bundled DOCTOR_SIGNUP_SPECIALIZATIONS */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (e) => {
    const name = e.target.name;
    const file = e.target.files ? e.target.files[0] : null;

    if (name === "image" && file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        if (img.width < 400 || img.height < 400) {
          toast.error(t("auth.imageSizeError"));
          e.target.value = "";
          return;
        }
        if (ratio < 0.7 || ratio > 1.3) {
          toast.error(t("auth.imageRatioError"));
          e.target.value = "";
          return;
        }
        setForm((p) => ({ ...p, [name]: file }));
      };
      return;
    }

    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onDropdownChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const fillLocationFromBrowser = async () => {
    if (!navigator.geolocation) {
      toast.error(t("auth.geoNotSupported"));
      return;
    }
    setGeoWorking(true);
    const toastId = toast.loading(t("auth.geoResolving"));
    try {
      const result = await resolveDeviceLocationForForm(i18n.language);
      toast.dismiss(toastId);
      if (!result) {
        toast.error(t("auth.geoDenied"));
        return;
      }
      setForm((p) => ({
        ...p,
        locationLat: result.lat,
        locationLng: result.lng,
        locationCity: result.locationCity || p.locationCity,
        locationAddress: result.locationAddress || p.locationAddress,
      }));
      toast.success(t("auth.geoSuccess"));
    } catch {
      toast.dismiss(toastId);
      toast.error(t("auth.geoDenied"));
    } finally {
      setGeoWorking(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error(t("auth.termsRequired"));
      return;
    }
    setLoading(true);
    try {
      await register(form);
      if (form.role === "doctor") {
        setShowVerificationModal(true);
      } else {
        toast.success(t("auth.welcome"));
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignup = async () => {
    if (form.role !== "patient") {
      toast.error(t("auth.googleOnlyPatients"));
      return;
    }
    if (!agreedToTerms) {
      toast.error(t("auth.termsRequired"));
      return;
    }
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await authWithGoogle({ idToken, role: "patient" });
      toast.success(t("auth.welcome"));
      navigate("/dashboard");
    } catch (error) {
      const code = error?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      toast.error(error.response?.data?.message || error.message || t("auth.googleFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 md:p-12">
      <div className="relative flex w-full max-w-4xl min-h-fit flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl sm:rounded-[2rem] md:flex-row md:rounded-[2.5rem]">
        <div className="absolute end-4 top-4 z-20 flex items-center gap-4 md:end-8 md:top-8">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
          >
            <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:block">{t("nav.home")}</span>
          </Link>
          <LanguageSwitcher />
        </div>
        <AuthBrandPanel logoSrc={LogoImg} />

        <div className="flex w-full flex-col justify-center px-6 py-6 sm:px-8 sm:py-8 md:w-[60%] md:px-12">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t("auth.signUp")}</h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-brand-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="name"
                placeholder={t("auth.fullName")}
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600 sm:py-3"
              />
              <input
                name="phone"
                placeholder={t("auth.phone")}
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600 sm:py-3"
              />
            </div>

            <input
              name="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              onChange={onChange}
              required
              className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600 sm:py-3"
            />

            <PasswordInput
              name="password"
              value={form.password}
              onChange={onChange}
              required
              placeholder={t("auth.choosePassword")}
              autoComplete="new-password"
              className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600 sm:py-3"
            />

            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("auth.locationSection")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="locationCity"
                  placeholder={t("auth.locationCityPh")}
                  value={form.locationCity}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600"
                />
                <input
                  name="locationAddress"
                  placeholder={t("auth.locationAddressPh")}
                  value={form.locationAddress}
                  onChange={onChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-600 sm:col-span-2"
                />
              </div>
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => void fillLocationFromBrowser()}
                  disabled={geoWorking}
                  className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {geoWorking ? t("auth.geoResolving") : t("auth.useMyLocation")}
                </button>
              </div>
            </div>

            <Dropdown
              options={rolesOptions}
              value={form.role}
              onChange={(val) => {
                setForm((p) => ({
                  ...p,
                  role: val,
                  ...(val === "doctor"
                    ? {
                        specialization: doctorSpecializations.includes(p.specialization)
                          ? p.specialization
                          : doctorSpecializations[0],
                      }
                    : {}),
                }));
              }}
              placeholder={t("auth.selectRole")}
            />

            {form.role === "doctor" && (
              <div className="grid animate-in slide-in-from-left-2 gap-4">
                <Dropdown
                  options={specializationOptions}
                  value={form.specialization}
                  onChange={(val) => onDropdownChange("specialization", val)}
                  placeholder={t("auth.selectSpecialization")}
                />
                <input
                  name="experience"
                  type="number"
                  placeholder={t("auth.yearsExperience")}
                  onChange={onChange}
                  required
                  className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600 sm:py-3"
                />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("auth.photoHeadshot")}</p>
                  <input name="image" type="file" accept="image/*" onChange={onChange} required className="text-xs text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("auth.certification")}</p>
                  <input name="degreeFile" type="file" accept=".pdf,image/*" onChange={onChange} required className="text-xs text-slate-500" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                required
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              <label htmlFor="terms" className="text-xs text-slate-500">
                {t("auth.termsAgree")}{" "}
                <Link to="/terms" className="font-bold text-brand-600 hover:underline">
                  {t("auth.termsLink")}
                </Link>
              </label>
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 sm:py-4"
              >
                {loading ? t("common.processing") : t("auth.registerBtn")}
              </button>
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400">{t("auth.orContinueWith")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoogleSignup}
              disabled={loading || googleLoading || form.role !== "patient"}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
              title={
                form.role !== "patient" ? t("auth.titlePatientGoogle") : !agreedToTerms ? t("auth.titleAcceptTerms") : undefined
              }
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? t("auth.connecting") : t("auth.continueGoogle")}
            </button>

            {form.role === "doctor" && <p className="text-center text-xs text-slate-400">{t("auth.googlePatientOnly")}</p>}
          </form>

          <div className="mt-6 text-center text-sm font-medium text-slate-500 sm:mt-8">
            <p>
              {t("auth.alreadyMember")}{" "}
              <Link to="/login" className="font-bold text-brand-600 hover:underline">
                {t("nav.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <VerificationModal isOpen={showVerificationModal} onAction={() => navigate("/login")} />
    </div>
  );
};

export default SignupPage;
