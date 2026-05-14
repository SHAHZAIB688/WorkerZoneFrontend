import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../api/client";
import Loader from "./Loader";
import { translateStoreCategory } from "../utils/storeCategoryLabel";

const StoreItemDetailsModal = ({ itemId, isOpen, onClose, onOrderPlaced }) => {
  const { t } = useTranslation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, itemId, t]);

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
      const { data: order } = await patient.post("/store/orders", {
        storeItemId: item._id,
        quantity: qty,
        notes: notes.trim().slice(0, 2000),
        deliveryLocation: {
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          address: address.trim(),
        },
        paymentMethod,
      });

      if (paymentMethod === "stripe") {
        const { data: checkout } = await patient.post(`/store/orders/${order._id}/checkout-session`);
        if (checkout?.alreadyPaid) {
          toast.success(t("dash.store.storePaymentPaid"));
          onClose();
          if (onOrderPlaced) onOrderPlaced();
          return;
        }
        if (!checkout?.url) {
          toast.error(checkout?.message || t("dash.store.stripeCheckoutFail"));
          return;
        }
        toast.success(t("dash.store.stripeRedirecting"));
        window.location.assign(checkout.url);
        return;
      }

      toast.success(t("dash.store.orderPlaced"));
      onClose();
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.store.orderFail"));
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("dash.store.geoNotSupported"));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get address name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const addressName = data.address?.road || data.address?.neighbourhood || 
                             data.address?.suburb || data.address?.city || 
                             `${lat}, ${lng}`;
          setAddress(addressName);
          toast.success(t("dash.store.geoCaptured"));
        } catch (err) {
          toast.success(t("dash.store.geoLookupFail"));
        }
        setGettingLocation(false);
      },
      () => {
        toast.error(t("dash.store.geoDenied"));
        setGettingLocation(false);
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-slate-100"
        >
          <svg className="h-6 w-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="max-h-[90vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <Loader />
            </div>
          ) : item ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
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
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                      {translateStoreCategory(t, item.category)}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">{item.name}</h1>
                    <p className="mt-3 text-lg font-semibold text-slate-800">
                      {t("dash.store.priceLabel", { price: item.pricePKR ?? 0, unit: translateUnit(item.unit) })}
                    </p>
                  </div>

                  {item.description ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        {t("dash.store.detailDescription")}
                      </h2>
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

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-900">{t("dash.store.deliveryLocation")}</h3>
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60"
                        >
                          {gettingLocation ? t("dash.store.gettingLocation") : t("dash.store.useMyLocation")}
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">{t("dash.store.deliveryAddress")}</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t("dash.store.deliveryAddressPlaceholder")}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{t("dash.store.paymentMethod")}</h3>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 text-brand-600"
                          />
                          <span className="ml-3 text-sm font-medium text-slate-700">{t("dash.store.paymentCod")}</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            value="stripe"
                            checked={paymentMethod === "stripe"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4 text-brand-600"
                          />
                          <span className="ml-3 text-sm font-medium text-slate-700">{t("dash.store.paymentStripe")}</span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">{t("dash.store.lineTotal")}</p>
                        <p className="text-2xl font-bold text-slate-900">PKR {lineTotal.toLocaleString()}</p>
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
          ) : (
            <div className="text-center">
              <p className="text-slate-700">{t("dash.store.detailNotFound")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreItemDetailsModal;
