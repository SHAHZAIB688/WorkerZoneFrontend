import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../i18n/config";
import { reverseGeocodePlaceName } from "../utils/reverseGeocode";

const STORAGE_KEY = "perscripto-browser-geo";

const readStored = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    const lat = Number(j?.lat);
    const lng = Number(j?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const placeLabel = typeof j?.placeLabel === "string" && j.placeLabel.trim() ? j.placeLabel.trim() : null;
    return { lat, lng, placeLabel };
  } catch {
    /* ignore */
  }
  return null;
};

const BrowserLocationContext = createContext(null);

export function BrowserLocationProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = typeof sessionStorage !== "undefined" ? readStored() : null;
    if (stored) {
      return {
        status: "ready",
        lat: stored.lat,
        lng: stored.lng,
        placeLabel: stored.placeLabel,
        error: null,
      };
    }
    return { status: "idle", lat: null, lng: null, placeLabel: null, error: null };
  });

  const persist = useCallback((lat, lng, placeLabel) => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lat,
          lng,
          placeLabel: placeLabel || null,
        })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", lat: null, lng: null, placeLabel: null, error: "unsupported" });
      return Promise.resolve(null);
    }
    setState((s) => ({ ...s, status: "loading", error: null }));
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const fallback = `${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)}`;
          const placeLabel = (await reverseGeocodePlaceName(lat, lng, i18n.language)) || fallback;
          persist(lat, lng, placeLabel);
          setState({ status: "ready", lat, lng, placeLabel, error: null });
          resolve({ lat, lng, placeLabel });
        },
        () => {
          setState({ status: "error", lat: null, lng: null, placeLabel: null, error: "denied" });
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      );
    });
  }, [persist]);

  const clear = useCallback(() => {
    clearStorage();
    setState({ status: "idle", lat: null, lng: null, placeLabel: null, error: null });
  }, [clearStorage]);

  useEffect(() => {
    if (state.status !== "ready" || state.lat == null || state.lng == null || state.placeLabel) return;
    let cancelled = false;
    (async () => {
      const name = await reverseGeocodePlaceName(state.lat, state.lng, i18n.language);
      if (cancelled) return;
      const fallback = `${Number(state.lat).toFixed(2)}, ${Number(state.lng).toFixed(2)}`;
      const placeLabel = name || fallback;
      persist(state.lat, state.lng, placeLabel);
      setState((s) =>
        s.status === "ready" && s.lat === state.lat && s.lng === state.lng && !s.placeLabel
          ? { ...s, placeLabel }
          : s
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status, state.lat, state.lng, state.placeLabel, persist]);

  const selectPresetLocation = useCallback(
    (lat, lng, placeLabel) => {
      const la = Number(lat);
      const ln = Number(lng);
      if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
      const label = typeof placeLabel === "string" && placeLabel.trim() ? placeLabel.trim() : `${la.toFixed(2)}, ${ln.toFixed(2)}`;
      persist(la, ln, label);
      setState({ status: "ready", lat: la, lng: ln, placeLabel: label, error: null });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      status: state.status,
      lat: state.lat,
      lng: state.lng,
      placeLabel: state.placeLabel,
      error: state.error,
      requestLocation,
      selectPresetLocation,
      clear,
    }),
    [state.status, state.lat, state.lng, state.placeLabel, state.error, requestLocation, selectPresetLocation, clear]
  );

  return <BrowserLocationContext.Provider value={value}>{children}</BrowserLocationContext.Provider>;
}

export function useBrowserLocation() {
  const ctx = useContext(BrowserLocationContext);
  if (!ctx) {
    throw new Error("useBrowserLocation must be used within BrowserLocationProvider");
  }
  return ctx;
}
