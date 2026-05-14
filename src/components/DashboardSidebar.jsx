import { useTranslation } from "react-i18next";
import { LogoutIcon } from "./icons";
import sidebarLogo from "../assets/logo.png";

const DashboardSidebar = ({ navItems, activeTab, onTabChange, onLogout, isOpen }) => {
  const { t } = useTranslation();
  return (
  <aside 
    className={`fixed inset-y-0 left-0 z-50 flex max-h-screen min-h-0 w-[280px] transform flex-col bg-gradient-to-b from-[#257ea3] to-[#29add1] px-4 py-7 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-0 lg:flex lg:h-screen lg:max-h-screen lg:w-[300px] lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-8 flex shrink-0 items-center justify-between">
        <div className="flex w-full items-center justify-center gap-1">
          <img src={sidebarLogo} alt={t("dash.sidebar.logoAlt")} className="h-10 w-10 object-contain" />
          <span className="-ml-1 text-[26px] font-bold leading-none tracking-tight">{t("brand.name")}</span>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain pr-1 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-[18px] leading-6 transition ${
              activeTab === item.id
                ? "bg-white text-[#1980aa] font-semibold"
                : "text-white font-medium hover:bg-[#2b8db2]/70"
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon ? <item.icon /> : null}
              {item.label}
            </div>
            {item.hasNotification && (
              <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 shadow-sm" />
            )}
          </button>
        ))}
      </nav>

      <div className="shrink-0 border-t border-cyan-200/50 pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-rose-600 px-3 py-2.5 text-start text-[18px] font-semibold text-white"
        >
          <LogoutIcon />
          {t("dash.sidebar.logout")}
        </button>
      </div>
    </div>
  </aside>
  );
};

export default DashboardSidebar;
