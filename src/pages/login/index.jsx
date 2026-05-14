import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import LogoImg from "../../assets/logo2.jpeg";
import { useAuth } from "../../state/AuthContext";
import AuthBrandPanel from "../auth/components/AuthBrandPanel";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import PasswordInput from "../../components/PasswordInput";

const LoginPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success(t("auth.welcomeBack"));
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || t("auth.authFailed"));
    } finally {
      setLoading(false);
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
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t("auth.signIn")}</h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-brand-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="relative">
              <input
                name="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            <div className="relative">
              <PasswordInput
                name="password"
                value={form.password}
                onChange={onChange}
                required
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="current-password"
                className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 sm:py-4"
              >
                {loading ? t("common.processing") : t("auth.signInBtn")}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm font-medium text-slate-500 sm:mt-8">
            <p>
              {t("auth.notMember")}{" "}
              <Link to="/signup" className="font-bold text-brand-600 hover:underline">
                {t("auth.signUp")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
