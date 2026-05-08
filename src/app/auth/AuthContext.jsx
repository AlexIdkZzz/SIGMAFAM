import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("sigmafam_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          _clearSession();
        } else {
          setUser({
            id:       payload.id,
            email:    payload.email,
            fullName: payload.fullName ?? "",
            role:     payload.role?.toUpperCase() ?? null,
          });
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

  async function login(email, password) {
    const res  = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? "Error al iniciar sesión");

    const { access_token, user: userData } = data;
    localStorage.setItem("sigmafam_token", access_token);
    setToken(access_token);
    const normalizedUser = { ...userData, role: userData.role?.toUpperCase() ?? null };
    setUser(normalizedUser);
    return normalizedUser;
  }

  async function register(fullName, email, password) {
    const res  = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.message ?? "Error al registrarse");
    return data;
  }

  function logout() {
    _clearSession();
  }

  /**
   * Actualiza el JWT en localStorage y el estado del usuario (ej. tras cambio de rol).
   * Lo llaman Family.jsx después de crear o unirse a un grupo familiar.
   */
  function updateAuth(newToken) {
    try {
      const payload = JSON.parse(atob(newToken.split(".")[1]));
      localStorage.setItem("sigmafam_token", newToken);
      setToken(newToken);
      setUser({
        id:       payload.id,
        email:    payload.email,
        fullName: payload.fullName ?? "",
        role:     payload.role?.toUpperCase() ?? null,
      });
    } catch (e) {
      console.error("[AuthContext] updateAuth: token inválido", e);
    }
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateAuth }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}