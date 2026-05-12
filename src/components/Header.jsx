import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LogoImg from "../assets/logo2.jpeg";
import { useAuth } from "../state/AuthContext";
import { DashboardIcon, LogoutIcon, ChevronDownIcon } from "../icons";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationHeaderControls from "./LocationHeaderControls";

const Header = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHideRoute =
    location.pathname.startsWith("/dashboard") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  if (isHideRoute) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <img src={LogoImg} alt={t("header.logoAlt")} className="h-9 w-9 shrink-0 rounded-lg md:h-10 md:w-10" />
          <Link to="/" className="min-w-0 truncate text-lg font-extrabold tracking-tight text-brand-700 md:text-xl">
            {t("brand.name")}
          </Link>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/" end>
            {t("nav.home")}
          </NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/doctors">
            {t("nav.findDoctors")}
          </NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/about">
            {t("nav.about")}
          </NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/contact">
            {t("nav.contact")}
          </NavLink>
          {user && (
            <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/dashboard">
              {t("nav.dashboard")}
            </NavLink>
          )}
        </nav>
        <div className="flex min-w-0 w-full items-center gap-2 md:w-auto md:shrink-0 md:gap-4">
          <div className="min-w-0 flex-1 md:flex-initial">
            <LocationHeaderControls className="w-full md:w-auto" />
          </div>
          <LanguageSwitcher className="shrink-0" />
          {!user ? (
            <>
              <Link
                to="/login"
                className="hidden shrink-0 text-sm font-bold text-slate-600 transition-colors hover:text-brand-600 md:block"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/signup"
                className="shrink-0 rounded-2xl bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-brand-100 transition-all hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 sm:px-6 sm:py-2.5 sm:text-sm"
              >
                {t("nav.joinNow")}
              </Link>
            </>
          ) : (
            <div className="relative shrink-0">
              <button
                type="button"
                className="flex max-w-[min(100%,11rem)] items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-brand-600 hover:shadow-md active:scale-95 sm:max-w-none sm:gap-3 sm:pr-4"
                onClick={() => setOpen((prev) => !prev)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold uppercase text-white">
                  {user.name?.[0]}
                </div>
                <span className="min-w-0 max-w-[5.5rem] truncate sm:max-w-[100px]">{user.name}</span>
                <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-[60] max-h-[min(70dvh,24rem)] w-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 overflow-y-auto overflow-x-hidden rounded-[2rem] border border-slate-100 bg-white p-2 shadow-2xl duration-200 sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-full sm:mt-3 sm:max-h-none sm:w-64 sm:overflow-hidden">
                  <div className="mb-1 border-b border-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("header.account")}</p>
                    <p className="truncate text-sm font-bold text-slate-900">{user.email || t("header.userAccount")}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-brand-600"
                    onClick={() => setOpen(false)}
                  >
                    <DashboardIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-600" />
                    {t("nav.dashboard")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="group mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start text-sm font-bold text-rose-600 transition-all hover:bg-rose-50"
                  >
                    <LogoutIcon className="h-5 w-5 text-rose-400 group-hover:text-rose-600" />
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
