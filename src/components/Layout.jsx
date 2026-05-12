import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import LogoImg from "../assets/logo2.jpeg";
import { MailIcon, PhoneIcon, MapPinIcon, FacebookIcon, LinkedInIcon, XIcon } from "../icons";

const Layout = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const hideLayout = isDashboardRoute || isAuthRoute;

  const social = [
    { icon: FacebookIcon, label: t("footer.socialFacebook") },
    { icon: LinkedInIcon, label: t("footer.socialLinkedIn") },
    { icon: XIcon, label: t("footer.socialX") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {!hideLayout && <Header />}
      <main className={hideLayout ? "m-0 w-full flex-1 p-0" : "mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-5 sm:px-4 sm:py-6 lg:px-8"}>
        {children}
      </main>
      {!hideLayout && (
        <footer id="contact" className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-16 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <img src={LogoImg} alt={t("header.logoAlt")} className="h-10 w-10 rounded-lg" />
                  <span className="text-xl font-extrabold tracking-tight text-brand-700">{t("brand.name")}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{t("footer.tagline")}</p>
                <div className="flex gap-4">
                  {social.map((item) => (
                    <a
                      key={item.label}
                      href="#"
                      aria-label={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:-translate-y-1 hover:bg-brand-600 hover:text-white"
                    >
                      <item.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">{t("footer.platform")}</h4>
                <ul className="mt-6 space-y-4">
                  <li>
                    <Link to="/" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("nav.home")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/doctors" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("nav.findDoctors")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("footer.bookService")}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">{t("footer.company")}</h4>
                <ul className="mt-6 space-y-4">
                  <li>
                    <Link to="/about" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("footer.aboutUs")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("footer.termsOfService")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-sm text-slate-600 transition-colors hover:text-brand-600">
                      {t("footer.contactSupport")}
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">{t("footer.contactUs")}</h4>
                <div className="space-y-3">
                  <p className="flex items-center gap-3 text-sm text-slate-600">
                    <MailIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    workerzone@gmail.com
                  </p>
                  <p className="flex items-center gap-3 text-sm text-slate-600">
                    <PhoneIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    +92 308 6423719
                  </p>
                  <p className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    Tufail Road Saddar Lahore Cantt.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 md:flex-row">
              <p className="text-xs font-medium text-slate-500">{t("footer.rights")}</p>
              <div className="flex gap-6">
                <Link to="/terms" className="text-xs text-slate-400 transition-colors hover:text-slate-600">
                  {t("footer.terms")}
                </Link>
                <Link to="/terms" className="text-xs text-slate-400 transition-colors hover:text-slate-600">
                  {t("footer.privacy")}
                </Link>
                <Link to="/terms" className="text-xs text-slate-400 transition-colors hover:text-slate-600">
                  {t("footer.cookies")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
