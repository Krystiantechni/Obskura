import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { auth as authApi } from "../lib/apiClient.js";
import { getToken, setToken, clearToken } from "../lib/authToken.js";

const AuthContext = createContext(null);

// status: "loading" | "authed" | "guest"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Init leniwy z obecności tokenu — bez synchronicznego setState w efekcie
  // (reguła react-hooks/set-state-in-effect). Token jest → hydratujemy ("loading"), inaczej "guest".
  const [status, setStatus] = useState(() => (getToken() ? "loading" : "guest"));

  // Hydratacja sesji po tokenie na mount (tylko gdy token istnieje).
  useEffect(() => {
    if (!getToken()) return undefined;
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authed");
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setStatus("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 401 z dowolnego żądania auth:true → apiClient emituje "auth:logout".
  useEffect(() => {
    const onLogout = () => {
      clearToken(); // samowystarczalność — nie polegaj na kolejności czyszczenia w apiClient
      setUser(null);
      setStatus("guest");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback(async (creds) => {
    const { user: u, token } = await authApi.login(creds);
    setToken(token);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, token } = await authApi.register(payload);
    setToken(token);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — i tak czyścimy lokalnie */
    }
    clearToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      /* best-effort */
    }
    clearToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, logoutAll }),
    [user, status, login, register, logout, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node };

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi być użyty wewnątrz <AuthProvider>");
  return ctx;
}
