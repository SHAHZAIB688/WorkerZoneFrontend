import { useState, useId } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeSlashIcon } from "./icons";

/**
 * Password field with show/hide toggle. Use inside forms that supply their own label.
 */
const PasswordInput = ({
  id: idProp,
  name,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  disabled,
  className = "",
  /** Extra classes on the toggle button (e.g. smaller on dense forms) */
  toggleButtonClassName = "",
}) => {
  const { t } = useTranslation();
  const reactId = useId();
  const id = idProp ?? `pwd-${reactId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-w-0 pe-11 ${className}`.trim()}
      />
      <button
        type="button"
        disabled={disabled}
        className={`absolute end-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:pointer-events-none disabled:opacity-40 ${toggleButtonClassName}`.trim()}
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
      >
        {visible ? <EyeSlashIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

export default PasswordInput;
