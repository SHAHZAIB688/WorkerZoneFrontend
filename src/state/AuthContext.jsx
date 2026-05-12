import { createContext, useCallback, useContext, useMemo, useState } from "react";
import patient from "../api/client";

const AuthContext = createContext(null);

const normalizeAuthUser = (doc) => ({
  id: doc._id ?? doc.id,
  name: doc.name,
  email: doc.email,
  role: doc.role,
  phone: doc.phone ?? "",
  status: doc.status,
  specialization: doc.specialization ?? "",
  experience: doc.experience ?? 0,
  degreeFile: doc.degreeFile ?? "",
  locationCity: doc.locationCity ?? "",
  locationAddress: doc.locationAddress ?? "",
  locationLat: doc.locationLat ?? null,
  locationLng: doc.locationLng ?? null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (payload) => {
    const { data } = await patient.post("/auth/login", payload);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const authWithGoogle = async ({ idToken, role = "patient" }) => {
    const { data } = await patient.post("/auth/google", { idToken, role });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const isDoctor = payload.role === "doctor";
    let requestBody = payload;
    let config = {};

    if (isDoctor) {
      requestBody = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) requestBody.append(key, value);
      });
      config = { headers: { "Content-Type": "multipart/form-data" } };
    }

    const { data } = await patient.post("/auth/register", requestBody, config);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const { data } = await patient.get("/auth/me");
    const normalized = normalizeAuthUser(data);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  }, []);

  const value = useMemo(() => ({ user, login, register, authWithGoogle, logout, refreshUser }), [user, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
