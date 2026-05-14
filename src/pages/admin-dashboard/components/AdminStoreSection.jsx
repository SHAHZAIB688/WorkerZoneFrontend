import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../../api/client";
import Loader from "../../../components/Loader";
import { STORE_CATEGORY_IDS, STORE_UNITS } from "../../../constants/storeCategories";
import { translateStoreCategory } from "../../../utils/storeCategoryLabel";

const SLOT_FIELDS = ["storeImg0", "storeImg1", "storeImg2"];

const AdminStoreSection = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "cement",
    pricePKR: "0",
    unit: "piece",
    sortOrder: "0",
    isActive: true,
  });
  const [files, setFiles] = useState([null, null, null]);
  const [existingPaths, setExistingPaths] = useState(["", "", ""]);
  const [orders, setOrders] = useState([]);
  const [orderStatusSaving, setOrderStatusSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, ordersRes] = await Promise.all([
        patient.get("/admin/store-items"),
        patient.get("/admin/store-orders").catch(() => ({ data: [] })),
      ]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch {
      toast.error(t("dash.store.adminLoadFail"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const orderStatuses = ["pending", "confirmed", "delivered", "cancelled"];

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrderStatusSaving(orderId);
    try {
      await patient.patch(`/store/orders/${orderId}/status`, { status: newStatus });
      toast.success(
        t("dash.admin.storePayments.toastOrderUpdated", {
          status: t(`dash.store.orderStatus.${newStatus}`, { defaultValue: newStatus }),
        })
      );
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || t("dash.admin.storePayments.toastOrderUpdateFail"));
    } finally {
      setOrderStatusSaving(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      category: "cement",
      pricePKR: "0",
      unit: "piece",
      sortOrder: "0",
      isActive: true,
    });
    setFiles([null, null, null]);
    setExistingPaths(["", "", ""]);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      description: item.description || "",
      category: STORE_CATEGORY_IDS.includes(item.category) ? item.category : "other",
      pricePKR: String(item.pricePKR ?? 0),
      unit: item.unit || "piece",
      sortOrder: String(item.sortOrder ?? 0),
      isActive: Boolean(item.isActive),
    });
    setFiles([null, null, null]);
    setExistingPaths([item.images?.[0] || "", item.images?.[1] || "", item.images?.[2] || ""]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFiles([null, null, null]);
  };

  const translateUnit = (u) => t(`dash.store.units.${u}`, { defaultValue: u });

  const submit = async (e) => {
    e.preventDefault();
    if (!editingId) {
      if (!files[0] || !files[1] || !files[2]) {
        toast.error(t("dash.store.adminThreeImagesRequired"));
        return;
      }
    }

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("category", form.category);
    fd.append("pricePKR", String(Math.max(0, Math.round(Number(form.pricePKR) || 0))));
    fd.append("unit", form.unit);
    fd.append("sortOrder", String(Math.round(Number(form.sortOrder) || 0)));
    fd.append("isActive", form.isActive ? "true" : "false");

    for (let i = 0; i < 3; i += 1) {
      if (files[i]) fd.append(SLOT_FIELDS[i], files[i]);
      else fd.append(`existingImage${i}`, existingPaths[i] || "");
    }

    setSaving(true);
    try {
      if (editingId) {
        await patient.put(`/admin/store-items/${editingId}`, fd);
      } else {
        await patient.post("/admin/store-items", fd);
      }
      toast.success(t("dash.store.adminSaved"));
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || t("dash.store.adminSaveFail"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("dash.store.confirmDelete"))) return;
    try {
      await patient.delete(`/admin/store-items/${id}`);
      await load();
    } catch {
      toast.error(t("dash.store.adminDeleteFail"));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t("dash.store.adminTitle")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t("dash.store.adminSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-700"
        >
          {t("dash.store.addItem")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{t("dash.store.empty")}</p>
        ) : (
          <table className="dashboard-table min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableImage")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableName")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableCategory")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tablePrice")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableUnit")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableActive")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("dash.store.tableActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <img
                      src={buildBackendAssetUrl(item.images?.[0])}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-2 text-slate-700">{translateStoreCategory(t, item.category)}</td>
                  <td className="px-4 py-2">{item.pricePKR}</td>
                  <td className="px-4 py-2">{translateUnit(item.unit)}</td>
                  <td className="px-4 py-2">{item.isActive ? "✓" : "—"}</td>
                  <td className="px-4 py-2">
                    <button type="button" className="me-2 text-brand-600 hover:underline" onClick={() => openEdit(item)}>
                      {t("dash.store.editItem")}
                    </button>
                    <button type="button" className="text-rose-600 hover:underline" onClick={() => void remove(item._id)}>
                      {t("dash.store.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{t("dash.store.adminOrdersTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("dash.store.adminOrdersSubtitle")}</p>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">—</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="dashboard-table min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableDate")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableClient")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableProduct")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableQty")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableTotal")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableStatus")}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t("dash.store.orderTableActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-slate-100">
                    <td className="px-4 py-2 whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-900">{o.patient?.name || "—"}</div>
                      <div className="text-xs text-slate-500">{o.patient?.email || ""}</div>
                    </td>
                    <td className="px-4 py-2">{o.storeItem?.name || "—"}</td>
                    <td className="px-4 py-2">{o.quantity}</td>
                    <td className="px-4 py-2 font-medium">{o.lineTotalPKR}</td>
                    <td className="px-4 py-2 capitalize">
                      {t(`dash.store.orderStatus.${o.status || "pending"}`, { defaultValue: o.status })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex max-w-[14rem] flex-wrap gap-1">
                        {orderStatuses.map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={orderStatusSaving === o._id}
                            onClick={() => void updateOrderStatus(o._id, st)}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition disabled:opacity-50 ${
                              o.status === st
                                ? "bg-brand-600 text-white"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700"
                            }`}
                          >
                            {t(`dash.store.orderStatus.${st}`, { defaultValue: st })}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-slate-900">{editingId ? t("dash.store.editItem") : t("dash.store.addItem")}</h4>
            <form className="mt-4 space-y-4" onSubmit={(e) => void submit(e)}>
              <div>
                <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formName")}</label>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formDescription")}</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formCategory")}</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {STORE_CATEGORY_IDS.map((id) => (
                    <option key={id} value={id}>
                      {translateStoreCategory(t, id)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formPrice")}</label>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.pricePKR}
                    onChange={(e) => setForm((f) => ({ ...f, pricePKR: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formUnit")}</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    {STORE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {translateUnit(u)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">{t("dash.store.formSort")}</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                {t("dash.store.formActive")}
              </label>

              <p className="text-xs text-slate-500">{t("dash.store.formImageHint")}</p>
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-slate-600">
                    {t(`dash.store.formImage${i + 1}`)}
                    {editingId && existingPaths[i] ? (
                      <span className="ms-2 font-normal text-slate-400">({t("dash.store.formKeepImage")})</span>
                    ) : null}
                  </label>
                  {editingId && existingPaths[i] ? (
                    <img src={buildBackendAssetUrl(existingPaths[i])} alt="" className="mb-2 h-20 w-20 rounded-lg object-cover" />
                  ) : null}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="mt-1 block w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFiles((prev) => {
                        const next = [...prev];
                        next[i] = file;
                        return next;
                      });
                    }}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={closeModal}>
                  {t("dash.store.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? "…" : t("dash.store.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStoreSection;
