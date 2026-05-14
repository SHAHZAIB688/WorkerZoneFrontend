import { useEffect, useState } from "react";

const OrderLocationMap = ({ order, isAdmin, onUpdateLocation }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const hasLocation = order?.deliveryLocation?.latitude && order?.deliveryLocation?.longitude;

  const openMap = () => {
    if (hasLocation) {
      const { latitude, longitude } = order.deliveryLocation;
      window.open(
        `https://www.google.com/maps/search/${latitude},${longitude}`,
        "_blank"
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Delivery Location</h3>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {showMap ? "Hide" : "Set Location"}
          </button>
        )}
      </div>

      {hasLocation ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Coordinates</p>
            <p className="mt-1 font-mono text-sm text-slate-700">
              {order.deliveryLocation.latitude.toFixed(6)}, {order.deliveryLocation.longitude.toFixed(6)}
            </p>
          </div>
          
          {order.deliveryLocation.address && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Address</p>
              <p className="mt-1 text-sm text-slate-700">{order.deliveryLocation.address}</p>
            </div>
          )}

          <button
            type="button"
            onClick={openMap}
            className="w-full rounded-xl border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100"
          >
            View on Google Maps
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">
            {isAdmin ? "No delivery location set" : "Delivery location will be shown here"}
          </p>
        </div>
      )}

      {showMap && isAdmin && onUpdateLocation && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <LocationSetter onSubmit={onUpdateLocation} onCancel={() => setShowMap(false)} />
        </div>
      )}
    </div>
  );
};

const LocationSetter = ({ onSubmit, onCancel }) => {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLoading(false);
      },
      () => {
        alert("Unable to get location");
        setLoading(false);
      }
    );
  };

  const submit = () => {
    if (!lat || !lng) {
      alert("Please enter coordinates or get current location");
      return;
    }
    onSubmit({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      address: address.trim(),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700">Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Latitude"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="Longitude"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700">Address (Optional)</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street address, building name, etc."
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "Getting..." : "Get Current Location"}
        </button>
      </div>

      <div className="flex gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={submit}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Save Location
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OrderLocationMap;
