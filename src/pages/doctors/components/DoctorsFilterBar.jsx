import { useTranslation } from "react-i18next";
import SearchInput from "../../../components/SearchInput";
import CategoryDropdown from "../../../components/CategoryDropdown";
import SearchButton from "../../../components/SearchButton";
import { MapPinIcon, XMarkIcon } from "../../../icons";

const DoctorsFilterBar = ({
  search,
  setSearch,
  experience,
  setExperience,
  availability,
  setAvailability,
  resetFilters,
  handleSearch,
  searchLoading,
  experienceOptions,
  availabilityOptions,
  nearByActive,
  onNearMe,
  onClearNear,
  nearBusy,
}) => {
  const { t } = useTranslation();
  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {onNearMe && (
          <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1 border-slate-100 pe-1 sm:border-e sm:pe-3">
            <button
              type="button"
              onClick={() => void onNearMe()}
              title={t("doctors.nearMeTooltip")}
              aria-label={t("doctors.nearMeTooltip")}
              disabled={nearBusy}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50 ${
                nearByActive
                  ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {nearBusy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
              ) : (
                <MapPinIcon className="h-5 w-5" />
              )}
            </button>
            {nearByActive && onClearNear && (
              <button
                type="button"
                onClick={onClearNear}
                title={t("doctors.clearNearTooltip")}
                aria-label={t("doctors.clearNearTooltip")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("doctors.searchPlaceholder")}
          className="min-w-[200px] flex-1"
        />

        <CategoryDropdown
          value={experience}
          onChange={setExperience}
          options={experienceOptions}
          placeholder={t("doctors.experiencePh")}
          className="w-32 rounded-lg bg-white transition-colors hover:border-brand-300"
        />

        <CategoryDropdown
          value={availability}
          onChange={setAvailability}
          options={availabilityOptions}
          placeholder={t("doctors.availabilityPh")}
          className="w-36 rounded-lg bg-white transition-colors hover:border-brand-300"
        />

        <button
          type="button"
          onClick={resetFilters}
          className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          {t("doctors.reset")}
        </button>

        <SearchButton onClick={handleSearch} loading={searchLoading} className="px-4">
          {t("doctors.searchBtn")}
        </SearchButton>
      </div>
    </section>
  );
};

export default DoctorsFilterBar;
