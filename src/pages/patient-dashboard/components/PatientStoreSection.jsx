import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../../api/client";
import Loader from "../../../components/Loader";
import { STORE_CATEGORY_IDS } from "../../../constants/storeCategories";
import { translateStoreCategory } from "../../../utils/storeCategoryLabel";

const PatientStoreSection = ({ onSelectItem }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = category && category !== "all" ? { category } : {};
      const { data } = await patient.get("/store/items", { params });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("dash.store.clientLoadFail"));
    } finally {
      setLoading(false);
    }
  }, [category, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => ["all", ...STORE_CATEGORY_IDS], []);

  const translateUnit = (u) => t(`dash.store.units.${u}`, { defaultValue: u });

  if (loading) {
    return (
      <div className="col-span-full flex justify-center py-16 lg:col-span-2">
        <Loader />
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-4 lg:col-span-2">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("dash.store.title")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("dash.store.subtitle")}</p>
        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{t("dash.store.paymentHint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("dash.store.tableCategory")}</label>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((id) => (
            <option key={id} value={id}>
              {id === "all" ? t("dash.store.filterAll") : translateStoreCategory(t, id)}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{t("dash.store.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onSelectItem(item._id)}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md text-left"
            >
              <div className="grid grid-cols-3 gap-0.5 bg-slate-100">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200">
                    <img src={buildBackendAssetUrl(item.images?.[i])} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold uppercase text-brand-700">{translateStoreCategory(t, item.category)}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{item.name}</h3>
                {item.description ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.description}</p> : null}
                <p className="mt-auto pt-3 text-sm font-bold text-brand-700">{t("dash.store.viewDetails")}</p>
                <p className="pt-1 text-sm font-semibold text-slate-800">
                  {t("dash.store.priceLabel", { price: item.pricePKR ?? 0, unit: translateUnit(item.unit) })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientStoreSection;
