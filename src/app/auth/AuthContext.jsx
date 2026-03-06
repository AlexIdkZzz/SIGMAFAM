import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("sigmafam_token"));
  const [loading, setLoading] = useState(true); // arranca en true para hidratar sesión

  // Al montar, si hay token guardado intenta recuperar la sesión
  useEffect(() => {
    if (token) {
      // Decodifica el payload del JWT (sin verificar firma, solo para UI)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Si el token ya expiró, limpiamos
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          _clearSession();
        } else {
          setUser({ id: payload.id, email: payload.email, fullName: payload.fullName ?? "" });
        }
      } catch {
        _clearSession();
      }
    }
    setLoading(false);
  }, []);

  function _clearSession() {
    localStorage.removeItem("sigmafam_token");
    setToken(null);
    setUser(null);
  }

  // ── LOGIN REAL ──────────────────────────────────────────────────────────────
  async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Lanza el mensaje de error que venga del backend
      throw new Error(data.error ?? data.message ?? "Error al iniciar sesión");
    }

    // El backend devuelve { access_token, user }
    const { access_token, user: userData } = data;

    localStorage.setItem("sigmafam_token", access_token);
    setToken(access_token);
    setUser(userData);

    return userData;
  }

  // ── REGISTRO REAL ───────────────────────────────────────────────────────────
  async function register(fullName, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? data.message ?? "Error al registrarse");
    }

    return data; // puede devolver el usuario creado o un mensaje de éxito
  }

  // ── LOGOUT ──────────────────────────────────────────────────────────────────
  function logout() {
    _clearSession();
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}