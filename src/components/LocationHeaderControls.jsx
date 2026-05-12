import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { MapPinIcon, ChevronDownIcon } from "../icons";
import { useBrowserLocation } from "../state/BrowserLocationContext";
import { PAKISTAN_COUNTRY, PAKISTAN_ADM2_DISTRICTS, PAKISTAN_QUICK_LOCATIONS } from "../constants/locationPresets";

const PROVINCE_ORDER = ["PB", "SD", "KP", "BL", "GB", "JK"];

function primaryPlaceLine(placeLabel) {
  if (!placeLabel) return "";
  const first = placeLabel.split(",")[0]?.trim();
  return first || placeLabel;
}

function normalizeSearch(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function districtMatches(row, q) {
  if (!q) return true;
  const n = normalizeSearch(q);
  return normalizeSearch(row.en).includes(n) || normalizeSearch(row.ur).includes(n) || normalizeSearch(row.id).includes(n);
}

/**
 * Pakistan location picker: quick cities, all districts (GeoNames), GPS with detailed reverse geocode.
 */
const LocationHeaderControls = ({ className = "" }) => {
  const { t, i18n } = useTranslation();
  const { status, placeLabel, requestLocation, selectPresetLocation, clear } = useBrowserLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef(null);

  const countryLabel = t("locationPicker.defaultRegion");

  const triggerLabel = useMemo(() => {
    if (status === "ready" && placeLabel) return primaryPlaceLine(placeLabel);
    return countryLabel;
  }, [status, placeLabel, countryLabel]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open, i18n.language]);

  const filteredDistricts = useMemo(() => {
    const q = search.trim();
    return PAKISTAN_ADM2_DISTRICTS.filter((row) => districtMatches(row, q));
  }, [search]);

  const groupedDistricts = useMemo(() => {
    const map = new Map();
    for (const pr of PROVINCE_ORDER) map.set(pr, []);
    for (const row of filteredDistricts) {
      const list = map.get(row.province);
      if (list) list.push(row);
    }
    return PROVINCE_ORDER.map((pr) => ({ province: pr, rows: map.get(pr) || [] })).filter((g) => g.rows.length > 0);
  }, [filteredDistricts]);

  const onUseCurrent = async () => {
    const loc = await requestLocation();
    setOpen(false);
    if (!loc) {
      toast.error(!navigator.geolocation ? t("auth.geoNotSupported") : t("auth.geoDenied"));
    }
  };

  const onSeeAllPakistan = () => {
    selectPresetLocation(PAKISTAN_COUNTRY.lat, PAKISTAN_COUNTRY.lng, countryLabel);
    setOpen(false);
  };

  const onPickDistrict = (row) => {
    const label = `${row.en}, ${countryLabel}`;
    selectPresetLocation(row.lat, row.lng, label);
    setOpen(false);
  };

  const onPickQuick = (item) => {
    const label = `${t(`locationPicker.cities.${item.id}`)}, ${countryLabel}`;
    selectPresetLocation(item.lat, item.lng, label);
    setOpen(false);
  };

  const pinBusy = status === "loading";
  const hasSaved = status === "ready" && placeLabel;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("locationPicker.dropdownAria")}
        title={hasSaved ? placeLabel : t("header.locationHint")}
        className="flex h-10 w-full min-w-0 max-w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-start shadow-sm transition hover:border-slate-400 hover:bg-slate-50 md:min-w-[11rem] md:max-w-[18rem] lg:min-w-[12rem]"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-brand-600">
          {pinBusy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          ) : (
            <MapPinIcon className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{triggerLabel}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="z-[70] flex max-h-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150 max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] max-sm:top-[max(0.75rem,env(safe-area-inset-top,0px))] max-sm:mt-0 max-sm:slide-in-from-bottom-2 sm:absolute sm:end-0 sm:mt-2 sm:max-h-none sm:w-[min(100vw-1.5rem,22rem)] sm:slide-in-from-top-2"
          role="listbox"
        >
          <div className="flex shrink-0 flex-col gap-2 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <button
              type="button"
              onClick={() => void onUseCurrent()}
              disabled={pinBusy}
              className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1.5 text-start text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-50 sm:flex-1"
            >
              <MapPinIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 leading-snug sm:truncate">{t("locationPicker.useCurrentLocation")}</span>
            </button>
            <button
              type="button"
              onClick={onSeeAllPakistan}
              className="w-full shrink-0 rounded-lg px-2 py-1.5 text-start text-xs font-bold text-slate-900 underline-offset-2 hover:bg-slate-50 hover:underline sm:w-auto sm:self-center sm:text-sm"
            >
              {t("locationPicker.seeAllIn", { country: countryLabel })}
            </button>
          </div>

          <div className="shrink-0 border-b border-slate-100 px-3 py-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("locationPicker.searchDistricts")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 sm:text-sm"
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-slate-400">{t("locationPicker.districtCount", { count: filteredDistricts.length })}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar max-sm:max-h-none sm:max-h-[min(70vh,28rem)]">
            {!search.trim() && (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("locationPicker.popular")}</p>
                <div className="border-b border-slate-100 pb-2">
                  {PAKISTAN_QUICK_LOCATIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      onClick={() => onPickQuick(item)}
                      className="flex w-full px-3 py-2 text-start text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {t(`locationPicker.cities.${item.id}`)}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("locationPicker.allDistricts")}</p>

            {groupedDistricts.map(({ province, rows }) => (
              <div key={province} className="border-b border-slate-50 last:border-b-0">
                <p className="sticky top-0 z-[1] bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t(`locationPicker.provinces.${province}`)}
                </p>
                {rows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    role="option"
                    onClick={() => onPickDistrict(row)}
                    className="flex w-full border-b border-slate-50 px-3 py-2 text-start text-sm font-medium text-slate-700 transition last:border-b-0 hover:bg-slate-50"
                  >
                    {row.en}
                  </button>
                ))}
              </div>
            ))}

            {filteredDistricts.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-500">{t("locationPicker.noDistrictMatch")}</p>
            )}
          </div>

          {hasSaved && (
            <div className="shrink-0 border-t border-slate-100 px-2 py-1.5">
              <button
                type="button"
                onClick={() => {
                  clear();
                  setOpen(false);
                }}
                className="w-full rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
              >
                {t("locationPicker.clearSaved")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationHeaderControls;
