import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import patient, { buildBackendAssetUrl } from "../../../api/client";
import Loader from "../../../components/Loader";
import OrderLocationMap from "../../../components/OrderLocationMap";

const PatientStoreOrdersSection = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patient.get("/store/my-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const selectedOrder = orders.find((o) => o._id === selectedOrderId);

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
        <h2 className="text-xl font-bold text-slate-900">My Store Orders</h2>
        <p className="mt-1 text-sm text-slate-600">Track your store item orders and delivery status</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {orders.map((order) => (
              <button
                key={order._id}
                onClick={() => setSelectedOrderId(order._id)}
                className={`rounded-2xl border-2 bg-white p-4 text-left transition ${
                  selectedOrderId === order._id
                    ? "border-brand-600 shadow-lg"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900">{order.storeItem?.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Qty: {order.quantity} × PKR {Number(order.unitPrice || 0).toLocaleString()} = PKR{" "}
                      {Number(order.lineTotal || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedOrder && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedOrder.storeItem?.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">Order ID: {selectedOrder._id}</p>
                </div>
                <button onClick={() => setSelectedOrderId(null)} className="text-slate-500 hover:text-slate-700 text-xl">
                  ✕
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Quantity</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.quantity}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Unit Price</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    PKR {Number(selectedOrder.unitPrice || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Amount</p>
                  <p className="mt-2 text-2xl font-bold text-brand-600">
                    PKR {Number(selectedOrder.lineTotal || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Order Notes</p>
                  <p className="mt-2 text-sm text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="mt-4 border-t border-slate-200 pt-4">
                <OrderLocationMap order={selectedOrder} isAdmin={false} />
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Timeline</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-600">
                    <span className="font-semibold">Ordered:</span> {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                  {selectedOrder.status !== "pending" && (
                    <p className="text-slate-600">
                      <span className="font-semibold">Updated:</span> {new Date(selectedOrder.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientStoreOrdersSection;
