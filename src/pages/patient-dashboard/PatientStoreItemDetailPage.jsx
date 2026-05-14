import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../api/client";
import Loader from "../../components/Loader";
import { translateStoreCategory } from "../../utils/storeCategoryLabel";

const PatientStoreItemDetailPage = () => {
  const { itemId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await patient.get(`/store/items/${itemId}`);
        if (!cancelled) {
          setItem(data);
          setActiveImage(0);
        }
      } catch {
        if (!cancelled) {
          setItem(null);
          toast.error(t("dash.store.detailNotFound"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, t]);

  const translateUnit = (u) => t(`dash.store.units.${u}`, { defaultValue: u });

  const lineTotal = useMemo(() => {
    if (!item) return 0;
    const unit = Math.max(0, Math.round(Number(item.pricePKR) || 0));
    return unit * Math.max(1, Math.min(999, Math.floor(Number(quantity) || 1)));
  }, [item, quantity]);

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!item?._id) return;
    const qty = Math.floor(Number(quantity) || 1);
    if (qty < 1 || qty > 999) {
      toast.error(t("dash.store.quantityInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      await patient.post("/store/orders", {
        storeItemId: item._id,
        quantity: qty,
        notes: notes.trim().slice(0, 2000),
      });
      toast.success(t("dash.store.orderPlaced"));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.store.orderFail"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f8fafc]">
        <Loader />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-700">{t("dash.store.detailNotFound")}</p>
        <Link to="/dashboard" className="mt-6 inline-block font-semibold text-brand-600 hover:underline">
          {t("dash.store.backToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <Link to="/dashboard" className="text-sm font-semibold text-brand-600 hover:underline">
            ← {t("dash.store.backToDashboard")}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-square bg-slate-100">
                <img
                  src={buildBackendAssetUrl(item.images?.[activeImage])}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex gap-2 border-t border-slate-100 p-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-20 w-1/3 overflow-hidden rounded-lg border-2 transition ${
                      activeImage === i ? "border-brand-600 ring-2 ring-brand-200" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={buildBackendAssetUrl(item.images?.[i])} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{translateStoreCategory(t, item.category)}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{item.name}</h1>
              <p className="mt-3 text-lg font-semibold text-slate-800">
                {t("dash.store.priceLabel", { price: item.pricePKR ?? 0, unit: translateUnit(item.unit) })}
              </p>
            </div>

            {item.description ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t("dash.store.detailDescription")}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.description}</p>
              </div>
            ) : null}

            <form onSubmit={(e) => void submitOrder(e)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{t("dash.store.orderSectionTitle")}</h2>
              <p className="mt-1 text-xs text-slate-500">{t("dash.store.orderSectionHint")}</p>

              <div className="mt-4">
                <label htmlFor="store-qty" className="block text-sm font-semibold text-slate-700">
                  {t("dash.store.quantityLabel")}
                </label>
                <input
                  id="store-qty"
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setQuantity(Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1);
                  }}
                  className="mt-2 w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="store-notes" className="block text-sm font-semibold text-slate-700">
                  {t("dash.store.notesLabel")}
                </label>
                <textarea
                  id="store-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("dash.store.notesPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">{t("dash.store.lineTotal")}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    PKR {lineTotal.toLocaleString()}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-brand-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting ? "…" : t("dash.store.placeOrder")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientStoreItemDetailPage;
