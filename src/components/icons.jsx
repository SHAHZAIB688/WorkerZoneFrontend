export const IconWrapper = ({ children }) => (
  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
    {children}
  </span>
);

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    {children}
  </svg>
);

export const DashboardIcon = () => <Svg><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></Svg>;
export const DoctorIcon = () => <Svg><path d="M12 2v8" /><path d="M8 6h8" /><circle cx="12" cy="14" r="4" /><path d="M4 22c1.5-3 4-4 8-4s6.5 1 8 4" /></Svg>;
export const AppointmentIcon = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></Svg>;
export const UsersIcon = () => <Svg><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c1.5-3 4-4.5 6-4.5S13.5 17 15 20" /><path d="M14 19c1-1.8 2.6-2.8 4.2-2.8 1.4 0 2.7.7 3.8 2.1" /></Svg>;
export const FileIcon = () => <Svg><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6" /></Svg>;
export const PaymentIcon = () => (
  <Svg>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 15h4" />
  </Svg>
);
export const ProfileIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21c2-4 5-6 8-6s6 2 8 6" /></Svg>;
/** Promoted / featured listing tab (worker dashboard). */
export const FeaturedAdIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);
export const SettingsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const LogoutIcon = () => <Svg><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></Svg>;
export const BellIcon = () => <Svg><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>;
/** Materials / catalog store (admin + client). */
export const StoreIcon = () => (
  <Svg>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);
export const ChevronDownIcon = ({ className = "" }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;

/** Show password (visibility toggle). */
export const EyeIcon = () => (
  <Svg>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

/** Hide password (visibility toggle). */
export const EyeSlashIcon = () => (
  <Svg>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 9.963 7.178.07.207.07.431 0 .639M12 12h.008v.008H12V12zm.956 4.644l-1.535-1.535m0 0L9.88 9.88m0 0L8.223 8.223M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </Svg>
);
