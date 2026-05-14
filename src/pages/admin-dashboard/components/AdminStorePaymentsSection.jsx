import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient from "../../../api/client";
import Loader from "../../../components/Loader";

const AdminStorePaymentsSection = ({ activeTab }) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const tp = (key, opts) => t(`dash.admin.storePayments.${key}`, opts);

  const orderLineTotal = (o) => Number(o.lineTotalPKR ?? o.lineTotal ?? 0) || 0;

  const loadData = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setLoading(true);
      try {
        const [{ data: paymentsData }, { data: ordersData }] = await Promise.all([
          patient.get("/admin/featured-payments"),
          patient.get("/admin/store-orders"),
        ]);
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch {
        if (!silent) {
          toast.error(t("dash.admin.toast.loadFail"));
          setPayments([]);
          setOrders([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab !== "payments") return undefined;
    const id = setInterval(() => {
      void loadData({ silent: true });
    }, 15000);
    return () => clearInterval(id);
  }, [activeTab, loadData]);

  const getTotalPayments = () => payments.reduce((sum, p) => sum + (Number(p.amountPKR) || 0), 0);

  const getTotalOrders = () => orders.reduce((sum, o) => sum + orderLineTotal(o), 0);

  const getOrdersCount = () => orders.length;
  const getPaymentsCount = () => payments.length;

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await patient.patch(`/store/orders/${orderId}/status`, { status: newStatus });
      toast.success(tp("toastOrderUpdated", { status: t(`dash.store.orderStatus.${newStatus}`) }));
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || tp("toastOrderUpdateFail"));
    }
  };

  if (activeTab !== "payments") return null;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader />
      </div>
    );
  }

  const selectedPayment = payments.find((p) => p._id === selectedPaymentId);
  const selectedOrder = orders.find((o) => o._id === selectedOrderId);
  const orderStatuses = ["pending", "confirmed", "delivered", "cancelled"];

  const paymentStatusLabel = (ps) => {
    if (ps === "completed") return tp("payCompleted");
    if (ps === "failed") return tp("payFailed");
    return tp("payPending");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("statFeatured")}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{getPaymentsCount()}</p>
          <p className="mt-1 text-sm text-slate-600">PKR {getTotalPayments().toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("statStoreOrders")}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{getOrdersCount()}</p>
          <p className="mt-1 text-sm text-slate-600">PKR {getTotalOrders().toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("statAvgFeatured")}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {getPaymentsCount() > 0 ? (getTotalPayments() / getPaymentsCount()).toFixed(0) : 0}
          </p>
          <p className="mt-1 text-sm text-slate-600">{tp("statAvgFeaturedHint")}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("statAvgOrder")}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {getOrdersCount() > 0 ? (getTotalOrders() / getOrdersCount()).toFixed(0) : 0}
          </p>
          <p className="mt-1 text-sm text-slate-600">{tp("statAvgOrderHint")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">{tp("sectionFeaturedTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{tp("sectionFeaturedSubtitle")}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">{t("dash.admin.charts.noData")}</div>
            ) : (
              payments.slice(0, 8).map((payment) => (
                <button
                  key={payment._id}
                  type="button"
                  onClick={() => setSelectedPaymentId(payment._id)}
                  className={`w-full px-6 py-4 text-left transition hover:bg-slate-50 ${
                    selectedPaymentId === payment._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">PKR {Number(payment.amountPKR || 0).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {tp("days", { n: payment.days })} • {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      {tp("paid")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {payments.length > 8 && (
            <div className="border-t border-slate-100 px-6 py-3 text-center text-sm text-slate-500">
              {tp("morePayments", { count: payments.length - 8 })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-900">{tp("sectionStoreTitle")}</h3>
            <p className="mt-1 text-sm text-slate-500">{tp("sectionStoreSubtitle")}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">{t("dash.admin.charts.noData")}</div>
            ) : (
              orders.slice(0, 8).map((order) => (
                <button
                  key={order._id}
                  type="button"
                  onClick={() => setSelectedOrderId(order._id)}
                  className={`w-full px-6 py-4 text-left transition hover:bg-slate-50 ${
                    selectedOrderId === order._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{order.storeItem?.name || tp("unknownItem")}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {tp("orderSummary", {
                          qty: order.quantity,
                          amount: orderLineTotal(order).toLocaleString(),
                        })}
                      </p>
                      {order.paymentStatus != null && (
                        <p className="mt-1 text-xs text-slate-400">
                          {order.paymentMethod === "stripe" ? tp("payCard") : tp("payCod")} • {paymentStatusLabel(order.paymentStatus)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        order.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status === "delivered"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t(`dash.store.orderStatus.${order.status || "pending"}`, {
                        defaultValue: order.status,
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {orders.length > 8 && (
            <div className="border-t border-slate-100 px-6 py-3 text-center text-sm text-slate-500">
              {tp("moreOrders", { count: orders.length - 8 })}
            </div>
          )}
        </div>
      </div>

      {selectedPayment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{tp("detailFeatured")}</h3>
            <button type="button" onClick={() => setSelectedPaymentId(null)} className="text-slate-500 hover:text-slate-700">
              ✕
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelPaymentId")}</p>
              <p className="mt-2 font-mono text-sm text-slate-900">{String(selectedPayment._id)}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelAmount")}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">PKR {Number(selectedPayment.amountPKR || 0).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelDuration")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{tp("days", { n: selectedPayment.days })}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelPaymentDate")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{new Date(selectedPayment.paidAt).toLocaleDateString()}</p>
            </div>

            {selectedPayment.stripeSessionId && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelStripeSession")}</p>
                <p className="mt-2 font-mono text-sm text-slate-900">{selectedPayment.stripeSessionId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{tp("detailOrder")}</h3>
            <button type="button" onClick={() => setSelectedOrderId(null)} className="text-slate-500 hover:text-slate-700">
              ✕
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelOrderId")}</p>
              <p className="mt-2 font-mono text-sm text-slate-900">{String(selectedOrder._id)}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelItemName")}</p>
              <p className="mt-2 font-semibold text-slate-900">{selectedOrder.storeItem?.name || tp("unknownItem")}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelQuantity")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.quantity}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelUnitPrice")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">PKR {Number(selectedOrder.unitPricePKR || 0).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelLineTotal")}</p>
              <p className="mt-2 text-2xl font-bold text-brand-600">PKR {orderLineTotal(selectedOrder).toLocaleString()}</p>
            </div>

            {selectedOrder.paymentMethod != null && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelPaymentMethod")}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedOrder.paymentMethod === "stripe" ? tp("methodStripe") : tp("methodCod")}
                </p>
              </div>
            )}

            {selectedOrder.paymentStatus != null && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelPaymentStatus")}</p>
                <p
                  className={`mt-2 text-lg font-semibold ${
                    selectedOrder.paymentStatus === "completed"
                      ? "text-green-600"
                      : selectedOrder.paymentStatus === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {paymentStatusLabel(selectedOrder.paymentStatus)}
                </p>
              </div>
            )}

            {selectedOrder.deliveryLocation?.address && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelDeliveryAddress")}</p>
                <p className="mt-2 text-sm text-slate-900">{selectedOrder.deliveryLocation.address}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{tp("labelStatus")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {orderStatuses.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateOrderStatus(selectedOrder._id, st)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedOrder.status === st
                        ? st === "confirmed"
                          ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                          : st === "delivered"
                            ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                            : st === "cancelled"
                              ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                              : "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300"
                        : st === "confirmed"
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : st === "delivered"
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : st === "cancelled"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    }`}
                  >
                    {t(`dash.store.orderStatus.${st}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStorePaymentsSection;
